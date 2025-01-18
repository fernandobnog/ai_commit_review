// config.js

import path from "path";
import fs from "fs-extra";
import os from "os";

/**
 * Função para obter o diretório de configuração apropriado com base no sistema operacional.
 * @returns {string} Caminho para o diretório de configuração.
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

// Diretório de configuração persistente
const configDirectory = getConfigDirectory();

// Assegurar que o diretório de configuração exista
try {
  fs.ensureDirSync(configDirectory);
  console.log(`Diretório de configuração: ${configDirectory}`);
} catch (error) {
  console.error(
    `Erro ao criar o diretório de configuração em ${configDirectory}:`,
    error
  );
}

// Caminho completo para o arquivo de configuração
const configFilePath = path.join(configDirectory, ".config.json");

/**
 * Carrega as configurações do arquivo .config.json.
 * @returns {Object} Objeto de configuração ou objeto vazio se o arquivo não existir ou ocorrer um erro.
 */
export function loadConfig() {
  try {
    if (fs.existsSync(configFilePath)) {
      console.log(`Carregando configurações de: ${configFilePath}`);
      return fs.readJsonSync(configFilePath);
    } else {
      console.log(
        `Arquivo de configuração não encontrado em: ${configFilePath}. Utilizando configurações padrão.`
      );
    }
  } catch (error) {
    console.error("Erro ao carregar as configurações:", error);
  }
  return {};
}

/**
 * Salva as configurações no arquivo .config.json.
 * @param {Object} config - Objeto de configuração a ser salvo.
 */
export function saveConfig(config) {
  try {
    fs.writeJsonSync(configFilePath, config, { spaces: 2 });
    console.log(`Configurações salvas com sucesso em: ${configFilePath}`);
  } catch (error) {
    console.error("Erro ao salvar as configurações:", error);
  }
}

export { configFilePath };
