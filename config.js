// config.js
const path = require("path");
const fs = require("fs-extra");

// Caminho para salvar as configurações
const configFilePath = path.resolve(__dirname, ".config.json");

// Função para carregar configurações
function loadConfig() {
  if (fs.existsSync(configFilePath)) {
    return fs.readJsonSync(configFilePath);
  }
  return {};
}

// Função para salvar configurações
function saveConfig(config) {
  fs.writeJsonSync(configFilePath, config, { spaces: 2 });
}

module.exports = {
  loadConfig,
  saveConfig,
  configFilePath,
};
