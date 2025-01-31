//configManager.js

import chalk from "chalk";
import { loadConfig, saveConfig } from "./config.js";
import { OpenAIModels, ConfigKeys, SupportedLanguages } from "./models.js";
import inquirer from "inquirer";
import { configByNTAPPEmail, configBaseUrlLocal } from "./validateEmail.js";
import { decriptografar } from "./crypto.js";
import { Models } from "openai/resources/models.mjs";

/**
 * Sets the default OpenAI model to 'gpt-4o-mini' if not already set.
 * @param {object} config - The current configuration object.
 * @returns {object} - The updated configuration object.
 */
export function setApiKeyOpenAINTapp() {
  const config = loadConfig();
  if (!config[ConfigKeys.OPENAI_API_KEY]) {
    const apiKey = decriptografar("97964677f47a6e91d2b958b44603671e2eefb5c2a45459491d04fe4902d30f7137ad92b8b1722429d415fb18fbb9d11986e7dd3fcb45d684eecca82e5f1effb0a351266e3572df03769c91b83288fc34aace9633857200e321831ee58c3ca98ae9fd3820220d1f2c1d4a47b0df7e956d463db7ceaff04379355bc3b2bfa939acaace3169dd69d681951aa20459e990c566cfe271627d54a87cd52fc477f30a451b5e938e203b30cfee21d278c1fd2250f7dedc3dc0cd9b01fc412b0c6888289ebc2fe60b824402ff10754542fd1613b4c86b4c807a136f350aeadf87c67716ef3967e3c05a5396827483be67e2589e91c1346221bb431ddb4cf8dc0ef81098b4f1283c7a4675028685a32b5a6660e864fca431c05028f92d1280296accacf898ba5da2afa7c9343c56b5dbc315284edbdd12fa8ef94ffb625f80bc4d9b4fd1d1bd48046ca843917977e2d92a3345cf48a8ec40bb940ed0f5be3f6ca2c0ef59971de51fbc29b05db0d6326547213acb1b")
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


export async function setBaseURLOpenAILocal() {
  const config = loadConfig();
  if (!config[ConfigKeys.OPENAI_API_BASEURL]) {
    const isLocal = await configBaseUrlLocal();
    console.log(isLocal);
    if(isLocal){
      config[ConfigKeys.OPENAI_API_BASEURL] = "http://127.0.0.1:1234/v1";
      config[ConfigKeys.OPENAI_API_MODEL] = OpenAIModels.LLAMA_LOCAL;
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

  await setBaseURLOpenAILocal();

  const config = loadConfig();
  // Set default model if not set
  setDefaultModel(config);


  // Set default language if not set
  setDefaultLanguage(config);

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
