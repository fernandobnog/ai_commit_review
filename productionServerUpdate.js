// testServerUpdate.js
import {
  createPullRequest,
  mergeBranch,
  executeGitCommand
} from "./gitUtils.js";

import chalk from "chalk";
import inquirer from "inquirer";

export async function updateServerToProduction() {
  
  const branchOrigem = 'teste';
  const branchPR = 'master';
  const branchDestino = 'develop';
  const revisor = 'fernandobnog';

  try {
    console.log(chalk.blue(`ℹ️  Mudando para a branch ${branchOrigem}...`));
    await executeGitCommand("git checkout " + branchOrigem);

    console.log(chalk.blue("ℹ️  Verificando alterações não commitadas..."));
    const { stdout } = await executeGitCommand("git status --porcelain");

    if (stdout.trim()) {
      console.error(
        chalk.red(
          "❌ Existem alterações não commitadas na branch. Por favor, faça commit das alterações e realize novos testes antes de colocar em produção."
        )
      );
      process.exit(1);
    }


    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: 'A branch "teste" está funcionando corretamente?',
        default: true
      }
    ]);

    if (!confirm) {
      throw new Error('A branch "teste" não está funcionando corretamente. Corrija e tente novamente.');
    }

    const { deployConfirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "deployConfirm",
        message: "A branch 'teste' está funcionando corretamente. Deseja colocá-la em produção?",
        default: true
      }
    ]);

    if (deployConfirm) {
      const { finalDeploy } = await inquirer.prompt([
        {
          type: "confirm",
          name: "finalDeploy",
          message: "Tem certeza? Essa ação não poderá ser desfeita.",
          default: false
        }
      ]);
      if (!finalDeploy) {
        console.log(chalk.yellow("Operação cancelada pelo usuário."));
        return;
      }
    }

    if (!deployConfirm) {
      console.log(chalk.yellow("Operação cancelada pelo usuário."));
      process.exit(0);
    }



    console.log(chalk.blue(`ℹ️  Fazendo merge da branch ${branchOrigem}...`));
    await mergeBranch(branchOrigem, branchDestino);

    console.log(chalk.blue(`ℹ️  Criando pull request de ${branchOrigem} para '${branchPR}'...`));
    createPullRequest({
      base: branchPR,
      head: branchOrigem,
      title: `Merge de ${branchOrigem} para ${branchPR}`,
      body: `Atualizar Servidor de Producao: Este pull request foi criado automaticamente para mesclar a branch '${branchOrigem}' na branch ${branchPR}.`,
      reviewer: revisor
    });

  console.log(chalk.green("ℹ️  Pull request criado com sucesso!"));
  console.log(chalk.yellow("⚠️  Atenção: NÃO aprove o pull request. Aguarde o Fernando revisar a solicitação."));

  } catch (error) {
    console.error(chalk.red("❌ Erro no fluxo de pull request e merge:"), error.message);
    throw error;
  }
}