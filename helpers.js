// helpers.js
const prompt = require("prompt-sync")();
const { loadConfig, saveConfig } = require("./config");
const Models = require("./models");

// Função para exibir ajuda personalizada
function showHelp() {
  console.log(`
Uso:
  relatoriocommit <SHA_DO_COMMIT> [comandos]

Descrição:
  Ferramenta para analisar commits e código com IA a partir do Git local.

Variáveis necessárias:
  - OPENAI_API_KEY: Sua chave de API da OpenAI.
  - OPENAI_API_MODEL: Modelo de IA utilizado para análise (ex: gpt-4, gpt-4-turbo).

Comandos:
  relatoriocommit <SHA_DO_COMMIT>  Analisar um commit específico.
  relatoriocommit set_config       Atualizar configurações (ex: OPENAI_API_KEY e OPENAI_API_MODEL).
  relatoriocommit help             Exibir esta ajuda.

Exemplos:
  relatoriocommit 123456           Analisar o commit com SHA 123456.
  relatoriocommit set_config OPENAI_API_KEY=sk-<sua-chave>
  relatoriocommit set_config OPENAI_API_MODEL=gpt-4
  `);
}

// Função para validar e configurar
function validateAndConfigure() {
  const config = loadConfig();

  if (!config.OPENAI_API_KEY) {
    console.log("Chave da OpenAI API não configurada.");
    config.OPENAI_API_KEY = prompt("Insira sua chave da OpenAI API: ").trim();
  }

  if (
    !config.OPENAI_API_MODEL ||
    !Object.values(Models).includes(config.OPENAI_API_MODEL)
  ) {
    console.log("Modelo de IA não configurado ou inválido.");
    const availableModels = Object.values(Models).join(", ");
    console.log(`Modelos disponíveis: ${availableModels}`);
    config.OPENAI_API_MODEL = prompt("Insira o modelo da IA: ").trim();
  }

  saveConfig(config);
  return config;
}

// Função para atualizar configurações
function updateConfigFromString(configString) {
  const index = configString.indexOf("=");
  if (index === -1) {
    throw new Error(
      "Formato inválido. Use: relatoriocommit set_config CHAVE=VALOR"
    );
  }

  const key = configString.substring(0, index).trim();
  const value = configString.substring(index + 1).trim();

  if (!key || !value) {
    throw new Error(
      "Formato inválido. Use: relatoriocommit set_config CHAVE=VALOR"
    );
  }

  if (key === "OPENAI_API_MODEL" && !Object.values(Models).includes(value)) {
    const availableModels = Object.values(Models).join(", ");
    throw new Error(`Modelo inválido. Modelos disponíveis: ${availableModels}`);
  }

  const config = loadConfig();
  config[key] = value;
  saveConfig(config);
  console.log(`Configuração "${key}" atualizada para "${value}".`);
}

module.exports = {
  showHelp,
  validateAndConfigure,
  updateConfigFromString,
};
