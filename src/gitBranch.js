import chalk from "chalk";
import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";
import { executeGitCommand } from "./gitCore.js";

export function getDeps(deps = {}) {
  return {
    executeGitCommandFn: deps.executeGitCommandFn || executeGitCommand,
    execSyncFn: deps.execSyncFn || execSync,
  };
}

export function getCurrentBranch(deps = {}) {
  const d = getDeps(deps);
  try {
    return d.executeGitCommandFn("git branch --show-current", deps);
  } catch (error) {
    console.error(chalk.red("❌ Error retrieving current branch:"), error.message || error);
    return "unknown";
  }
}

export function listBranches(deps = {}) {
  const d = getDeps(deps);
  try {
    const out = d.executeGitCommandFn("git branch --list", deps);
    if (!out) return [];
    return out.split("\n").map((branch) => branch.trim().replace("* ", ""));
  } catch (error) {
    console.error(chalk.red("❌ Error listing branches:"), error.message || error);
    return [];
  }
}

export function pullChanges(deps = {}) {
  const d = getDeps(deps);
  try {
    d.executeGitCommandFn("git pull --no-rebase", deps);
    console.log(chalk.green("✔ Successfully pulled latest changes from remote."));
  } catch (error) {
    console.error(chalk.red("❌ Error pulling changes:"), error.message || error);
    throw error;
  }
}

export function pushChanges(deps = {}) {
  const d = getDeps(deps);
  try {
    d.executeGitCommandFn("git push", deps);
    console.log(chalk.green("✔ Changes successfully pushed to remote repository!"));
  } catch (error) {
    console.error(chalk.red("❌ Error pushing changes:"), error.message || error);
  }
}

export function restoreStashOrRollback(originalBranch, stashError, deps = {}) {
  const d = getDeps(deps);
  console.error(chalk.red("❌ Conflicts detected reapplying stash. Reverting..."));
  d.executeGitCommandFn("git checkout " + originalBranch, deps);
  d.executeGitCommandFn("git pull --no-rebase", deps);
  try {
    d.executeGitCommandFn("git stash pop", deps);
  } catch (restoreError) {
    throw restoreError;
  }
  throw stashError;
}

export function switchBranch(branch, deps = {}) {
  const d = getDeps(deps);
  if (typeof branch !== 'string' || !branch.trim()) {
    console.error(chalk.red("❌ Branch name is required and must be non-empty."));
    return;
  }

  const originalBranch = d.executeGitCommandFn("git rev-parse --abbrev-ref HEAD", deps) || "";
  let hadStash = false;

  try {
    const status = d.executeGitCommandFn("git status --porcelain", deps) || "";
    if (status.trim().length > 0) {
      console.log(chalk.blue("ℹ️ Saving uncommitted changes with stash..."));
      d.executeGitCommandFn("git stash", deps);
      hadStash = true;
    }

    console.log(chalk.blue("ℹ️ Updating current branch with git pull..."));
    d.executeGitCommandFn("git pull --no-rebase", deps);

    d.executeGitCommandFn("git checkout " + branch, deps);
    console.log(chalk.green(`✔ Switched to branch '${branch}' successfully.`));

    console.log(chalk.blue("ℹ️ Updating target branch with git pull..."));
    d.executeGitCommandFn("git pull --no-rebase", deps);

    if (hadStash) {
      console.log(chalk.blue("ℹ️ Reapplying stash changes..."));
      try {
        d.executeGitCommandFn("git stash pop", deps);
      } catch (stashError) {
        restoreStashOrRollback(originalBranch, stashError, deps);
      }
    }
  } catch (error) {
    console.error(chalk.red(`❌ Error switching to branch '${branch}':`), error.message || error);
    throw error;
  }
}

export async function mergeBranch(fromBranch, toBranch, deps = {}) {
  const d = getDeps(deps);
  await switchBranch(toBranch, deps);
  d.executeGitCommandFn(`git merge --no-ff ${fromBranch}`, deps);
  console.log(chalk.green(`Merge of ${fromBranch} into ${toBranch} completed.`));
  pullChanges(deps);
}

export function checkConflicts(deps = {}) {
  const d = getDeps(deps);
  try {
    const status = d.executeGitCommandFn("git status --short", deps) || "";
    return status
      .split("\n")
      .filter((line) => line.startsWith("UU"))
      .map((line) => line.replace("UU ", "").trim());
  } catch (error) {
    console.error(chalk.red("❌ Error checking conflicts:"), error.message || error);
    return [];
  }
}

export function getConflictDiff(file, deps = {}) {
  const d = getDeps(deps);
  try {
    return d.executeGitCommandFn(`git diff ${file}`, deps);
  } catch (error) {
    console.error(chalk.red(`❌ Error getting conflict diff for '${file}':`), error.message || error);
    return "";
  }
}

export function writeConflictToTempFile(file, diff) {
  const tempFilePath = path.join(os.tmpdir(), `${path.basename(file)}_conflict.txt`);
  fs.writeFileSync(tempFilePath, diff, { encoding: "utf-8" });
  return tempFilePath;
}

export function openFileInEditor(tempFilePath, deps = {}) {
  const d = getDeps(deps);
  const editor = process.env.EDITOR || "vim";
  try {
    d.execSyncFn(`${editor} "${tempFilePath}"`, { stdio: "inherit" });
    console.log(chalk.green(`✔ Resolved file saved: ${tempFilePath}`));
  } catch (error) {
    console.error(chalk.red("❌ Error opening file in editor:"), error.message || error);
  }
}

export function updateFileFromTemp(file, tempFilePath, deps = {}) {
  const d = getDeps(deps);
  try {
    const resolvedContent = fs.readFileSync(tempFilePath, "utf-8");
    fs.writeFileSync(file, resolvedContent);
    d.executeGitCommandFn(`git add "${file}"`, deps);
    console.log(chalk.green(`✔ Conflict resolved and staged for: ${file}`));
  } catch (error) {
    console.error(chalk.red("❌ Error updating file from temp:"), error.message || error);
  }
}
