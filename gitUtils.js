// gitUtils.js
import { execSync } from "child_process";
import chalk from "chalk";
import fs from "fs";

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
      chalk.red("❌ Error retrieving modified files:"),
      error.message
    );
    return [];
  }
}

/**
 * Retrieves the diff for a specific file in a given commit.
 * @param {string} sha - The commit SHA.
 * @param {string} file - The file path to get the diff for.
 * @returns {string} - The diff content of the file.
 */
export function getFileDiff(sha, file) {
  try {
    return executeGitCommand(`git diff ${sha}~1 ${sha} -- ${file} || true`);
  } catch (error) {
    console.error(
      chalk.red(`❌ Error retrieving file diff for '${file}':`),
      error.message
    );
    return "";
  }
}

/**
 * Clears the staging area to ensure all changes are reviewed.
 */
export function clearStage() {
  try {
    executeGitCommand("git reset");
    console.log(chalk.green("✔ Stage cleared. All changes unstaged."));
  } catch (error) {
    console.error(chalk.red("❌ Error clearing stage:"), error.message);
  }
}

/**
 * Gets the current branch of the repository.
 * @returns {string} - Current branch name.
 */
export function getCurrentBranch() {
  try {
    return executeGitCommand("git branch --show-current");
  } catch (error) {
    console.error(
      chalk.red("❌ Error retrieving current branch:"),
      error.message
    );
    return "unknown";
  }
}

/**
 * Lists all branches in the repository.
 * @returns {Array<string>} - List of branch names.
 */
export function listBranches() {
  try {
    return executeGitCommand("git branch --list")
      .split("\n")
      .map((branch) => branch.trim().replace("* ", ""));
  } catch (error) {
    console.error(chalk.red("❌ Error listing branches:"), error.message);
    return [];
  }
}

/**
 * Switches to the specified branch.
 * @param {string} branch - Name of the branch to switch to.
 */
export function switchBranch(branch) {
  try {
    executeGitCommand(`git checkout ${branch}`);
    console.log(chalk.green(`✔ Switched to branch '${branch}' successfully.`));
  } catch (error) {
    console.error(
      chalk.red(`❌ Error switching to branch '${branch}':`),
      error.message
    );
    throw error;
  }
}

/**
 * Checks for conflicts in the repository.
 * @returns {Array<string>} - List of files with conflicts.
 */
export function checkConflicts() {
  try {
    const status = executeGitCommand("git status --short");
    return status
      .split("\n")
      .filter((line) => line.startsWith("UU"))
      .map((line) => line.replace("UU ", "").trim());
  } catch (error) {
    console.error(chalk.red("❌ Error checking conflicts:"), error.message);
    return [];
  }
}

/**
 * Retrieves the diff of the repository.
 * @returns {string} - The full diff output.
 */
export function getRepositoryDiff() {
  try {
    return executeGitCommand("git diff");
  } catch (error) {
    console.error(
      chalk.red("❌ Error retrieving repository diff:"),
      error.message
    );
    return "";
  }
}

/**
 * Stages all changes using 'git add .'.
 */
export function stageAllChanges() {
  try {
    executeGitCommand("git add .");
    console.log(chalk.green("✔ All changes have been staged."));
  } catch (error) {
    console.error(chalk.red("❌ Error staging all changes:"), error.message);
    throw error;
  }
}

/**
 * Commits changes using the Git editor.
 * @param {string} message - Commit message to pre-fill.
 */
export function commitChangesWithEditor(message) {
  try {
    const tempFile = "/tmp/commit_message.txt";
    fs.writeFileSync(tempFile, message, { encoding: "utf-8" });
    executeGitCommand(`git commit --edit --file="${tempFile}"`);
    console.log(chalk.green("✔ Commit completed successfully!"));
  } catch (error) {
    console.error(chalk.red("❌ Error committing changes:"), error.message);
  }
}

/**
 * Pushes changes to the remote repository.
 */
export function pushChanges() {
  try {
    executeGitCommand("git push");
    console.log(chalk.green("✔ Changes pushed to remote successfully!"));
  } catch (error) {
    console.error(chalk.red("❌ Error pushing changes:"), error.message);
  }
}
