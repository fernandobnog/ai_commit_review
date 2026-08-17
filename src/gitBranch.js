// gitBranch.js
import { execSync } from "child_process";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import os from "os";
import { executeGitCommand } from "./gitCore.js";

/**
 * Gets the current branch name.
 */
export function getCurrentBranch(deps = {}) {
  const runGit = deps.executeGitCommandFn || executeGitCommand;
  try {
    return runGit("git branch --show-current", deps);
  } catch (error) {
    console.error(chalk.red("❌ Error retrieving current branch:"), error.message);
    return "unknown";
  }
}

/**
 * Lists all local branch names.
 */
export function listBranches(deps = {}) {
  const runGit = deps.executeGitCommandFn || executeGitCommand;
  try {
    const output = runGit("git branch --list", deps);
    if (!output) return [];
    return output
      .split("\n")
      .map((branch) => branch.trim().replace("* ", ""));
  } catch (error) {
    console.error(chalk.red("❌ Error listing branches:"), error.message);
    return [];
  }
}

/**
 * Pulls latest changes from remote.
 */
export function pullChanges(deps = {}) {
  const runGit = deps.executeGitCommandFn || executeGitCommand;
  try {
    runGit("git pull --no-rebase", deps);
    console.log(chalk.green("✔ Pulled latest changes from remote."));
  } catch (error) {
    console.error(chalk.red("❌ Error pulling changes:"), error.message);
    throw error;
  }
}

/**
 * Pushes changes to remote.
 */
export function pushChanges(deps = {}) {
  const runGit = deps.executeGitCommandFn || executeGitCommand;
  try {
    runGit("git push", deps);
    console.log(chalk.green("✔ Changes successfully pushed to remote repository!"));
  } catch (error) {
    console.error(chalk.red("❌ Error pushing changes:"), error.message);
  }
}

/**
 * Switches to a target branch handling stashes cleanly.
 */
export function switchBranch(branch, deps = {}) {
  const runGit = deps.executeGitCommandFn || executeGitCommand;
  if (typeof branch !== "string" || !branch.trim()) {
    console.error(chalk.red("❌ Branch name is required and must be non-empty."));
    return;
  }

  const originalBranch = (runGit("git rev-parse --abbrev-ref HEAD", deps) || "").toString().trim();
  let hadStash = false;

  try {
    const statusOutput = (runGit("git status --porcelain", deps) || "").toString().trim();
    if (statusOutput.length > 0) {
      console.log(chalk.blue("ℹ️ Saving uncommitted changes with stash..."));
      runGit("git stash", deps);
      hadStash = true;
    }

    console.log(chalk.blue("ℹ️ Updating current branch with git pull..."));
    runGit("git pull --no-rebase", deps);

    runGit("git checkout " + branch, deps);
    console.log(chalk.green(`✔ Switched to branch '${branch}' successfully.`));

    console.log(chalk.blue("ℹ️ Updating target branch with git pull..."));
    runGit("git pull --no-rebase", deps);

    if (hadStash) {
      restoreStashOrRollback(originalBranch, deps);
    }
  } catch (error) {
    console.error(chalk.red(`❌ Error switching to branch '${branch}':`), error.message || error);
    throw error;
  }
}

export function restoreStashOrRollback(originalBranch, deps = {}) {
  const runGit = deps.executeGitCommandFn || executeGitCommand;
  console.log(chalk.blue("ℹ️ Reapplying stash changes..."));
  try {
    runGit("git stash pop", deps);
  } catch (stashError) {
    console.error(chalk.red("❌ Conflicts detected reapplying stash. Reverting..."));
    runGit("git checkout " + originalBranch, deps);
    runGit("git pull --no-rebase", deps);
    try {
      runGit("git stash pop", deps);
    } catch (restoreError) {
      throw restoreError;
    }
    throw stashError;
  }
}

/**
 * Merges a branch into another branch.
 */
export async function mergeBranch(fromBranch, toBranch, deps = {}) {
  const runGit = deps.executeGitCommandFn || executeGitCommand;
  switchBranch(toBranch, deps);
  runGit(`git merge --no-ff ${fromBranch}`, deps);
  console.log(chalk.green(`Merge of ${fromBranch} into ${toBranch} completed.`));
  pullChanges(deps);
}

/**
 * Checks for conflict files in status.
 */
export function checkConflicts(deps = {}) {
  const runGit = deps.executeGitCommandFn || executeGitCommand;
  try {
    const status = runGit("git status --short", deps);
    if (!status) return [];
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
 * Gets diff output for conflict file.
 */
export function getConflictDiff(file, deps = {}) {
  const runGit = deps.executeGitCommandFn || executeGitCommand;
  try {
    return runGit(`git diff ${file}`, deps);
  } catch (error) {
    console.error(chalk.red(`❌ Error getting conflict diff for '${file}':`), error.message);
    return "";
  }
}

/**
 * Writes conflict diff to temp file.
 */
export function writeConflictToTempFile(file, diff) {
  const tempFilePath = path.join(os.tmpdir(), `${path.basename(file)}_conflict.txt`);
  fs.writeFileSync(tempFilePath, diff, { encoding: "utf-8" });
  return tempFilePath;
}

/**
 * Opens file in editor.
 */
export function openFileInEditor(tempFilePath, deps = {}) {
  const runSync = deps.execSyncFn || execSync;
  const editor = process.env.EDITOR || "vim";
  try {
    runSync(`${editor} "${tempFilePath}"`, { stdio: "inherit" });
    console.log(chalk.green(`✔ Resolved file saved: ${tempFilePath}`));
  } catch (error) {
    console.error(chalk.red("❌ Error opening file in editor:"), error.message);
  }
}

/**
 * Updates repository file from resolved temp file.
 */
export function updateFileFromTemp(file, tempFilePath, deps = {}) {
  const runGit = deps.executeGitCommandFn || executeGitCommand;
  try {
    const resolvedContent = fs.readFileSync(tempFilePath, "utf-8");
    fs.writeFileSync(file, resolvedContent);
    runGit(`git add "${file}"`, deps);
    console.log(chalk.green(`✔ Conflict resolved and staged for: ${file}`));
  } catch (error) {
    console.error(chalk.red("❌ Error updating file from temp:"), error.message);
  }
}
