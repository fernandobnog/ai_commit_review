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

  if (!isDockerized) {
    console.log(chalk.yellow('The project is not dockerized.'));
    process.exit(0);
  }

  const getDockerFolders = () => {
    const baseDir = process.cwd();
    const rootDocker = path.join(baseDir, 'docker');
  
    // Se encontrar a pasta 'docker' no diretório base, retorna imediatamente
    if (fs.existsSync(rootDocker) && fs.statSync(rootDocker).isDirectory()) {
      return ['docker'];
    }
  
    const folders = [];
    // Lista as pastas do diretório base, excluindo 'node_modules' e '.git'
    const directories = fs.readdirSync(baseDir, { withFileTypes: true })
      .filter(entry => entry.isDirectory() && !['node_modules', '.git'].includes(entry.name));
  
    // Para cada diretório, verifica se existe uma subpasta 'docker'
    directories.forEach(entry => {
      const dockerPath = path.join(baseDir, entry.name, 'docker');
      if (fs.existsSync(dockerPath) && fs.statSync(dockerPath).isDirectory()) {
        folders.push(path.join(entry.name, 'docker'));
      }
    });
  
    return folders;
  };

  let discoveredFolders = getDockerFolders();
  if (discoveredFolders.length > 0) {
    console.log(chalk.blue('Discovered docker folders:'));
    discoveredFolders.forEach(folder => console.log(chalk.blue(`- ${folder}`)));
  } else {
    console.log(chalk.yellow('No docker folders found.'));
    process.exit(0);
  }

  //pastas localizadas de forma correta

  for (const folder of discoveredFolders) {
    const versionFilePath = path.join(process.cwd(), folder, 'versao.txt');
    console.log(chalk.blue(`Checking version file at: ${versionFilePath}`));

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
  }
}
