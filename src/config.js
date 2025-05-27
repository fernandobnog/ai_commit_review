// config.js

import path from "path";
import fs from "fs-extra";
import os from "os";

/**
 * Function to get the appropriate configuration directory based on the operating system.
 * @returns {string} Path to the configuration directory.
 */
function getConfigDirectory() {
  const homeDir = os.homedir();
  let configDir;

  if (process.platform === "win32") {
    const appData =
      process.env.APPDATA || path.join(homeDir, "AppData", "Roaming");
    configDir = path.join(appData, "ai-commit-review");
  } else if (process.platform === "darwin") {
    configDir = path.join(
      homeDir,
      "Library",
      "Application Support",
      "ai-commit-review"
    );
  } else {
    const xdgConfigHome =
      process.env.XDG_CONFIG_HOME || path.join(homeDir, ".config");
    configDir = path.join(xdgConfigHome, "ai-commit-review");
  }

  return configDir;
}

// Persistent configuration directory
const configDirectory = getConfigDirectory();

// Ensure the configuration directory exists
try {
  fs.ensureDirSync(configDirectory);
} catch (error) {
  console.error(
    `Error creating the configuration directory at ${configDirectory}:`,
    error
  );
}

// Full path to the configuration file
const configFilePath = path.join(configDirectory, ".config.json");

/**
 * Loads the configuration from the .config.json file.
 * @returns {Object} Configuration object or an empty object if the file does not exist or an error occurs.
 */
export function loadConfig() {
  try {
    if (fs.existsSync(configFilePath)) {
      console.log(`Loading configurations from: ${configFilePath}`);
      return fs.readJsonSync(configFilePath);
    } else {
      console.log(
        `Configuration file not found at: ${configFilePath}. Using default configurations.`
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
export function saveConfig(config) {
  try {
    fs.writeJsonSync(configFilePath, config, { spaces: 2 });
    console.log(`Configurations successfully saved to: ${configFilePath}`);
  } catch (error) {
    console.error("Error saving configurations:", error);
  }
}

export { configFilePath };
