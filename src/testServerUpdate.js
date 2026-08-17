// testServerUpdate.js
import {
  getCurrentBranch,
  mergeBranch,
  switchBranch,
  pushChanges
} from "./gitUtils.js";
import chalk from "chalk";
import inquirer from "inquirer";
import fs from "fs";
import path from "path";
import os from "os";
import { createCommit } from "./createCommit.js";

export function getDeps(deps = {}) {
  return {
    getCurrentBranchFn: deps.getCurrentBranchFn || getCurrentBranch,
    mergeBranchFn: deps.mergeBranchFn || mergeBranch,
    switchBranchFn: deps.switchBranchFn || switchBranch,
    pushChangesFn: deps.pushChangesFn || pushChanges,
    createCommitFn: deps.createCommitFn || createCommit,
    promptFn: deps.promptFn || inquirer.prompt,
    baseDir: deps.baseDir || process.cwd(),
  };
}

export function getDockerFolders(baseDir) {
  const rootDocker = path.join(baseDir, 'docker');
  if (fs.existsSync(rootDocker) && fs.statSync(rootDocker).isDirectory()) {
    return ['docker'];
  }

  const folders = [];
  const directories = fs.readdirSync(baseDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && !['node_modules', '.git'].includes(entry.name));

  directories.forEach(entry => {
    const dockerPath = path.join(baseDir, entry.name, 'docker');
    if (fs.existsSync(dockerPath) && fs.statSync(dockerPath).isDirectory()) {
      folders.push(path.join(entry.name, 'docker'));
    }
  });

  return folders;
}

export async function promptVersionUpdate(folder, deps = {}) {
  const d = getDeps(deps);
  const versionFilePath = path.join(d.baseDir, folder, 'versao.txt');
  console.log(chalk.blue(`Checking version file at: ${versionFilePath}`));

  const currentVersion = fs.existsSync(versionFilePath)
    ? fs.readFileSync(versionFilePath, 'utf8').trim()
    : 'No version found';
  console.log(chalk.blue(`Current version: ${currentVersion}`));

  const { updateVersion } = await d.promptFn([
    { type: 'confirm', name: 'updateVersion', message: 'Do you need to update the project version to be committed?', default: false },
  ]);

  if (updateVersion) {
    const { version } = await d.promptFn([
      {
        type: 'input',
        name: 'version',
        message: 'Enter the new version (format yyyy.nn.nnn):',
        validate: (input) => {
          const versionRegex = /^\d{4}\.\d{2}\.\d{3}$/;
          return versionRegex.test(input) ? true : 'The version must be in the format yyyy.nn.nnn';
        },
      },
    ]);

    fs.writeFileSync(versionFilePath, version + os.EOL, 'utf8');
    console.log(chalk.green('Version updated successfully!'));
  } else {
    console.log(chalk.yellow('Version was not updated.'));
  }
}

export async function dockerCheck(deps = {}) {
  const d = getDeps(deps);
  const { isDockerized } = await d.promptFn([
    { type: 'confirm', name: 'isDockerized', message: 'Is the project dockerized?', default: true },
  ]);

  if (!isDockerized) {
    console.log(chalk.yellow('The project is not dockerized.'));
    return false;
  }

  const discoveredFolders = getDockerFolders(d.baseDir);
  if (discoveredFolders.length > 0) {
    console.log(chalk.blue('Discovered docker folders:'));
    discoveredFolders.forEach(folder => console.log(chalk.blue(`- ${folder}`)));
  } else {
    console.log(chalk.yellow('No docker folders found.'));
    return false;
  }

  for (const folder of discoveredFolders) {
    await promptVersionUpdate(folder, deps);
  }
  return true;
}

export async function mergeToTest(deps = {}) {
  const d = getDeps(deps);
  const currentBranch = await d.getCurrentBranchFn();

  if (currentBranch === 'test' || currentBranch === 'teste') {
    console.log(chalk.green('You are already on the test branch.'));
    return;
  }

  if (currentBranch === 'develop') {
    await d.mergeBranchFn('develop', 'teste');
    return;
  }

  await d.mergeBranchFn(currentBranch, 'develop');
  await d.mergeBranchFn('develop', 'teste');
  await d.switchBranchFn('teste');
}

export async function updateServerToTest(deps = {}) {
  const d = getDeps(deps);
  try {
    const isDockerOk = await dockerCheck(deps);
    if (!isDockerOk) {
      return;
    }

    await d.createCommitFn(deps);
    await mergeToTest(deps);
    d.pushChangesFn();
    d.switchBranchFn('develop');
  } catch (err) {
    console.error(chalk.red("❌ Error during test server update:"), err.message || err);
    throw err;
  }
}
