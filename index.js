#!/usr/bin/env node

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const { program } = require("commander");
const { execSync } = require("child_process");
const fs = require("fs");
const { OpenAI } = require("openai");

// Configuração OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
async function analyzeUpdatedCode(files) {
  const prompt = files
    .map(
      (file) => `
    Analise o seguinte arquivo:
    Nome do arquivo: ${file.filename}
    Código:
    ${file.content}
    
    Responda:
    1. O código segue boas práticas? Justifique.
    2. Existem problemas de legibilidade, eficiência ou estilo? Sugira melhorias.
    3. Há algo que pode ser otimizado ou reestruturado? Explique.
    `
    )
    .join("\n");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Use o modelo adequado disponível na sua conta
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

// Configuração do comando
program
  .name("relatoriocommit")
  .description("Análise de commits e código com IA a partir do Git local")
  .argument("<sha>", "SHA do commit a ser analisado")
  .action(async (sha) => {
    try {
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
      const analysis = await analyzeUpdatedCode(files);
      console.log("Análise do Código Atualizado:\n", analysis);
    } catch (error) {
      console.error("Erro:", error.message);
    }
  });

program.parse();
