// githubCli.js
import { execFileSync, execSync } from "child_process";
import chalk from "chalk";

export function getDeps(deps = {}) {
  return {
    execSyncFn: deps.execSyncFn || execSync,
    execFileSyncFn: deps.execFileSyncFn || execFileSync
  };
}

/**
 * Creates a pull request safely using GitHub CLI (gh).
 * Prevents command injection by passing arguments via execFileSync array.
 * @param {object} params - Pull request parameters.
 * @returns {string} Output of the gh CLI command.
 */
export function createPullRequest({ base, head, title, body, reviewer }, deps = {}) {
  const d = getDeps(deps);

  try {
    d.execSyncFn("gh --version", { stdio: "ignore" });
  } catch (error) {
    console.error(chalk.red("❌ GitHub CLI (gh) is not installed. Please install it and try again."));
    throw new Error("GitHub CLI (gh) is not installed.");
  }

  try {
    const args = ["pr", "create", "--base", base, "--head", head, "--title", title, "--body", body];
    if (reviewer) {
      args.push("--reviewer", reviewer);
    }
    const resultado = d.execFileSyncFn("gh", args, { encoding: "utf-8" }).trim();
    console.log(chalk.green(`✔ Pull request created successfully: ${resultado}`));
    return resultado;
  } catch (error) {
    console.error(chalk.red("❌ Error creating pull request:"), error.message);
    throw error;
  }
}
