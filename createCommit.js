// createCommits.js
import chalk from "chalk";
import inquirer from "inquirer";
import {
  clearStage,
  checkConflicts,
  getCurrentBranch,
  listBranches,
  switchBranch,
  stageAllChanges, // Importing the new function
  commitChangesWithEditor,
  pushChanges,
} from "./gitUtils.js";
import { analyzeUpdatedCode } from "./openaiUtils.js";

/**
 * Confirms the current branch or allows switching to another.
 */
async function confirmOrSwitchBranch() {
  const currentBranch = getCurrentBranch();
  console.log(chalk.blue(`You are currently on branch: ${currentBranch}`));

  const { continueOnBranch } = await inquirer.prompt([
    {
      type: "confirm",
      name: "continueOnBranch",
      message: "Do you want to continue working on this branch?",
      default: true,
    },
  ]);

  if (!continueOnBranch) {
    const branches = listBranches();
    const { selectedBranch } = await inquirer.prompt([
      {
        type: "list",
        name: "selectedBranch",
        message: "Select the branch to switch to:",
        choices: branches,
      },
    ]);

    switchBranch(selectedBranch);
  }
}

/**
 * Checks for conflicts and allows the user to proceed or cancel.
 */
async function verifyConflicts() {
  const conflicts = checkConflicts();

  if (conflicts.length > 0) {
    console.log(chalk.red("❌ Conflicts detected in the following files:"));
    conflicts.forEach((file, index) => {
      console.log(`${index + 1}. ${file}`);
    });

    const { continueWithConflicts } = await inquirer.prompt([
      {
        type: "confirm",
        name: "continueWithConflicts",
        message: "Do you want to continue even with conflicts?",
        default: false,
      },
    ]);

    if (!continueWithConflicts) {
      console.log(chalk.red("❌ Resolve conflicts before proceeding."));
      process.exit(1);
    } else {
      console.log(chalk.yellow("⚠️ Continuing with conflicts."));
    }
  } else {
    console.log(chalk.green("✔ No conflicts detected."));
  }
}

/**
 * Main workflow to create a commit.
 */
export async function createCommit() {
  try {
    // 1. Confirm or switch branch
    await confirmOrSwitchBranch();

    // 2. Clear the stage
    clearStage();

    // 3. Verify conflicts
    await verifyConflicts();

    // 4. Stage all changes
    stageAllChanges();

    // 5. Remove the redundant message
    // Removed: console.log(chalk.green("✔ All changes have been staged and are ready to commit."));

    // 6. Ask how to proceed with the commit message
    let commitMessage = "";
    let finalMessageGenerated = false;

    while (!finalMessageGenerated) {
      const { messageOption } = await inquirer.prompt([
        {
          type: "list",
          name: "messageOption",
          message: "How would you like to proceed with the commit message?",
          choices: [
            { name: "Generate with AI and edit", value: "ai" },
            { name: "Write my own", value: "manual" },
            { name: "Cancel", value: "cancel" },
          ],
        },
      ]);

      if (messageOption === "cancel") {
        console.log(chalk.yellow("⚠️ Commit process canceled."));
        process.exit(0);
      }

      if (messageOption === "ai") {
        // Generate commit message using AI
        console.log(chalk.blue("📤 Generating commit message with AI..."));
        commitMessage = await analyzeUpdatedCode(); // Adjusted to not require parameters
      }

      if (messageOption === "manual") {
        const { manualMessage } = await inquirer.prompt([
          {
            type: "input",
            name: "manualMessage",
            message: "Enter your commit message:",
            validate: (input) =>
              input.trim() === "" ? "Commit message cannot be empty." : true,
          },
        ]);
        commitMessage = manualMessage;
      }

      // Open editor to finalize commit message
      commitChangesWithEditor(commitMessage);

      // Check if the commit message is still empty after editing
      if (!commitMessage.trim()) {
        console.log(chalk.red("❌ Commit message is empty."));
      } else {
        finalMessageGenerated = true; // Exit loop if message is not empty
      }
    }

    // 7. Prompt for push
    const { push } = await inquirer.prompt([
      {
        type: "confirm",
        name: "push",
        message: "Do you want to push to the remote repository?",
        default: true,
      },
    ]);

    if (push) {
      pushChanges();
    } else {
      console.log(chalk.yellow("⚠️ Push not performed."));
    }
  } catch (error) {
    console.error(
      chalk.red("❌ Error during the commit creation process:"),
      error.message
    );
  }
}
