// testServerUpdate.js
import {
  createPullRequest,
  mergeBranch,
  executeGitCommand,
  pullChanges,
  pushChanges
} from "./gitUtils.js";

import chalk from "chalk";
import inquirer from "inquirer";

async function verificaBranch() {
  const { branch } = await inquirer.prompt([
    {
      type: "input",
      name: "branch",
      message: "Enter the branch name to verify:",
      default: "teste"
    }
  ]);
  return branch;
}

export async function updateServerToProduction() {

  const branchOrigem = 'teste';
  const branchPR = 'master';
  const branchDestino = 'develop';
  const revisor = 'fernandobnog';

  try {
    const { stdout: currentBranch } = executeGitCommand("git rev-parse --abbrev-ref HEAD");
    if (currentBranch !== branchOrigem) {
      console.log(chalk.blue(`ℹ️  Switching to branch ${branchOrigem}...`));
      executeGitCommand("git checkout " + branchOrigem);
    } else {
      console.log(chalk.blue(`ℹ️  Already on branch ${branchOrigem}.`));
    }
    pullChanges();

    console.log(chalk.blue("ℹ️  Checking uncommitted changes..."));
    const { stdout } = executeGitCommand("git status --porcelain");
    if (stdout) {
      console.error(
        chalk.red(
          "❌ There are uncommitted changes in the branch. Please commit the changes and run new tests before putting into production."
        )
      );
      process.exit(1);
    }
    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: 'Is the "teste" branch working correctly?',
        default: true
      }
    ]);
    if (!confirm) {
      throw new Error('The "teste" branch is not working correctly. Fix it and try again.');
    }
    const { deployConfirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "deployConfirm",
        message: "The 'teste' branch is working correctly. Do you want to put it into production?",
        default: true
      }
    ]);

    if (deployConfirm) {
      const { finalDeploy } = await inquirer.prompt([
        {
          type: "confirm",
          name: "finalDeploy",
          message: "Are you sure? This action cannot be undone.",
          default: false
        }
      ]);
      if (!finalDeploy) {
        console.log(chalk.yellow("Operation cancelled by user."));
        return;
      }
    } 
    if (!deployConfirm) {
      console.log(chalk.yellow("Operation cancelled by user."));
      process.exit(0);
    }
    console.log(chalk.blue(`ℹ️  Merging branch ${branchOrigem}...`));
    await mergeBranch(branchOrigem, branchDestino);
    console.log(chalk.blue(`ℹ️  Creating pull request from ${branchOrigem} to '${branchPR}'...`));
    createPullRequest({
      base: branchPR,
      head: branchOrigem,
      title: `Merge from ${branchOrigem} to ${branchPR}`,
      body: `Update Production Server: This pull request was automatically created to merge the '${branchOrigem}' branch into the ${branchPR} branch.`,
      reviewer: revisor
    });
    console.log(chalk.green("ℹ️  Pull request created successfully!"));
    console.log(chalk.yellow("⚠️  Warning: DO NOT approve the pull request. Wait for Fernando to review the request."));

    const { stdout: currentBranch2 } = executeGitCommand("git rev-parse --abbrev-ref HEAD");
    if (currentBranch2 !== branchDestino) {
      console.log(chalk.blue(`ℹ️  Switching to branch ${branchDestino}...`));
      executeGitCommand("git checkout " + branchDestino);
    } else {
      console.log(chalk.blue(`ℹ️  Already on branch ${branchDestino}.`));
    }
    pushChanges();
  } catch (error) {
    console.error(chalk.red("❌ Error in pull request and merge flow:"), error.message);
    throw error;
  }
}