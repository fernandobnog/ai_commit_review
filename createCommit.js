// createCommits.js
import chalk from "chalk";
import inquirer from "inquirer";
import {
  pullChanges,
  clearStage,
  checkConflicts,
  getCurrentBranch,
  listBranches,
  switchBranch,
  stageAllChanges,
  commitChangesWithEditor,
  getStagedFilesDiffs,
  pushChanges,
  getConflictDiff,
  writeConflictToTempFile,
  openFileInEditor,
  updateFileFromTemp,
  undoLastCommitSoft,
} from "./gitUtils.js";
import { analyzeUpdatedCode } from "./openaiUtils.js";
import { PromptType } from "./models.js";
import fs from "fs";
import path from "path";
import os from "os";
import i18n from "./i18n.js"; // Importa o i18n

/**
 * Confirms the current branch or allows switching to another.
 */
async function confirmOrSwitchBranch() {
  const currentBranch = getCurrentBranch();
  console.log(
    chalk.blue(
      i18n.__("createCommits.branch.current", { branch: currentBranch })
    )
  );

  const { continueOnBranch } = await inquirer.prompt([
    {
      type: "confirm",
      name: "continueOnBranch",
      message: i18n.__("createCommits.branch.continuePrompt"),
      default: true,
    },
  ]);

  if (!continueOnBranch) {
    const branches = listBranches();
    const { selectedBranch } = await inquirer.prompt([
      {
        type: "list",
        name: "selectedBranch",
        message: i18n.__("createCommits.branch.selectPrompt"),
        choices: branches,
      },
    ]);

    switchBranch(selectedBranch);
  }
}

/**
 * Allows manual conflict resolution in an editor.
 */
async function resolveConflictsManually(conflicts) {
  for (const file of conflicts) {
    console.log(
      chalk.yellow(i18n.__("createCommits.conflict.resolving", { file }))
    );
    const diff = getConflictDiff(file);

    if (!diff) {
      console.log(
        chalk.red(i18n.__("createCommits.conflict.unableGetDiff", { file }))
      );
      continue;
    }

    const tempFilePath = writeConflictToTempFile(file, diff);
    openFileInEditor(tempFilePath);

    const { confirmResolution } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirmResolution",
        message: i18n.__("createCommits.conflict.confirmResolution", { file }),
        default: true,
      },
    ]);

    if (confirmResolution) {
      updateFileFromTemp(file, tempFilePath);
      fs.unlinkSync(tempFilePath); // Clean up temp file
    } else {
      console.log(
        chalk.red(i18n.__("createCommits.conflict.notResolved", { file }))
      );
    }
  }
}

/**
 * Allows Automatically conflict resolution in an editor.
 */
async function resolveConflictsAutomatically(conflicts) {
  try {
    console.log(chalk.blue(i18n.__("createCommits.conflict.launchMergeTool")));
    conflicts.forEach((file) => {
      console.log(
        chalk.yellow(i18n.__("createCommits.conflict.resolving", { file }))
      );
      executeGitCommand(`git mergetool --no-prompt -- ${file}`);
    });
    console.log(
      chalk.green(i18n.__("createCommits.conflict.resolvedUsingMergetool"))
    );

    const { stageChanges } = await inquirer.prompt([
      {
        type: "confirm",
        name: "stageChanges",
        message: i18n.__("createCommits.conflict.stageChangesPrompt"),
        default: true,
      },
    ]);

    if (stageChanges) {
      executeGitCommand("git add .");
      console.log(
        chalk.green(i18n.__("createCommits.conflict.resolvedFilesStaged"))
      );
    } else {
      console.log(
        chalk.yellow(i18n.__("createCommits.conflict.filesNotStagedWarning"))
      );
    }
  } catch (error) {
    console.error(
      chalk.red(i18n.__("createCommits.conflict.errorResolvingAutomatically")),
      error.message
    );
    process.exit(1);
  }
}

/**
 * Checks for conflicts and allows the user to proceed or resolve them manually.
 */
