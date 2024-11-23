// gitUtils.js
import { execSync } from "child_process";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import os from "os";

/**
 * Executes a Git command synchronously.
 * @param {string} command - The Git command to execute.
 * @returns {string} - The command output, trimmed of whitespace.
 * @throws Throws an error if the command execution fails.
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
 * @param {string} timestamp - The Unix timestamp from the Git log.
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
 * @returns {Array<{status: string, file: string}>} - Array of objects containing the status and file name.
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
 * @returns {string} - The file's diff content.
 */
export function getFileDiff(sha, file) {
  try {
    return executeGitCommand(`git diff ${sha}~1 ${sha} -- ${file} || true`);
  } catch (error) {
    console.error(
      chalk.red(`❌ Error retrieving diff for file '${file}':`),
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
 * @returns {string} - Name of the current branch.
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
    console.error(chalk.red("❌ Error checking for conflicts:"), error.message);
    return [];
  }
}

/**
 * Retrieves the repository diff.
 * @returns {string} - The complete diff output.
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
 * Gets the diff of a specific staged file.
 * @param {string} file - The file path.
 * @returns {string} - The file's diff.
 */
export function getStagedFileDiff(file) {
  try {
    return executeGitCommand(`git diff --cached ${file}`);
  } catch (error) {
    console.error(
      chalk.red(`❌ Error getting diff for file '${file}':`),
      error.message
    );
    return "";
  }
}

/**
 * Adds all changes to the staging area using 'git add .'.
 */
export function stageAllChanges() {
  try {
    executeGitCommand("git add ."); // Executes the command directly
    console.log(chalk.green("✔ All changes have been staged."));
  } catch (error) {
    console.error(chalk.red("❌ Error staging all changes:"), error.message);
    throw error;
  }
}

/**
 * Retrieves the list of staged files with their diffs.
 * @returns {Array<{filename: string, diff: string}>} - List of staged files and their diffs.
 */
export function getStagedFilesDiffs() {
  try {
    // Get the list of staged files
    const files = executeGitCommand("git diff --cached --name-only")
      .split("\n")
      .filter((line) => line);

    // Get the diff for each staged file
    return files.map((file) => ({
      filename: file,
      diff: getStagedFileDiff(file),
    }));
  } catch (error) {
    console.error(
      chalk.red("❌ Error retrieving diffs for staged files:"),
      error.message
    );
    return [];
  }
}

/**
 * Commits the changes using the Git editor.
 * @param {string} tempFilePath - Path to the temporary file containing the commit message.
 */
export function commitChangesWithEditor(tempFilePath) {
  try {
    executeGitCommand(`git commit --edit --file="${tempFilePath}"`);
    console.log(chalk.green("✔ Commit successfully made!"));
  } catch (error) {
    console.error(chalk.red("❌ Error making commit:"), error.message);
    throw error;
  }
}

/**
 * Pushes the changes to the remote repository.
 */
export function pushChanges() {
  try {
    executeGitCommand("git push");
    console.log(
      chalk.green("✔ Changes successfully pushed to the remote repository!")
    );
  } catch (error) {
    console.error(chalk.red("❌ Error pushing changes:"), error.message);
  }
}

/**
 * Retrieves the diff for conflicts in a file.
 * @param {string} file - File name with conflicts.
 * @returns {string} - Diff content showing conflicts.
 */
export function getConflictDiff(file) {
  try {
    return executeGitCommand(`git diff ${file}`);
  } catch (error) {
    console.error(
      chalk.red(`❌ Error retrieving conflict diff for file '${file}':`),
      error.message
    );
    return "";
  }
}

/**
 * Writes the conflict diff to a temporary file.
 * @param {string} file - File name with conflicts.
 * @param {string} diff - Conflict diff.
 * @returns {string} - Path to the temporary file.
 */
export function writeConflictToTempFile(file, diff) {
  const tempFilePath = path.join(
    os.tmpdir(),
    `${path.basename(file)}_conflict.txt`
  );
  fs.writeFileSync(tempFilePath, diff, { encoding: "utf-8" });
  return tempFilePath;
}

/**
 * Opens a temporary file in the default editor for manual conflict resolution.
 * @param {string} tempFilePath - Path to the temporary file.
 */
export function openFileInEditor(tempFilePath) {
  const editor = process.env.EDITOR || "vim";
  try {
    execSync(`${editor} "${tempFilePath}"`, { stdio: "inherit" });
    console.log(chalk.green(`✔ Resolved file saved: ${tempFilePath}`));
  } catch (error) {
    console.error(chalk.red("❌ Error opening file in editor:"), error.message);
  }
}

/**
 * Updates the repository file with the resolved content from the temporary file.
 * @param {string} file - Path to the repository file.
 * @param {string} tempFilePath - Path to the temporary file with resolved content.
 */
export function updateFileFromTemp(file, tempFilePath) {
  try {
    const resolvedContent = fs.readFileSync(tempFilePath, "utf-8");
    fs.writeFileSync(file, resolvedContent);
    executeGitCommand(`git add "${file}"`);
    console.log(chalk.green(`✔ Conflict resolved and staged for: ${file}`));
  } catch (error) {
    console.error(
      chalk.red("❌ Error updating file from temp:"),
      error.message
    );
  }
}
