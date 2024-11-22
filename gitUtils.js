// gitUtils.js
import { execSync } from "child_process";
import chalk from "chalk";
import fs from "fs";
import os from "os";
import path from "path";

/**
 * Executa um comando Git de forma síncrona.
 * @param {string} command - O comando Git a ser executado.
 * @returns {string} - A saída do comando, com espaços em branco removidos.
 * @throws Lança um erro se a execução do comando falhar.
 */
export function executeGitCommand(command) {
  try {
    return execSync(command, { encoding: "utf-8" }).trim();
  } catch (error) {
    console.error(
      chalk.red(
        `❌ Erro ao executar o comando Git '${command}': ${error.message}`
      )
    );
    throw error;
  }
}

/**
 * Recupera uma lista de commits com detalhes (SHA, timestamp, mensagem).
 * @param {number} skip - Número de commits a pular.
 * @param {number} limit - Número de commits a recuperar.
 * @returns {Array<{shaFull: string, shaShort: string, date: string, message: string}>}
 */
export function getCommits(skip = 0, limit = 5) {
  try {
    const output = executeGitCommand(
      `git log --skip=${skip} -n ${limit} --pretty=format:"%H\x1f%ct\x1f%s"`
    );
    return output.split("\n").map((line) => {
      const [shaFull, timestamp, message] = line.split("\x1f");
      return {
        shaFull,
        shaShort: shaFull.slice(0, 7),
        date: formatGitDate(timestamp),
        message: truncateString(message.replace(/\n/g, " "), 100),
      };
    });
  } catch (error) {
    console.error(chalk.red("❌ Erro ao buscar commits:"), error.message);
    return [];
  }
}

/**
 * Formata um timestamp Git em uma string de data legível.
 * @param {string} timestamp - O timestamp Unix do log Git.
 * @returns {string} - String de data formatada.
 */
function formatGitDate(timestamp) {
  return new Date(parseInt(timestamp, 10) * 1000)
    .toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(",", "");
}

/**
 * Trunca uma string para um comprimento máximo especificado.
 * @param {string} str - A string a ser truncada.
 * @param {number} maxLength - O comprimento máximo da string.
 * @returns {string} - A string truncada com reticências, se necessário.
 */
function truncateString(str, maxLength) {
  return str.length <= maxLength ? str : `${str.slice(0, maxLength - 3)}...`;
}

/**
 * Recupera a lista de arquivos modificados para um determinado SHA de commit.
 * @param {string} sha - O SHA do commit a ser analisado.
 * @returns {Array<{status: string, file: string}>} - Array de objetos contendo o status e o nome do arquivo.
 */
export function getModifiedFiles(sha) {
  try {
    const output = executeGitCommand(
      `git diff-tree --no-commit-id --name-status -r ${sha}`
    );
    return output.split("\n").map((line) => {
      const [status, file] = line.trim().split("\t");
      return { status, file };
    });
  } catch (error) {
    console.error(
      chalk.red("❌ Erro ao recuperar arquivos modificados:"),
      error.message
    );
    return [];
  }
}

/**
 * Recupera o diff para um arquivo específico em um determinado commit.
 * @param {string} sha - O SHA do commit.
 * @param {string} file - O caminho do arquivo para obter o diff.
 * @returns {string} - O conteúdo do diff do arquivo.
 */
export function getFileDiff(sha, file) {
  try {
    return executeGitCommand(`git diff ${sha}~1 ${sha} -- ${file} || true`);
  } catch (error) {
    console.error(
      chalk.red(`❌ Erro ao recuperar diff do arquivo '${file}':`),
      error.message
    );
    return "";
  }
}

/**
 * Limpa a área de stage para garantir que todas as alterações sejam revisadas.
 */
export function clearStage() {
  try {
    executeGitCommand("git reset");
    console.log(
      chalk.green("✔ Stage limpo. Todas as alterações desestagadas.")
    );
  } catch (error) {
    console.error(chalk.red("❌ Erro ao limpar o stage:"), error.message);
  }
}

/**
 * Obtém o branch atual do repositório.
 * @returns {string} - Nome do branch atual.
 */
export function getCurrentBranch() {
  try {
    return executeGitCommand("git branch --show-current");
  } catch (error) {
    console.error(
      chalk.red("❌ Erro ao recuperar o branch atual:"),
      error.message
    );
    return "desconhecido";
  }
}

