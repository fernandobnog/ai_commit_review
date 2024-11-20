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
 * Retrieves a list of commits with details (SHA, timestamp, message).
 * @param {number} skip - Number of commits to skip.
 * @param {number} limit - Number of commits to retrieve.
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
    console.error(chalk.red("❌ Error fetching commits:"), error.message);
    return [];
  }
}

/**
 * Formats a Git timestamp into a readable date string.
 * @param {string} timestamp - The Unix timestamp from Git log.
 * @returns {string} - Formatted date string.
 */
function formatGitDate(timestamp) {
  return new Date(parseInt(timestamp, 10) * 1000)
    .toLocaleString("en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(",", "");
}

/**
 * Truncates a string to a specified maximum length.
 * @param {string} str - The string to truncate.
 * @param {number} maxLength - The maximum length of the string.
 * @returns {string} - The truncated string with ellipsis if necessary.
 */
function truncateString(str, maxLength) {
  return str.length <= maxLength ? str : `${str.slice(0, maxLength - 3)}...`;
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
