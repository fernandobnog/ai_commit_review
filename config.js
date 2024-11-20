// config.js

import path from "path";
import { fileURLToPath } from "url";
import fs from "fs-extra";

// Uses import.meta.url to get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to save the configurations
const configFilePath = path.resolve(__dirname, ".config.json");

// Function to load configurations
export function loadConfig() {
  if (fs.existsSync(configFilePath)) {
    return fs.readJsonSync(configFilePath);
  }
  return {};
}

// Function to save configurations
export function saveConfig(config) {
  fs.writeJsonSync(configFilePath, config, { spaces: 2 });
}

export { configFilePath };
