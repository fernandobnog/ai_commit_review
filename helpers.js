// helpers.js

import chalk from "chalk";
import { loadConfig, saveConfig } from "./config.js";
import { OpenAIModels, ConfigKeys } from "./models.js";

// Function to validate the configuration
export function validateConfiguration() {
  const config = loadConfig();

  if (!config.OPENAI_API_KEY) {
    throw new Error(
      "OpenAI API key not configured.\n\nUse 'gcr set_config OPENAI_API_KEY=your-key' to configure it."
    );
  }

  if (!config.OPENAI_API_MODEL) {
    throw new Error(
      "AI model not configured.\n\nUse 'gcr set_config OPENAI_API_MODEL=your-model' to configure it."
    );
  }

  return config;
}

// Function to update the configuration from a string
export function updateConfigFromString(configString) {
  const index = configString.indexOf("=");
  if (index === -1) {
    throw new Error("Invalid format.\n\nUse 'gcr set_config KEY=VALUE'");
  }

  const key = configString.substring(0, index).trim().toUpperCase();
  const value = configString.substring(index + 1).trim();

  if (!key || !value) {
    throw new Error("Invalid format.\n\nUse 'gcr set_config KEY=VALUE'");
  }

  // Validate the configuration key
  const validKeys = Object.values(ConfigKeys);
  if (!validKeys.includes(key)) {
    throw new Error(
      `Invalid configuration key "${key}".\n\n` +
        `Available keys:\n` +
        validKeys.map((k) => `  - ${k}`).join("\n") +
        `\n\nUse one of the listed keys.`
    );
  }

  // Validate the AI model if the key is OPENAI_API_MODEL
  if (key === ConfigKeys.OPENAI_API_MODEL) {
    const validModels = Object.values(OpenAIModels);
    if (!validModels.includes(value)) {
      throw new Error(
        `❌ Invalid AI model provided.\n\n` +
          `Available models:\n` +
          validModels.map((model) => `  - ${model}`).join("\n") +
          `\n\nUse one of the listed models.`
      );
    }
  }

  // Save the configuration
  const config = loadConfig();
  config[key] = value;
  saveConfig(config);

  console.log(chalk.green(`\n✅ Configuration "${key}" updated.`));
}

export function showHelp() {
  console.log(`
${chalk.bold("Usage:")}
  ${chalk.cyan("gcr <COMMIT_SHA> [commands]")}

${chalk.bold("Description:")}
  A tool to analyze commits and code with AI from the local Git repository.

${chalk.bold("Required Variables:")}
  - ${chalk.yellow("OPENAI_API_KEY")}: Your OpenAI API key.
  - ${chalk.yellow(
    "OPENAI_API_MODEL"
  )}: The AI model used for analysis (e.g., gpt-4, gpt-4-turbo).

${chalk.bold("Commands:")}
  ${chalk.cyan("gcr <COMMIT_SHA>")}        Analyzes a specific commit.
  ${chalk.cyan(
    "gcr set_config"
  )}          Updates configurations (e.g., OPENAI_API_KEY and OPENAI_API_MODEL).
  ${chalk.cyan("gcr help")}                Displays this help message.

${chalk.bold("Examples:")}
  ${chalk.cyan("gcr 123456")}              Analyzes the commit with SHA 123456.
  ${chalk.cyan("gcr set_config OPENAI_API_KEY=your-key")}
  ${chalk.cyan("gcr set_config OPENAI_API_MODEL=gpt-4")}
  `);
}
