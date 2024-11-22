// createCommits.js
import chalk from "chalk";
import inquirer from "inquirer";
import {
  clearStage,
  checkConflicts,
  getCurrentBranch,
  listBranches,
  switchBranch,
  stageAllChanges,
  commitChangesWithEditor,
  getStagedFilesDiffs,
  pushChanges,
} from "./gitUtils.js";
import { analyzeUpdatedCode } from "./openaiUtils.js";
import { PromptType } from "./models.js";
import fs from "fs";
import path from "path";
import os from "os";

/**
 * Confirms the current branch or allows switching to another.
 */
async function confirmOrSwitchBranch() {
  const currentBranch = getCurrentBranch();
  console.log(chalk.blue(`You are currently on the branch: ${currentBranch}`));

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
      console.log(chalk.red("❌ Resolve the conflicts before proceeding."));
      process.exit(1);
    } else {
      console.log(chalk.yellow("⚠️ Continuing with conflicts."));
    }
  } else {
    console.log(chalk.green("✔ No conflicts detected."));
  }
}

/**
 * Helper function to read the commit message from the temporary file.
 * @param {string} tempFile - Path to the temporary file.
 * @returns {string} - Updated commit message.
 */
function readCommitMessage(tempFile) {
  try {
    return fs.readFileSync(tempFile, { encoding: "utf-8" }).trim();
  } catch (error) {
    console.error(chalk.red("❌ Error reading commit message:"), error.message);
    return "";
  }
}

/**
 * Main flow to create a commit.
 */
export async function createCommit() {
  try {
    // 1. Confirm or switch branch
    await confirmOrSwitchBranch();

    // 2. Clear the stage
    clearStage();

    // 3. Check for conflicts
    await verifyConflicts();

    // 4. Stage all changes
    stageAllChanges();

    // 5. Get the list of diffs for staged files
    const stagedFiles = getStagedFilesDiffs();

    if (stagedFiles.length === 0) {
      console.log(chalk.yellow("⚠️ No staged changes to commit."));
      process.exit(0);
    }

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
        commitMessage = await analyzeUpdatedCode(
          stagedFiles,
          PromptType.CREATE
        ); // Pass the diffs
      }

      if (messageOption === "manual") {
        const { manualMessage } = await inquirer.prompt([
          {
            type: "input",
            name: "manualMessage",
            message: "Enter your commit message:",
            validate: (input) =>
              input.trim() === ""
                ? "The commit message cannot be empty."
                : true,
          },
        ]);
        commitMessage = manualMessage;
      }

      // Path to the temporary file
      const tempFile = path.join(os.tmpdir(), "commit_message.txt");

      // Write the initial message to the temporary file
      fs.writeFileSync(tempFile, commitMessage, { encoding: "utf-8" });

      // Open editor to finalize the commit message
      commitChangesWithEditor(tempFile);

      // Read the updated commit message after editing
      const updatedCommitMessage = readCommitMessage(tempFile);

      // Remove the temporary file after reading
      fs.unlinkSync(tempFile);

      // Check if the commit message is not empty
      if (!updatedCommitMessage) {
        console.log(chalk.red("❌ The commit message is empty."));
      } else {
        commitMessage = updatedCommitMessage;
        finalMessageGenerated = true; // Exit the loop if the message is not empty
      }
    }
    // 7. Prompt to push
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
