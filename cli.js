#!/usr/bin/env node

import chalk from "chalk";
import { program } from "commander";
import { showHelp } from "./helpers.js";
import { updateConfigFromString } from "./configManager.js";
import { analyzeCommits } from "./analyzeCommit.js"; // Updated import

// Replaces the default help function with the custom one
program.helpInformation = showHelp;

program
  .name("gcr")
  .description(
    "A tool to analyze commits with AI from the local Git repository"
  )
  .action(async () => {
    await analyzeCommits();
  });

// Command to update configuration
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

program.parse(process.argv);
