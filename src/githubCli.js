import { execFileSync } from "child_process";
import chalk from "chalk";

export function getDeps(deps = {}) {
  return {
    execFileSyncFn: deps.execFileSyncFn || execFileSync,
  };
}

export function createPullRequest({ base, head, title, body, reviewer }, deps = {}) {
  const d = getDeps(deps);
  try {
    d.execFileSyncFn("gh", ["--version"], { stdio: "ignore" });
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
    console.error(chalk.red("❌ Error creating pull request:"), error.message || error);
    throw error;
  }
}
