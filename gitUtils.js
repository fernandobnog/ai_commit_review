// gitUtils.js

const { execSync } = require("child_process");

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
    `git diff-tree --no-commit-id --name-status -r ${sha}`
  );
  return output.split("\n").map((line) => {
    const [status, file] = line.trim().split("\t");
    return { status, file };
  });
}

// **Nova função para obter o diff de um arquivo no commit**
function getFileDiff(sha, file) {
  // Usamos o comando git diff para obter as alterações no arquivo específico
  return executeGitCommand(`git diff ${sha}~1 ${sha} -- ${file} || true`);
}

module.exports = {
  executeGitCommand,
  getModifiedFiles,
  getFileDiff, // Exportamos a nova função
};
