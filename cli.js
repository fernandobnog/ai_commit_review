import chalk from "chalk";
import { program } from "commander";
import inquirer from "inquirer";
import { showHelp } from "./helpers.js";
import { loadConfig } from "./config.js";
import { updateConfigFromString } from "./configManager.js";
import { analyzeCommits } from "./analyzeCommit.js"; // Analyze commits
import { createCommit } from "./createCommit.js"; // Create commits
import i18n from "i18n";
import path from "path";
import { ConfigKeys } from "./models.js";

const config = loadConfig();
function setLanguageArray() {
  return Object.values(ConfigKeys.OPENAI_RESPONSE_LANGUAGE).map(
    (lang) => lang.code
  );
}

i18n.configure({
  locales: setLanguageArray(),
  directory: path.join(process.cwd(), "locales"),
  defaultLocale: config[ConfigKeys.OPENAI_RESPONSE_LANGUAGE] || "en",
  objectNotation: true,
});

// Middleware para usar globalmente
global.__ = i18n.__;

// Custom help information
program.helpInformation = showHelp;

program
  .name(i18n.__("program.name"))
  .description(i18n.__("program.description"));

// Command to analyze commits
program
  .command("analyze")
  .description(i18n.__("commands.analyze.description"))
  .action(async () => {
    await analyzeCommits();
  });

// Command to create a new commit
program
  .command("create")
  .description(i18n.__("commands.create.description"))
  .action(async () => {
    await createCommit();
  });

// Command to update configurations
program
  .command("set_config <keyValue>")
  .description(i18n.__("commands.set_config.description"))
  .action((keyValue) => {
    try {
      updateConfigFromString(keyValue);
    } catch (error) {
      console.error(
        chalk.red(
          `${i18n.__("messages.error_updating_config")} ${error.message}`
        )
      );
    }
  });

// Guide user if no command is passed
if (!process.argv.slice(2).length) {
  console.log(chalk.yellow(i18n.__("messages.no_command_provided")));
  console.log(chalk.yellow(i18n.__("messages.tested_on")));
  (async () => {
    const { command } = await inquirer.prompt([
      {
        type: "list",
        name: "command",
        message: i18n.__("messages.prompt"),
        choices: [
          { name: i18n.__("messages.choices.analyze"), value: "analyze" },
          { name: i18n.__("messages.choices.create"), value: "create" },
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
