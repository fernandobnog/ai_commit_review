#!/usr/bin/env node

const path = require("path");
const fs = require("fs-extra");
const { program } = require("commander");
const { execSync } = require("child_process");
const { OpenAI } = require("openai");
const prompt = require("prompt-sync")();
const Models = require("./models");

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

// Função para executar comandos Git
function executeGitCommand(command) {
  try {
    return execSync(command, { encoding: "utf-8" }).trim();
  } catch (error) {
    console.error(`Erro ao executar comando Git: ${command}`);
    throw error;
  }
}

// Função para obter arquivos modificados no commit
function getModifiedFiles(sha) {
  const output = executeGitCommand(
    `git show --name-only --pretty=format: ${sha}`
  );
  return output.split("\n").filter((file) => file && fs.existsSync(file));
}

// Função para analisar o código
async function analyzeUpdatedCode(files, openaiInstance, config) {
  const prompt = files
    .map(
      (file) => `Analise o seguinte arquivo:
    Nome do arquivo: ${file.filename}
    Código:
    ${file.content}
    
    Responda:
    1. O código segue boas práticas? Justifique.
    2. Existem problemas de legibilidade, eficiência ou estilo? Sugira melhorias.
    3. Há algo que pode ser otimizado ou reestruturado? Explique.`
    )
    .join("\n");

  try {
    const response = await openaiInstance.chat.completions.create({
      model: config.OPENAI_API_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error(
      "Erro ao analisar código:",
      error.response?.data || error.message
    );
    throw error;
  }
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

// Configuração dos comandos
program
  .name("relatoriocommit")
  .description("Análise de commits e código com IA a partir do Git local");

// Comando padrão para analisar um commit
program
  .argument("[sha]", "SHA do commit a ser analisado")
  .action(async (sha) => {
    if (!sha) {
      showHelp();
      return;
    }

    try {
      const config = validateAndConfigure();
      const openai = new OpenAI({ apiKey: config.OPENAI_API_KEY }); // Instância local
      console.log(`Obtendo arquivos modificados no commit ${sha}...`);
      const modifiedFiles = getModifiedFiles(sha);

      if (modifiedFiles.length === 0) {
        console.log("Nenhum arquivo modificado encontrado.");
        return;
      }

      console.log("Lendo conteúdo dos arquivos...");
      const files = modifiedFiles.map((file) => ({
        filename: file,
        content: fs.readFileSync(file, "utf-8"),
      }));

      console.log("Analisando código...");
      const analysis = await analyzeUpdatedCode(files, openai, config);
      console.log("Análise do Código Atualizado:\n", analysis);
    } catch (error) {
      console.error("Erro:", error.message);
    }
  });

// Subcomando para definir configurações
program
  .command("set_config")
  .description(
    "Atualizar uma configuração no formato CHAVE=VALOR (ex: OPENAI_API_KEY=<valor>)"
  )
  .argument("<keyValue>", "Configuração no formato CHAVE=VALOR")
  .action((keyValue) => {
    try {
      updateConfigFromString(keyValue);
    } catch (error) {
      console.error(error.message);
    }
  });

// Exibir ajuda personalizada ao usar `help`
program
  .command("help")
  .description("Exibir esta ajuda")
  .action(() => {
    showHelp();
  });

program.parse(process.argv);

// Exibir ajuda personalizada se nenhum argumento for fornecido
if (!process.argv.slice(2).length) {
  showHelp();
}
