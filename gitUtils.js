// gitUtils.js

import { execSync } from "child_process";
import chalk from "chalk";

/**
 * Executes a Git command synchronously.
 * @param {string} command - The Git command to execute.
 * @returns {string} - The trimmed output of the command.
 * @throws Will throw an error if the command execution fails.
 */
export function executeGitCommand(command) {
  try {
    return execSync(command, { encoding: "utf-8" }).trim();
  } catch (error) {
    console.error(
      chalk.red(`❌ Error executing Git command '${command}': ${error.message}`)
    );
    throw error;
  }
}

/**
 * Retrieves the list of modified files for a given commit SHA.
 * @param {string} sha - The commit SHA to analyze.
 * @returns {Array<{status: string, file: string}>} - An array of objects containing the status and file name.
 */
export function getModifiedFiles(sha) {
  const output = executeGitCommand(
    `git diff-tree --no-commit-id --name-status -r ${sha}`
  );
  return output.split("\n").map((line) => {
    const [status, file] = line.trim().split("\t");
    return { status, file };
  });
}

/**
 * Retrieves the diff for a specific file in a given commit.
 * @param {string} sha - The commit SHA.
 * @param {string} file - The file path to get the diff for.
 * @returns {string} - The diff content of the file.
 */
export function getFileDiff(sha, file) {
  return executeGitCommand(`git diff ${sha}~1 ${sha} -- ${file} || true`);
}
