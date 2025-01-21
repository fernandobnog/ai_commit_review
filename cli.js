#!/usr/bin/env node

import chalk from "chalk";
import { program } from "commander";
import inquirer from "inquirer";
import { showHelp } from "./helpers.js";
import { updateConfigFromString, ensureValidApiKey } from "./configManager.js";
import { analyzeCommits } from "./analyzeCommit.js"; // Analyze commits
import { createCommit } from "./createCommit.js"; // Create commits
import { criptografarcli } from "./crypto.js"; // Create commits

if (!process.argv.includes("set_config") || !process.argv.includes("crypto")) {
  await ensureValidApiKey();
}

// Custom help information
program.helpInformation = showHelp;

program
  .name("acr")
  .description(
    "A tool to analyze commits and create new ones with AI assistance"
  );

// Command to analyze commits
program
  .command("crypto")
  .description("cryptografar e decriptografar")
  .action(async () => {
    await criptografarcli();
  });
// Command to analyze commits
program
  .command("analyze")
  .description("Analyze commits individuals or in groups from the local Git repository")
  .action(async () => {
    await analyzeCommits();
  });

// Command to create a new commit
program
  .command("create")
  .description("Create a new commit with AI assistance")
  .action(async () => {
    await createCommit();
  });

// Command to update configurations
program
  .command("set_config <keyValue>")
  .description(
    "Updates configurations in the format KEY=VALUE (e.g., OPENAI_API_KEY=<value>)"
  )
  .action((keyValue) => {
    try {
      updateConfigFromString(keyValue);
    } catch (error) {
      console.error(
        chalk.red("❌ Error updating configuration:", error.message)
      );
    }
  });

// Guide user if no command is passed
if (!process.argv.slice(2).length) {
  console.log(chalk.yellow("⚠️ No command provided."));
  (async () => {
    const { command } = await inquirer.prompt([
      {
        type: "list",
        name: "command",
        message: "What do you want to do?",
        choices: [
          { name: "Analyze commits", value: "analyze" },
          { name: "Create a new commit", value: "create" },
        ],
      },
    ]);

    if (command === "analyze") {
      await analyzeCommits();
    } else if (command === "create") {
      await createCommit();
    }
  })();
} else {
  program.parse(process.argv);
}
