// config.js

import path from "path";
import fs from "fs-extra";
import os from "os";

/**
 * Function to get the appropriate configuration directory based on the operating system.
 * @returns {string} Path to the configuration directory.
 */
export function getConfigDirectory(overridePlatform, overrideEnv = process.env, overrideHomeDir = os.homedir()) {
  const platform = overridePlatform || process.platform;
  const homeDir = overrideHomeDir;
  let configDir;

  if (platform === "win32") {
    const appData = overrideEnv.APPDATA || path.join(homeDir, "AppData", "Roaming");
    configDir = path.join(appData, "ai-commit-review");
  } else if (platform === "darwin") {
    configDir = path.join(
      homeDir,
      "Library",
      "Application Support",
      "ai-commit-review"
    );
  } else {
    const xdgConfigHome = overrideEnv.XDG_CONFIG_HOME || path.join(homeDir, ".config");
    configDir = path.join(xdgConfigHome, "ai-commit-review");
  }

  return configDir;
}

// Persistent configuration directory
const configDirectory = getConfigDirectory();

/**
 * Assigura a criação do diretório de configuração.
 * @returns {boolean} true se o diretório existe/foi criado com sucesso, false em caso de erro.
 */
export function ensureConfigDirectory() {
  try {
    fs.ensureDirSync(configDirectory);
    return true;
  } catch (error) {
    console.error(
      `Error creating the configuration directory at ${configDirectory}:`,
      error
    );
    return false;
  }
}

ensureConfigDirectory();

// Full path to the configuration file
const configFilePath = path.join(configDirectory, ".config.json");

/**
 * Exclui o arquivo de configuração (.config.json) caso exista.
 * @returns {boolean} true se o arquivo foi excluído, false caso não exista ou ocorra erro.
 */
export function deleteConfigFile(filePath = process.env.ACR_CONFIG_FILE || configFilePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.removeSync(filePath);
      console.log(`Arquivo de configuração excluído: ${filePath}`);
      return true;
    } else {
      console.log(`Arquivo de configuração não encontrado: ${filePath}`);
    }
  } catch (error) {
    console.error("Erro ao excluir o arquivo de configuração:", error);
  }
  return false;
}

/**
 * Loads the configuration from the .config.json file.
 * @returns {Object} Configuration object or an empty object if the file does not exist or an error occurs.
 */
export function loadConfig(filePath = process.env.ACR_CONFIG_FILE || configFilePath) {
  try {
    if (fs.existsSync(filePath)) {
      console.log(`Loading configurations from: ${filePath}`);
      return fs.readJsonSync(filePath);
    } else {
      console.log(
        `Configuration file not found at: ${filePath}. Using default configurations.`
      );
    }
  } catch (error) {
    console.error("Error loading configurations:", error);
  }
  return {};
}

/**
 * Saves the configuration to the .config.json file.
 * @param {Object} config - Configuration object to save.
 */
export function saveConfig(config, filePath = process.env.ACR_CONFIG_FILE || configFilePath) {
  try {
    fs.ensureDirSync(path.dirname(filePath));
    fs.writeJsonSync(filePath, config, { spaces: 2 });
    console.log(`Configurations successfully saved to: ${filePath}`);
  } catch (error) {
    console.error("Error saving configurations:", error);
  }
}

export { configFilePath };