/**
 * Lista todos os branches no repositório.
 * @returns {Array<string>} - Lista de nomes de branches.
 */
export function listBranches() {
  try {
    return executeGitCommand("git branch --list")
      .split("\n")
      .map((branch) => branch.trim().replace("* ", ""));
  } catch (error) {
    console.error(chalk.red("❌ Erro ao listar branches:"), error.message);
    return [];
  }
}

/**
 * Muda para o branch especificado.
 * @param {string} branch - Nome do branch para alternar.
 */
export function switchBranch(branch) {
  try {
    executeGitCommand(`git checkout ${branch}`);
    console.log(
      chalk.green(`✔ Alternado para o branch '${branch}' com sucesso.`)
    );
  } catch (error) {
    console.error(
      chalk.red(`❌ Erro ao alternar para o branch '${branch}':`),
      error.message
    );
    throw error;
  }
}

/**
 * Verifica conflitos no repositório.
 * @returns {Array<string>} - Lista de arquivos com conflitos.
 */
export function checkConflicts() {
  try {
    const status = executeGitCommand("git status --short");
    return status
      .split("\n")
      .filter((line) => line.startsWith("UU"))
      .map((line) => line.replace("UU ", "").trim());
  } catch (error) {
    console.error(chalk.red("❌ Erro ao verificar conflitos:"), error.message);
    return [];
  }
}

/**
 * Recupera o diff do repositório.
 * @returns {string} - A saída completa do diff.
 */
export function getRepositoryDiff() {
  try {
    return executeGitCommand("git diff");
  } catch (error) {
    console.error(
      chalk.red("❌ Erro ao recuperar o diff do repositório:"),
      error.message
    );
    return "";
  }
}

/**
 * Obtém o diff de um arquivo staged específico.
 * @param {string} file - O caminho do arquivo.
 * @returns {string} - O diff do arquivo.
 */
export function getStagedFileDiff(file) {
  try {
    return executeGitCommand(`git diff --cached -- ${file}`);
  } catch (error) {
    console.error(
      chalk.red(`❌ Erro ao obter o diff do arquivo '${file}':`),
      error.message
    );
    return "";
  }
}

/**
 * Adiciona todas as mudanças ao stage usando 'git add .'.
 */
export function stageAllChanges() {
  try {
    executeGitCommand("git add ."); // Executa o comando diretamente
    console.log(chalk.green("✔ Todas as mudanças foram adicionadas ao stage."));
  } catch (error) {
    console.error(
      chalk.red("❌ Erro ao adicionar todas as mudanças ao stage:"),
      error.message
    );
    throw error;
  }
}

/**
 * Recupera a lista de arquivos staged com seus diffs.
 * @returns {Array<{filename: string, diff: string}>} - Lista de arquivos staged e seus diffs.
 */
export function getStagedFilesDiffs() {
  try {
    // Obter a lista de arquivos staged
    const files = executeGitCommand("git diff --cached --name-only")
      .split("\n")
      .filter((line) => line);

    // Obter o diff de cada arquivo staged
    return files.map((file) => ({
      filename: file,
      diff: getStagedFileDiff(file), // Usando 'diff' ao invés de 'content'
    }));
  } catch (error) {
    console.error(
      chalk.red("❌ Erro ao recuperar os diffs dos arquivos staged:"),
      error.message
    );
    return [];
  }
}

/**
 * Realiza o commit das alterações usando o editor do Git.
 * @param {string} tempFilePath - Caminho para o arquivo temporário contendo a mensagem de commit.
 */
export function commitChangesWithEditor(tempFilePath) {
  try {
    executeGitCommand(`git commit --edit --file="${tempFilePath}"`);
    console.log(chalk.green("✔ Commit realizado com sucesso!"));
  } catch (error) {
    console.error(chalk.red("❌ Erro ao realizar o commit:"), error.message);
    throw error;
  }
}

/**
 * Envia as alterações para o repositório remoto.
 */
export function pushChanges() {
  try {
    executeGitCommand("git push");
    console.log(
      chalk.green(
        "✔ Alterações enviadas para o repositório remoto com sucesso!"
      )
    );
  } catch (error) {
    console.error(chalk.red("❌ Erro ao enviar alterações:"), error.message);
  }
}
