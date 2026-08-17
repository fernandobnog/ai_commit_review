// commitFlowHandlers.js
import chalk from "chalk";
import inquirer from "inquirer";
import fs from "fs";
import path from "path";
import os from "os";
import {
  getCurrentBranch,
  listBranches,
  switchBranch,
  checkConflicts,
  getConflictDiff,
  writeConflictToTempFile,
  openFileInEditor,
  updateFileFromTemp,
  commitChangesWithEditor,
  undoLastCommitSoft,
  executeGitCommand
} from "./gitUtils.js";
import { analyzeUpdatedCode } from "./openaiUtils.js";
import { buildContextForFiles } from "./contextManager.js";
import { PromptType } from "./models.js";

export function getDeps(deps = {}) {
  return {
    getCurrentBranchFn: deps.getCurrentBranchFn || getCurrentBranch,
    listBranchesFn: deps.listBranchesFn || listBranches,
    switchBranchFn: deps.switchBranchFn || switchBranch,
    checkConflictsFn: deps.checkConflictsFn || checkConflicts,
    getConflictDiffFn: deps.getConflictDiffFn || getConflictDiff,
    writeConflictToTempFileFn: deps.writeConflictToTempFileFn || writeConflictToTempFile,
    openFileInEditorFn: deps.openFileInEditorFn || openFileInEditor,
    updateFileFromTempFn: deps.updateFileFromTempFn || updateFileFromTemp,
    executeGitCommandFn: deps.executeGitCommandFn || executeGitCommand,
    commitChangesWithEditorFn: deps.commitChangesWithEditorFn || commitChangesWithEditor,
    undoLastCommitSoftFn: deps.undoLastCommitSoftFn || undoLastCommitSoft,
    buildContextForFilesFn: deps.buildContextForFilesFn || buildContextForFiles,
    analyzeUpdatedCodeFn: deps.analyzeUpdatedCodeFn || analyzeUpdatedCode,
    promptFn: deps.promptFn || inquirer.prompt,
  };
}

export async function confirmOrSwitchBranch(deps = {}) {
  const d = getDeps(deps);
  const currentBranch = d.getCurrentBranchFn();
  console.log(chalk.blue(`You are currently on the branch: ${currentBranch}`));

  const { continueOnBranch } = await d.promptFn([
    {
      type: "confirm",
      name: "continueOnBranch",
      message: "Do you want to continue working on this branch?",
      default: true,
    },
  ]);

  if (!continueOnBranch) {
    const branches = d.listBranchesFn();
    const { selectedBranch } = await d.promptFn([
      {
        type: "list",
        name: "selectedBranch",
        message: "Select the branch to switch to:",
        choices: branches,
      },
    ]);
    d.switchBranchFn(selectedBranch);
  }
}

export async function verifyConflicts(deps = {}) {
  const d = getDeps(deps);
  const conflicts = d.checkConflictsFn();
  if (conflicts.length === 0) {
    console.log(chalk.green("✔ No conflicts detected."));
    return;
  }

  console.log(chalk.red("❌ Conflicts detected in the following files:"));
  conflicts.forEach((file, index) => console.log(`${index + 1}. ${file}`));

  const { resolutionOption } = await d.promptFn([
    {
      type: "list",
      name: "resolutionOption",
      message: "How would you like to resolve the conflicts?",
      choices: [
        { name: "Resolve manually in an editor", value: "manual" },
        { name: "Resolve automatically using mergetool", value: "automatic" },
        { name: "Cancel and resolve later", value: "cancel" },
      ],
    },
  ]);

  if (resolutionOption === "manual") {
    await resolveConflictsManually(conflicts, deps);
  } else if (resolutionOption === "automatic") {
    await resolveConflictsAutomatically(conflicts, deps);
  } else {
    console.log(chalk.red("❌ Resolve the conflicts before proceeding."));
    throw new Error("Conflicts unresolved.");
  }
}

export async function resolveConflictsManually(conflicts, deps = {}) {
  const d = getDeps(deps);
  for (const file of conflicts) {
    console.log(chalk.yellow(`Resolving conflict for: ${file}`));
    const diff = d.getConflictDiffFn(file);
    if (!diff) continue;

    const tempFilePath = d.writeConflictToTempFileFn(file, diff);
    d.openFileInEditorFn(tempFilePath);

    const { confirmResolution } = await d.promptFn([
      {
        type: "confirm",
        name: "confirmResolution",
        message: `Have you resolved the conflict for: ${file}?`,
        default: true,
      },
    ]);

    if (confirmResolution) {
      d.updateFileFromTempFn(file, tempFilePath);
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  }
}

export async function resolveConflictsAutomatically(conflicts, deps = {}) {
  const d = getDeps(deps);
  console.log(chalk.blue("⚙️ Launching mergetool to resolve conflicts..."));
  conflicts.forEach((file) => d.executeGitCommandFn(`git mergetool -- ${file}`));
  console.log(chalk.green("✔ Conflicts resolved using mergetool."));

  const { stageChanges } = await d.promptFn([
    {
      type: "confirm",
      name: "stageChanges",
      message: "Would you like to stage the resolved files?",
      default: true,
    },
  ]);

  if (stageChanges) {
    d.executeGitCommandFn("git add .");
  }
}

export async function obtainCommitMessage(stagedFiles, deps = {}) {
  const d = getDeps(deps);
  let commitMessage = "";
  let finalMessageGenerated = false;

  while (!finalMessageGenerated) {
    const { messageOption } = await d.promptFn([
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
      throw new Error("Commit process canceled by user.");
    }

    if (messageOption === "ai") {
      console.log(chalk.blue("📤 Generating commit message with AI..."));
      const condensed = await d.buildContextForFilesFn(stagedFiles, PromptType.CREATE);
      commitMessage = await d.analyzeUpdatedCodeFn(condensed, PromptType.CREATE);
    } else {
      const { manualMessage } = await d.promptFn([
        {
          type: "input",
          name: "manualMessage",
          message: "Enter your commit message:",
          validate: (input) => (input.trim() === "" ? "Cannot be empty." : true),
        },
      ]);
      commitMessage = manualMessage;
    }

    const tempFile = path.join(os.tmpdir(), "commit_message.txt");
    fs.writeFileSync(tempFile, commitMessage, { encoding: "utf-8" });
    d.commitChangesWithEditorFn(tempFile);

    const updatedMessage = fs.readFileSync(tempFile, { encoding: "utf-8" }).trim();
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }

    if (updatedMessage) {
      commitMessage = updatedMessage;
      finalMessageGenerated = true;
    } else {
      console.log(chalk.red("❌ Commit message is empty."));
    }
  }

  return commitMessage;
}

export async function handleCommitAbortOrPush(deps = {}) {
  const d = getDeps(deps);
  const { abortCommit } = await d.promptFn([
    {
      type: "confirm",
      name: "abortCommit",
      message: "Do you want to abort the commit and undo all changes?",
      default: false,
    },
  ]);

  if (abortCommit) {
    d.undoLastCommitSoftFn();
    console.log(chalk.yellow("⚠️ Commit aborted. Changes returned to unstaged."));
    return false;
  }
  return true;
}
