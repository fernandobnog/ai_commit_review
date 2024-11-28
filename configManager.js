// configManager.js

import chalk from "chalk";
import { loadConfig, saveConfig } from "./config.js";
import { OpenAIModels, ConfigKeys, SupportedLanguages } from "./models.js";
import i18n from "./i18n.js"; // Importe a configuração do i18n

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
        i18n.__(
          "configManager.setDefaultModel.defaulting",
          OpenAIModels.GPT_4O_MINI
        )
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
    const defaultLanguage = SupportedLanguages.EN_US;
    config[ConfigKeys.OPENAI_RESPONSE_LANGUAGE] = defaultLanguage.code;
    saveConfig(config);
    console.log(
      chalk.green(
        i18n.__(
          "configManager.setDefaultLanguage.defaulting",
          defaultLanguage.code,
          defaultLanguage.name
        )
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
      i18n.__("configManager.validateConfiguration.errorMissingApiKey")
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
    throw new Error(
      i18n.__("configManager.updateConfigFromString.errorInvalidFormat")
    );
  }

  const key = configString.substring(0, index).trim().toUpperCase();
  const value = configString.substring(index + 1).trim();

  if (!key || !value) {
    throw new Error(
      i18n.__("configManager.updateConfigFromString.errorInvalidFormat")
    );
  }

  // Validate the configuration key
  const validKeys = Object.values(ConfigKeys);
  if (!validKeys.includes(key)) {
    const availableKeys = validKeys.map((k) => `  - ${k}`).join("\n");
    throw new Error(
      i18n.__(
        "configManager.updateConfigFromString.errorInvalidKey",
        key,
        availableKeys
      )
    );
  }

  // Validate the AI model if the key is OPENAI_API_MODEL
  if (key === ConfigKeys.OPENAI_API_MODEL) {
    const validModels = Object.values(OpenAIModels);
    if (!validModels.includes(value)) {
      const availableModels = validModels
        .map((model) => `  - ${model}`)
        .join("\n");
      throw new Error(
        i18n.__(
          "configManager.updateConfigFromString.errorInvalidModel",
          availableModels
        )
      );
    }
  }

  // Validate the language if the key is OPENAI_RESPONSE_LANGUAGE
  if (key === ConfigKeys.OPENAI_RESPONSE_LANGUAGE) {
    const validLanguages = Object.values(SupportedLanguages).map(
      (lang) => `${lang.code}: ${lang.name}`
    );
    const availableLanguages = Object.values(SupportedLanguages)
      .map((lang) => `  - ${lang.code}: ${lang.name}`)
      .join("\n");
    if (
      !Object.values(SupportedLanguages).some((lang) => lang.code === value)
    ) {
      throw new Error(
        i18n.__(
          "configManager.updateConfigFromString.errorInvalidLanguage",
          value,
          availableLanguages
        )
      );
    }
  }

  // Save the configuration
  const config = loadConfig();
  config[key] = value;
  saveConfig(config);

  console.log(
    chalk.green(
      i18n.__("configManager.updateConfigFromString.successUpdate", key)
    )
  );
}
