// gitUtils.js
import { execSync } from "child_process";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import os from "os";


/**
 * Cria um pull request utilizando o GitHub CLI.
 * @param {object} params - Parâmetros do pull request.
 * @param {string} params.base - Branch base do PR.
 * @param {string} params.head - Branch de origem do PR.
 * @param {string} params.title - Título do PR.
 * @param {string} params.body - Corpo do PR.
 * @param {string} [params.reviewer] - Usuário revisor (opcional).
 * @returns {string} - Saída do comando.
 */
export function createPullRequest({ base, head, title, body, reviewer }) {
  try {
    let comando = `gh pr create --base ${base} --head ${head} --title "${title}" --body "${body}"`;
    if (reviewer) {
      comando += ` --reviewer ${reviewer}`;
    }
    const resultado = executeGitCommand(comando);
    console.log(chalk.green(`✔ Pull request criado com sucesso: ${resultado}`));
    return resultado;
  } catch (error) {
    console.error(chalk.red("❌ Erro ao criar pull request:"), error.message);
    throw error;
  }
}

export async function mergeBranch(fromBranch, toBranch) {
  await switchBranch(toBranch);
  await executeGitCommand(`git merge --no-ff ${fromBranch}`);
  console.log(chalk.green(`Merge of branch ${fromBranch} into ${toBranch} completed successfully.`));
}

export function undoLastCommitSoft() {
  try {
    console.log(
      chalk.blue("🔄 Undoing the last commit without altering the changes...")
    );
    executeGitCommand("git reset --soft HEAD~1");
    console.log(
      chalk.green("✔ Last commit undone. The changes remain staged.")
    );
  } catch (error) {
    console.error(
      chalk.red("❌ Failed to undo the last commit:"),
      error.message
    );
    throw error;
  }
}

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

  // Parameter validation
  if (typeof branch !== 'string' || !branch.trim()) {
    console.error(chalk.red("❌ Branch name is required and must be a non-empty string."));
    return;
  }

  // Captures the current branch for possible rollback
  const originalBranch = (
    executeGitCommand("git rev-parse --abbrev-ref HEAD") || ""
  ).toString().trim();

  let hadStash = false;

  try {
    // Checks if there are uncommitted changes
    const statusOutput = (executeGitCommand("git status --porcelain") || "")
      .toString()
      .trim();
    if (statusOutput.length > 0) {
      console.log(chalk.blue("ℹ️  Changes detected. Saving changes with stash..."));
      executeGitCommand("git stash");
      hadStash = true;
    }

    // Atualiza a branch atual para garantir que está com as últimas mudanças
    console.log(chalk.blue("ℹ️  Atualizando a branch atual com 'git pull'..."));
    executeGitCommand("git pull");

    // Tenta alternar para a branch de destino
    executeGitCommand("git checkout " + branch);
    console.log(chalk.green(`✔ Switched to branch '${branch}' successfully.`));

    // Atualiza a branch de destino para garantir que está com as últimas mudanças
    console.log(chalk.blue("ℹ️  Atualizando a branch de destino com 'git pull'..."));
    executeGitCommand("git pull");

    // Caso tenha feito stash, tenta reaplicar as alterações salvas
    if (hadStash) {
      console.log(chalk.blue("ℹ️  Reapplying stash changes on the new branch..."));
      try {
        executeGitCommand("git stash pop");
      } catch (stashError) {
        console.error(chalk.red("❌ Conflicts detected when reapplying stash on the destination branch."));
        const conflictFiles = (
          executeGitCommand("git diff --name-only --diff-filter=U") || ""
        ).toString().trim() || "No file identified";
        console.error(chalk.yellow(`Conflict files: ${conflictFiles}`));
        console.error(chalk.yellow("Reverting to the original branch and attempting to apply stash..."));

        // Reverts to the original branch
        executeGitCommand("git checkout " + originalBranch);
        console.log(chalk.blue("ℹ️  Atualizando a branch original com 'git pull'..."));
        executeGitCommand("git pull");

        // Attempts to apply the stash on the original branch
        try {
          executeGitCommand("git stash pop");
          console.log(chalk.green("✔ Changes restored successfully on the original branch."));
        } catch (restoreError) {
          console.error(chalk.red("❌ There were issues applying the stash on the original branch."));
          throw restoreError;
        }
        // Throws the original error to indicate that a conflict initially occurred
        throw stashError;
      }
    }
  } catch (error) {
    console.error(chalk.red(`❌ Error switching to branch '${branch}':`), error.message || error);
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
    // Use '--' to avoid ambiguity between file paths and revisions
    return executeGitCommand(`git diff --cached -- "${file}"`);
  } catch (error) {
    console.error(
      chalk.red(`❌ Error getting diff for file '${file}':`),
      error.message
    );

    // Handle deleted files gracefully
    const isDeletedFile =
      executeGitCommand(`git ls-files --deleted -- "${file}"`).length > 0;
    if (isDeletedFile) {
      console.warn(chalk.yellow(`⚠️ File '${file}' was deleted.`));
      return `File deleted: ${file}`;
    }

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
    return files.map((file) => {
      const diff = getStagedFileDiff(file);
      return { filename: file, diff };
    });
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
    executeGitCommand(`git commit --edit --file="${tempFilePath}" --no-verify`);
    console.log(chalk.green("✔ Commit successfully made!"));
  } catch (error) {
    console.error(chalk.red("❌ Error making commit:"), error.message);
    throw error;
  }
}

/**
 * Puxa as últimas alterações do repositório remoto para o branch atual.
 */
export function pullChanges() {
  try {
    executeGitCommand("git pull");
    console.log(
      chalk.green(
        "✔ Successfully pulled the latest changes from the remote repository."
      )
    );
  } catch (error) {
    console.error(chalk.red("❌ Error pulling changes:"), error.message);
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
