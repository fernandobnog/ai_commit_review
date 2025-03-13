// testServerUpdate.js


import {
  getCurrentBranch,
  switchBranch,
  pushChanges
} from "./gitUtils.js";

import chalk from "chalk";
import inquirer from "inquirer";

import fs from "fs";
import path from "path";
import os from "os";
import { createCommit, mergeBranch } from "./createCommit.js"; // Create commits

export async function updateServerToTest() {
  dockerCheck();
  await createCommit();
  await mergeToTeste();
  pushChanges();
  await switchBranch('develop');

}

async function mergeToTeste(){
      const currentBranch = await getCurrentBranch();

      if (currentBranch === 'teste') {
        console.log(chalk.green('Você já está na branch teste.'));
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

async function dockerCheck() {
  
  const { isDockerized } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'isDockerized',
      message: 'O projeto é dockerizado?',
      default: true,
    },
  ]);

  if (isDockerized) {
    const versionFilePath = path.join(__dirname, './docker/versao.txt');

    const currentVersion = fs.existsSync(versionFilePath) ? fs.readFileSync(versionFilePath, 'utf8').trim() : 'Nenhuma versão encontrada';
    console.log(chalk.blue(`Versão atual: ${currentVersion}`));

    const { updateVersion } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'updateVersion',
        message: 'Precisa atualizar a versão do projeto que vamos commitar?',
        default: false,
      },
    ]);

    if (updateVersion) {
      const { version } = await inquirer.prompt([
        {
          type: 'input',
          name: 'version',
          message: 'Digite a nova versão (formato aaaa.nn.nnnn):',
          validate: function (input) {
            const versionRegex = /^\d{4}\.\d{2}\.\d{4}$/;
            if (versionRegex.test(input)) {
              return true;
            }
            return 'A versão deve estar no formato aaaa.nn.nnnn';
          },
        },
      ]);

      fs.writeFileSync(versionFilePath, version + os.EOL, 'utf8');
      console.log(chalk.green('Versão atualizada com sucesso!'));
    } else {
      console.log(chalk.yellow('Versão não foi atualizada.'));
    }
  } else {
    console.log(chalk.yellow('O projeto não é dockerizado.'));
  }

}
