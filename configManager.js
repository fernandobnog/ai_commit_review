//configManager.js

import chalk from "chalk";
import { loadConfig, saveConfig } from "./config.js";
import { OpenAIModels, ConfigKeys, SupportedLanguages } from "./models.js";
import inquirer from "inquirer";
import { configByNTAPPEmail, configBaseUrlLocal } from "./validateEmail.js";
import { decriptografar } from "./crypto.js";

import dotenv from "dotenv";
dotenv.config();

/**
 * Sets the default OpenAI model to 'gpt-4o-mini' if not already set.
 * @param {object} config - The current configuration object.
 * @returns {object} - The updated configuration object.
 */
export function setApiKeyOpenAINTapp() {
  const config = loadConfig();
  if (!config[ConfigKeys.OPENAI_API_KEY]) {
    const apiKey = decriptografar(process.env.CRIPTO_OPENAI_KEY);
    config[ConfigKeys.OPENAI_API_KEY] = apiKey;
    saveConfig(config);
    console.log(
      chalk.green(
        `✅ OPENAI_API_KEY not set. Defaulting to NTAPP.`
      )
    );
  }
  return config;
}


export async function setBaseURLOpenAILocal(config) {
  if (!config[ConfigKeys.OPENAI_API_BASEURL] && !config[ConfigKeys.OPENAI_API_MODEL]) {
    const isLocal = await configBaseUrlLocal();
    if(isLocal){
      config[ConfigKeys.OPENAI_API_BASEURL] = "http://127.0.0.1:1234/v1";
      config[ConfigKeys.OPENAI_API_MODEL] = OpenAIModels.DEEPSEEK_LOCAL;
      config[ConfigKeys.OPENAI_API_KEY] = "local";
      saveConfig(config);
      console.log(
        chalk.green(
          `✅ OPENAI_API_BASEURL for local AI is ok.`
        )
      );
    }
  }
  return config;
}

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
 * Sets the default language to Portuguese (PT-BR) if not already set.
 * @param {object} config - The current configuration object.
 * @returns {object} - The updated configuration object.
 */
function setDefaultLanguage(config) {
  if (!config[ConfigKeys.OPENAI_RESPONSE_LANGUAGE]) {
    config[ConfigKeys.OPENAI_RESPONSE_LANGUAGE] = SupportedLanguages.PT_BR.code;
    saveConfig(config);
    console.log(
      chalk.green(
        `✅ OPENAI_RESPONSE_LANGUAGE not set. Defaulting to '${SupportedLanguages.PT_BR.code}: ${SupportedLanguages.PT_BR.name}'.`
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
export async function validateConfiguration() {
  let config = loadConfig();

  config = await setBaseURLOpenAILocal(config);
  
  // Set default model if not set
  config = setDefaultModel(config);
  
  // Set default language if not set
  config = setDefaultLanguage(config);

  if (!config.OPENAI_API_KEY && !config.OPENAI_API_BASEURL) {
    const configurado = await configByNTAPPEmail();
    if (!configurado) {
      // Se updateValidApiKey for assíncrono, também use await
      await updateValidApiKey();
    }
  }

  return config;
}

export async function ensureValidApiKey() {
  try {
    // Tenta validar a configuração
    await validateConfiguration();
  } catch (error) {
    console.log(chalk.red("❌ ACR not configured."));

    // Aguarda a conclusão de configByNTAPPEmail e verifica o resultado
    const configurado = await configByNTAPPEmail();
    if (!configurado) {
      chalk.red("❌ ACR not configured. Set configs manualy.");
      process.exit(1); 
    }
  }
}

export async function updateValidApiKey() {
  const { apiKey } = await inquirer.prompt([
    {
      type: "input",
      name: "apiKey",
      message: "Please enter your OpenAI API key:",
    },
  ]);

  try {
    updateConfigFromString(`OPENAI_API_KEY=${apiKey}`);
    
    validateConfiguration();
  } catch (updateError) {
    console.error(
      chalk.red("❌ Failed to configure API key: " + updateError.message)
    );
    process.exit(1); // Sai se não for possível corrigir
  }
}

/**
 * Updates the configuration from a key-value string.
 * @param {string} configString - The configuration string in the format KEY=VALUE.
 * @throws Will throw an error if the format is invalid or if the key/value is not supported.
 */
export function updateConfigFromString(configString) {
  const index = configString.indexOf("=");
  if (index === -1) {
    throw new Error("Invalid format.\n\nUse 'acr set_config KEY=VALUE'");
  }

  const key = configString.substring(0, index).trim().toUpperCase();
  const value = configString.substring(index + 1).trim();

  if (!key || !value) {
    throw new Error("Invalid format.\n\nUse 'acr set_config KEY=VALUE'");
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
  validateConfiguration();
}
