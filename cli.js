#!/usr/bin/env node

import { program } from "commander";
import chalk from "chalk";
import {
  validateConfiguration,
  updateConfigFromString,
  showHelp,
} from "./helpers.js";
import { getModifiedFiles, getFileDiff } from "./gitUtils.js";
import { analyzeUpdatedCode } from "./openaiUtils.js";

program
  .name("gcr")
  .description(
    "A tool to analyze commits with AI from the local Git repository"
  );

// Default command to analyze a commit
program
  .argument(
    "[sha]",
    "SHA of the commit to be analyzed or 'help' to display instructions"
  )
  .action(async (sha) => {
    if (!sha || sha === "help") {
      showHelp(); // Show help if no argument or 'help' is provided
      return;
    }

    try {
      validateConfiguration();

      console.log(
        chalk.blueBright(
          `📂 Fetching modified files for commit ${chalk.bold(sha)}...`
        )
      );
      const modifiedFiles = getModifiedFiles(sha);

      if (modifiedFiles.length === 0) {
        console.log(
          chalk.yellow("⚠️ No modified files found in the commit.")
        );
        return;
      }

      console.log(chalk.blueBright("📄 Reading file differences..."));
      const files = modifiedFiles
        .map(({ status, file }) => {
          let diff = "";
          try {
            diff = getFileDiff(sha, file);
            if (!diff) {
              console.warn(
                chalk.yellow(
                  `⚠️ No differences found for the file ${chalk.italic(
                    file
                  )}.`
                )
              );
              return null;
            }
            return { filename: file, content: diff, status };
          } catch (error) {
            console.error(
              chalk.red(
                `❌ Error reading differences for file ${chalk.bold(
                  file
                )}:`,
                error.message
              )
            );
            return null;
          }
        })
        .filter((file) => file !== null);

      if (files.length === 0) {
        console.log(
          chalk.yellow("⚠️ No valid differences found for analysis.")
        );
        return;
      }
      const analysis = await analyzeUpdatedCode(files);

      console.log(chalk.magentaBright("\nCode Analysis Result:\n"));
      console.log(chalk.magenta(analysis));
    } catch (error) {
      console.error(chalk.red("❌ Error:", error.message));
    }
  });

// Subcommand to update configurations
program
  .command("set_config")
  .description(
    "Updates configurations in the format KEY=VALUE (e.g., OPENAI_API_KEY=<value>)"
  )
  .argument("<keyValue>", "Configuration in the format KEY=VALUE")
  .action((keyValue) => {
    try {
      updateConfigFromString(keyValue);
    } catch (error) {
      console.error(
        chalk.red("❌ Error updating configuration:", error.message)
      );
    }
  });

// Displays custom help for the 'help' command
program
  .command("help")
  .description("Displays help")
  .action(() => {
    showHelp();
  });

// Parses the arguments
program.parse(process.argv);
