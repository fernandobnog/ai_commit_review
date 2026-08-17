import { execSync } from "child_process";
import chalk from "chalk";

export function getDeps(deps = {}) {
  return {
    execSyncFn: deps.execSyncFn || execSync,
  };
}

export function executeGitCommand(command, deps = {}) {
  const d = getDeps(deps);
  try {
    return d.execSyncFn(command, { encoding: "utf-8" }).trim();
  } catch (error) {
    console.error(chalk.red(`❌ Error executing Git command '${command}': ${error.message || error}`));
    throw error;
  }
}

export function formatGitDate(timestamp) {
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

export function truncateString(str, maxLength) {
  return str.length <= maxLength ? str : `${str.slice(0, maxLength - 3)}...`;
}

export function getCommits(skip = 0, limit = 5, deps = {}) {
  try {
    const output = executeGitCommand(
      `git log --skip=${skip} -n ${limit} --pretty=format:"%H\x1f%ct\x1f%s"`,
      deps
    );
    if (!output) return [];
    return output.split("\n").map((line) => {
      const [shaFull, timestamp, message] = line.split("\x1f");
      return {
        shaFull,
        shaShort: shaFull ? shaFull.slice(0, 7) : "",
        date: formatGitDate(timestamp || "0"),
        message: truncateString((message || "").replace(/\n/g, " "), 100),
      };
    });
  } catch (error) {
    console.error(chalk.red("❌ Error fetching commits:"), error.message || error);
    return [];
  }
}

export function getModifiedFiles(sha, deps = {}) {
  try {
    const output = executeGitCommand(
      `git diff-tree --no-commit-id --name-status -r ${sha}`,
      deps
    );
    if (!output) return [];
    return output.split("\n").map((line) => {
      const [status, file] = line.trim().split("\t");
      return { status, file };
    });
  } catch (error) {
    console.error(chalk.red("❌ Error retrieving modified files:"), error.message || error);
    return [];
  }
}

export function getFileDiff(sha, file, deps = {}) {
  try {
    return executeGitCommand(`git diff ${sha}~1 ${sha} -- ${file} || true`, deps);
  } catch (error) {
    console.error(chalk.red(`❌ Error retrieving diff for file '${file}':`), error.message || error);
    return "";
  }
}

export function getRepositoryDiff(deps = {}) {
  try {
    return executeGitCommand("git diff", deps);
  } catch (error) {
    console.error(chalk.red("❌ Error retrieving repository diff:"), error.message || error);
    return "";
  }
}

export function clearStage(deps = {}) {
  try {
    executeGitCommand("git reset", deps);
    console.log(chalk.green("✔ Stage cleared. All changes unstaged."));
  } catch (error) {
    console.error(chalk.red("❌ Error clearing stage:"), error.message || error);
  }
}

export function stageAllChanges(deps = {}) {
  try {
    executeGitCommand("git add .", deps);
    console.log(chalk.green("✔ All changes have been staged."));
  } catch (error) {
    console.error(chalk.red("❌ Error staging all changes:"), error.message || error);
    throw error;
  }
}

export function undoLastCommitSoft(deps = {}) {
  try {
    console.log(chalk.blue("🔄 Undoing the last commit without altering the changes..."));
    executeGitCommand("git reset --soft HEAD~1", deps);
    console.log(chalk.green("✔ Last commit undone. The changes remain staged."));
  } catch (error) {
    console.error(chalk.red("❌ Failed to undo the last commit:"), error.message || error);
    throw error;
  }
}

export function commitChangesWithEditor(tempFilePath, deps = {}) {
  const d = getDeps(deps);
  try {
    d.execSyncFn(`git commit --edit --file="${tempFilePath}" --no-verify`, { stdio: "inherit" });
    console.log(chalk.green("✔ Commit successfully made!"));
  } catch (error) {
    console.error(chalk.red("❌ Error making commit:"), error.message || error);
    throw error;
  }
}

export function getStagedFileDiff(file, deps = {}) {
  try {
    return executeGitCommand(`git diff --cached -- "${file}"`, deps);
  } catch (error) {
    console.error(chalk.red(`❌ Error getting diff for file '${file}':`), error.message || error);
    try {
      const isDeletedFile = executeGitCommand(`git ls-files --deleted -- "${file}"`, deps).length > 0;
      if (isDeletedFile) {
        console.warn(chalk.yellow(`⚠️ File '${file}' was deleted.`));
        return `File deleted: ${file}`;
      }
    } catch (e) {}
    return "";
  }
}

export function getStagedFilesDiffs(deps = {}) {
  try {
    const files = executeGitCommand("git diff --cached --name-only", deps)
      .split("\n")
      .filter(Boolean);

    return files.map((file) => {
      const diff = getStagedFileDiff(file, deps);
      return { filename: file, diff };
    });
  } catch (error) {
    console.error(chalk.red("❌ Error retrieving diffs for staged files:"), error.message || error);
    return [];
  }
}
