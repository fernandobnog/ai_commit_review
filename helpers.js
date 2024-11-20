// helpers.js

import chalk from "chalk";
import { loadConfig, saveConfig } from "./config.js";
import { OpenAIModels, ConfigKeys, SupportedLanguages } from "./models.js";

/**
 * Sets the default OpenAI model to 'gpt-4o-mini' if not already set.
 * @param {object} config - The current configuration object.
 * @returns {object} - The updated configuration object.
 */
function setDefaultModel(config) {
  if (!config[ConfigKeys.OPENAI_API_MODEL]) {
    config[ConfigKeys.OPENAI_API_MODEL] = OpenAIModels.GPT_4O_MINI;
    saveConfig(config);
    console.log(
      chalk.green(
        `✅ OPENAI_API_MODEL not set. Defaulting to '${OpenAIModels.GPT_4O_MINI}'.`
      )
    );
  }
  return config;
}

/**
 * Sets the default language to English (US) if not already set.
 * @param {object} config - The current configuration object.
 * @returns {object} - The updated configuration object.
 */
function setDefaultLanguage(config) {
  if (!config[ConfigKeys.OPENAI_RESPONSE_LANGUAGE]) {
    config[ConfigKeys.OPENAI_RESPONSE_LANGUAGE] =
      SupportedLanguages.EN_US.code;
    saveConfig(config);
    console.log(
      chalk.green(
        `✅ OPENAI_RESPONSE_LANGUAGE not set. Defaulting to '${SupportedLanguages.EN_US.code}: ${SupportedLanguages.EN_US.name}'.`
      )
    );
  }
  return config;
}

/**
 * Validates the current configuration.
 * @returns {object} - The validated configuration object.
 * @throws Will throw an error if mandatory configurations are missing or invalid.
 */
export function validateConfiguration() {
  const config = loadConfig();

  // Set default model if not set
  setDefaultModel(config);

  // Set default language if not set
  setDefaultLanguage(config);

  if (!config.OPENAI_API_KEY) {
    throw new Error(
      "OpenAI API key not configured.\n\nUse 'gcr set_config OPENAI_API_KEY=your-key' to configure it."
    );
  }

  return config;
}

/**
 * Updates the configuration from a key-value string.
 * @param {string} configString - The configuration string in the format KEY=VALUE.
 * @throws Will throw an error if the format is invalid or if the key/value is not supported.
 */
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

  // Validate the language if the key is OPENAI_RESPONSE_LANGUAGE
  if (key === ConfigKeys.OPENAI_RESPONSE_LANGUAGE) {
    const validLanguages = Object.values(SupportedLanguages).map(
      (lang) => lang.code
    );
    if (!validLanguages.includes(value)) {
      throw new Error(
        `❌ Invalid language code "${value}" provided.\n\n` +
          `Supported languages:\n` +
          Object.values(SupportedLanguages)
            .map((lang) => `  - ${lang.code}: ${lang.name}`)
            .join("\n") +
          `\n\nUse one of the listed language codes.`
      );
    }
  }
  // Save the configuration
  const config = loadConfig();
  config[key] = value;
  saveConfig(config);

  console.log(chalk.green(`\n✅ Configuration "${key}" updated.`));
}

/**
 * Displays the help message to the user.
 */
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
  - ${chalk.yellow(
    "OPENAI_RESPONSE_LANGUAGE"
  )}: The language for AI responses (e.g., English (US), Spanish).

${chalk.bold("Commands:")}
  ${chalk.cyan("gcr <COMMIT_SHA>")}        Analyzes a specific commit.
  ${chalk.cyan(
    "gcr set_config"
  )}          Updates configurations (e.g., OPENAI_API_KEY, OPENAI_API_MODEL, OPENAI_RESPONSE_LANGUAGE).
  ${chalk.cyan("gcr help")}                Displays this help message.

${chalk.bold("Examples:")}
  ${chalk.cyan("gcr 123456")}              Analyzes the commit with SHA 123456.
  ${chalk.cyan("gcr set_config OPENAI_API_KEY=your-key")}
  ${chalk.cyan("gcr set_config OPENAI_API_MODEL=gpt-4")}
  ${chalk.cyan("gcr set_config OPENAI_RESPONSE_LANGUAGE=Spanish")}
  `);
}
