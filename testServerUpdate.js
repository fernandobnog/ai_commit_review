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
import { createCommit } from "./createCommit.js"; // Create commits

export async function updateServerToTest() {
  try{
    await dockerCheck();
    await createCommit();
    await mergeToTest(); // renamed function
    pushChanges();
    switchBranch('develop');
  }catch(err){
    console.error(err);
    process.exit(1);
  }
}

// Renamed mergeToTeste to mergeToTest with updated branch names and messages
async function mergeToTest(){
      const currentBranch = await getCurrentBranch();

      if (currentBranch === 'test') {
        console.log(chalk.green('You are already on the test branch.'));
        return;
      }

      if (currentBranch === 'develop') {
        await mergeBranch('develop', 'teste');
        return;
      }

      await mergeBranch(currentBranch, 'develop');
      await mergeBranch('develop', 'teste');
      await switchBranch('teste');
}

// Updated dockerCheck to English prompts and messages
async function dockerCheck() {
  const { isDockerized } = await inquirer.prompt([
    { type: 'confirm', name: 'isDockerized', message: 'Is the project dockerized?', default: true },
  ]);

  if (isDockerized) {
    // Changed: using process.cwd() so the version file is relative to the project root.
    const versionFilePath = path.join(process.cwd(), 'docker', 'versao.txt');
    console.log(chalk.blue(versionFilePath));

    const currentVersion = fs.existsSync(versionFilePath)
      ? fs.readFileSync(versionFilePath, 'utf8').trim()
      : 'No version found';
    console.log(chalk.blue(`Current version: ${currentVersion}`));

    const { updateVersion } = await inquirer.prompt([
      { type: 'confirm', name: 'updateVersion', message: 'Do you need to update the project version to be committed?', default: false },
    ]);

    if (updateVersion) {
      const { version } = await inquirer.prompt([
        {
          type: 'input',
          name: 'version',
          message: 'Enter the new version (format yyyy.nn.nnn):',
          validate: function (input) {
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
  } else {
    console.log(chalk.yellow('The project is not dockerized.'));
  }
}
