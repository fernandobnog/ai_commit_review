#!/usr/bin/env node

// cli.js
const fs = require("fs-extra");
const { program } = require("commander");
const { OpenAI } = require("openai");
const {
  showHelp,
  validateAndConfigure,
  updateConfigFromString,
} = require("./helpers");
const { getModifiedFiles, executeGitCommand } = require("./gitUtils");
const { analyzeUpdatedCode } = require("./openaiUtils");

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
      const openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });
      console.log(`Obtendo arquivos modificados no commit ${sha}...`);
      const modifiedFiles = getModifiedFiles(sha);

      if (modifiedFiles.length === 0) {
        console.log("Nenhum arquivo modificado encontrado.");
        return;
      }

      console.log("Lendo conteúdo dos arquivos...");
      const files = modifiedFiles
        .map(({ status, file }) => {
          let content = "";
          try {
            if (status === "D") {
              // Arquivo deletado - obter conteúdo do commit anterior
              content = executeGitCommand(`git show ${sha}^:${file}`);
            } else {
              // Arquivo adicionado ou modificado - obter conteúdo do commit atual
              content = executeGitCommand(`git show ${sha}:${file}`);
            }
            return {
              filename: file,
              content,
            };
          } catch (error) {
            console.error(`Erro ao ler o arquivo ${file}:`, error.message);
            return null;
          }
        })
        .filter((file) => file !== null);

      if (files.length === 0) {
        console.log("Nenhum arquivo válido encontrado para análise.");
        return;
      }

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
