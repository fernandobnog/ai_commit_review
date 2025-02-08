#!/usr/bin/env node
import dotenv from 'dotenv';
dotenv.config();

import chalk from "chalk";
import { program } from "commander";
import inquirer from "inquirer";
import { showHelp } from "./helpers.js";
import { updateConfigFromString, ensureValidApiKey } from "./configManager.js";
import { analyzeCommits } from "./analyzeCommit.js"; // Analyze commits
import { createCommit } from "./createCommit.js"; // Create commits
import { criptografarcli } from "./crypto.js"; // Encrypt/decrypt functionality

// Ensure a valid API key unless updating config or using the crypto command
if (!process.argv.includes("set_config") || !process.argv.includes("crypto")) {
  await ensureValidApiKey();
}

// Custom help information
program.helpInformation = showHelp;

program
  .name("acr")
  .description("A tool to analyze commits and create new ones with AI assistance");

// Command for encrypting and decrypting text
program
  .command("crypto")
  .description("Encrypt and decrypt text")
  .action(async () => {
    await criptografarcli();
  });

// Command to analyze commits
program
  .command("analyze")
  .description("Analyze individual or grouped commits from the local Git repository")
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
  .description("Update configurations with KEY=VALUE (e.g., OPENAI_API_KEY=<value>)")
  .action((keyValue) => {
    try {
      updateConfigFromString(keyValue);
    } catch (error) {
      console.error(chalk.red("❌ Error updating configuration:", error.message));
    }
  });

// Prompt the user if no command is provided
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
          { name: "Encrypt/Decrypt text", value: "crypto" }
        ],
      },
    ]);

    if (command === "analyze") {
      await analyzeCommits();
    } else if (command === "create") {
      await createCommit();
    } else if (command === "crypto") {
      await criptografarcli();
    }
  })();
} else {
  program.parse(process.argv);
}
