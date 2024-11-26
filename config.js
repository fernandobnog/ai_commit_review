// config.js

import path from "path";
import { fileURLToPath } from "url";
import fs from "fs-extra";
import os from "os";

// Função para obter o diretório de configuração apropriado com base no sistema operacional
function getConfigDirectory() {
  const homeDir = os.homedir();

  // Determinar o diretório de configuração com base no SO
  switch (process.platform) {
    case "win32":
      return path.join(
        process.env.APPDATA || path.join(homeDir, "AppData", "Roaming"),
        "ai-commit-review"
      );
    case "darwin":
      return path.join(
        homeDir,
        "Library",
        "Application Support",
        "ai-commit-review"
      );
    default: // Linux e outros
      // Seguir a especificação XDG para diretórios de configuração
      return path.join(
        process.env.XDG_CONFIG_HOME || path.join(homeDir, ".config"),
        "ai-commit-review"
      );
  }
}

// Diretório de configuração persistente
const configDirectory = getConfigDirectory();

// Assegurar que o diretório de configuração exista
fs.ensureDirSync(configDirectory);

// Caminho completo para o arquivo de configuração
const configFilePath = path.resolve(configDirectory, ".config.json");

/**
 * Carrega as configurações do arquivo .config.json.
 * @returns {Object} Objeto de configuração ou objeto vazio se o arquivo não existir.
 */
export function loadConfig() {
  try {
    if (fs.existsSync(configFilePath)) {
      return fs.readJsonSync(configFilePath);
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
  } catch (error) {
    console.error("Erro ao salvar as configurações:", error);
  }
}

export { configFilePath };