async function verifyConflicts() {
  const conflicts = checkConflicts();

  if (conflicts.length > 0) {
    console.log(chalk.red(i18n.__("createCommits.conflict.detected")));
    conflicts.forEach((file, index) => {
      console.log(`${index + 1}. ${file}`);
    });

    const { resolutionOption } = await inquirer.prompt([
      {
        type: "list",
        name: "resolutionOption",
        message: i18n.__("createCommits.conflict.resolutionOptionPrompt"),
        choices: [
          {
            name: i18n.__("createCommits.conflict.resolutionOptions.manual"),
            value: "manual",
          },
          {
            name: i18n.__("createCommits.conflict.resolutionOptions.automatic"),
            value: "automatic",
          },
          {
            name: i18n.__("createCommits.conflict.resolutionOptions.cancel"),
            value: "cancel",
          },
        ],
      },
    ]);

    if (resolutionOption === "manual") {
      await resolveConflictsManually(conflicts);
    } else if (resolutionOption === "automatic") {
      await resolveConflictsAutomatically(conflicts);
    } else if (resolutionOption === "cancel") {
      console.log(
        chalk.red(i18n.__("createCommits.conflict.resolveBeforeProceeding"))
      );
      process.exit(1);
    }
  } else {
    console.log(chalk.green(i18n.__("createCommits.general.noConflicts")));
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
    console.error(
      chalk.red(i18n.__("createCommits.general.errorReadingCommitMessage")),
      error.message
    );
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

    // 2 .Pull the latest changes from the remote repository
    pullChanges();

    // 3. Clear the stage
    clearStage();

    // 4. Check for conflicts
    await verifyConflicts();

    // 5. Stage all changes
    stageAllChanges();

    // 6. Get the list of diffs for staged files
    const stagedFiles = getStagedFilesDiffs();

    if (stagedFiles.length === 0) {
      console.log(
        chalk.yellow(i18n.__("createCommits.commit.noStagedChanges"))
      );
      process.exit(0);
    }

    // 7. Ask how to proceed with the commit message
    let commitMessage = "";
    let finalMessageGenerated = false;

    while (!finalMessageGenerated) {
      const { messageOption } = await inquirer.prompt([
        {
          type: "list",
          name: "messageOption",
          message: i18n.__("createCommits.commit.messageOptionPrompt"),
          choices: [
            { name: i18n.__("createCommits.commit.options.ai"), value: "ai" },
            {
              name: i18n.__("createCommits.commit.options.manual"),
              value: "manual",
            },
            {
              name: i18n.__("createCommits.commit.options.cancel"),
              value: "cancel",
            },
          ],
        },
      ]);

      if (messageOption === "cancel") {
        console.log(
          chalk.yellow(i18n.__("createCommits.commit.processCanceled"))
        );
        process.exit(0);
      }

      if (messageOption === "ai") {
        // Generate commit message using AI
        console.log(chalk.blue(i18n.__("createCommits.commit.generatingAI")));
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
            message: i18n.__("createCommits.commit.enterManualMessage"),
            validate: (input) =>
              input.trim() === ""
                ? i18n.__("createCommits.commit.emptyMessageError")
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
        console.log(
          chalk.red(i18n.__("createCommits.commit.emptyMessageError"))
        );
      } else {
        commitMessage = updatedCommitMessage;
        finalMessageGenerated = true; // Exit the loop if the message is not empty
      }
    }

    // **New section added: Ask if the user wants to abort the commit**
    const { abortCommit } = await inquirer.prompt([
      {
        type: "confirm",
        name: "abortCommit",
        message: i18n.__("createCommits.commit.abortPrompt"),
        default: false,
      },
    ]);

    // If the user wants to abort the commit, undo the last commit and return the changes to unstaged
    if (abortCommit) {
      try {
        // Undo the last commit and return the changes to unstaged
        undoLastCommitSoft();
        console.log(
          chalk.yellow(i18n.__("createCommits.commit.commitAborted"))
        );
        process.exit(0); // Exit the process after aborting
      } catch (error) {
        console.error(
          chalk.red(i18n.__("createCommits.commit.errorAborting")),
          error.message
        );
        process.exit(1);
      }
    }

    // 7. Prompt to push
    const { push } = await inquirer.prompt([
      {
        type: "confirm",
        name: "push",
        message: i18n.__("createCommits.push.pushPrompt"),
        default: true,
      },
    ]);

    if (push) {
      pushChanges();
    } else {
      console.log(chalk.yellow(i18n.__("createCommits.push.pushNotPerformed")));
    }
  } catch (error) {
    console.error(
      chalk.red(i18n.__("createCommits.general.errorDuringCommitProcess")),
      error.message
    );
  }
}
