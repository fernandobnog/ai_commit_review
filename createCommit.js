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
import os from "os"; // <--- Certifique-se de que esta linha está presente

/**
 * Confirma o branch atual ou permite a troca para outro.
 */
async function confirmOrSwitchBranch() {
  const currentBranch = getCurrentBranch();
  console.log(chalk.blue(`Você está atualmente no branch: ${currentBranch}`));

  const { continueOnBranch } = await inquirer.prompt([
    {
      type: "confirm",
      name: "continueOnBranch",
      message: "Deseja continuar trabalhando neste branch?",
      default: true,
    },
  ]);

  if (!continueOnBranch) {
    const branches = listBranches();
    const { selectedBranch } = await inquirer.prompt([
      {
        type: "list",
        name: "selectedBranch",
        message: "Selecione o branch para alternar:",
        choices: branches,
      },
    ]);

    switchBranch(selectedBranch);
  }
}

/**
 * Verifica conflitos e permite que o usuário prossiga ou cancele.
 */
async function verifyConflicts() {
  const conflicts = checkConflicts();

  if (conflicts.length > 0) {
    console.log(chalk.red("❌ Conflitos detectados nos seguintes arquivos:"));
    conflicts.forEach((file, index) => {
      console.log(`${index + 1}. ${file}`);
    });

    const { continueWithConflicts } = await inquirer.prompt([
      {
        type: "confirm",
        name: "continueWithConflicts",
        message: "Deseja continuar mesmo com conflitos?",
        default: false,
      },
    ]);

    if (!continueWithConflicts) {
      console.log(chalk.red("❌ Resolva os conflitos antes de prosseguir."));
      process.exit(1);
    } else {
      console.log(chalk.yellow("⚠️ Continuando com conflitos."));
    }
  } else {
    console.log(chalk.green("✔ Nenhum conflito detectado."));
  }
}

/**
 * Função auxiliar para ler a mensagem de commit do arquivo temporário.
 * @param {string} tempFile - Caminho para o arquivo temporário.
 * @returns {string} - Mensagem de commit atualizada.
 */
function readCommitMessage(tempFile) {
  try {
    return fs.readFileSync(tempFile, { encoding: "utf-8" }).trim();
  } catch (error) {
    console.error(
      chalk.red("❌ Erro ao ler a mensagem de commit:"),
      error.message
    );
    return "";
  }
}

/**
 * Fluxo principal para criar um commit.
 */
export async function createCommit() {
  try {
    // 1. Confirmar ou trocar de branch
    await confirmOrSwitchBranch();

    // 2. Limpar o stage
    clearStage();

    // 3. Verificar conflitos
    await verifyConflicts();

    // 4. Adicionar todas as mudanças ao stage
    stageAllChanges();

    // 5. Obter a lista de diffs dos arquivos staged
    const stagedFiles = getStagedFilesDiffs();

    console.log("stagedFiles", stagedFiles);

    if (stagedFiles.length === 0) {
      console.log(chalk.yellow("⚠️ Nenhuma alteração staged para commit."));
      process.exit(0);
    }

    // 6. Perguntar como proceder com a mensagem de commit
    let commitMessage = "";
    let finalMessageGenerated = false;

    while (!finalMessageGenerated) {
      const { messageOption } = await inquirer.prompt([
        {
          type: "list",
          name: "messageOption",
          message: "Como você gostaria de proceder com a mensagem de commit?",
          choices: [
            { name: "Gerar com IA e editar", value: "ai" },
            { name: "Escrever a minha própria", value: "manual" },
            { name: "Cancelar", value: "cancel" },
          ],
        },
      ]);

      if (messageOption === "cancel") {
        console.log(chalk.yellow("⚠️ Processo de commit cancelado."));
        process.exit(0);
      }

      if (messageOption === "ai") {
        // Gerar mensagem de commit usando IA
        console.log(chalk.blue("📤 Gerando mensagem de commit com IA..."));
        commitMessage = await analyzeUpdatedCode(
          stagedFiles,
          PromptType.CREATE
        ); // Passa os diffs
      }

      if (messageOption === "manual") {
        const { manualMessage } = await inquirer.prompt([
          {
            type: "input",
            name: "manualMessage",
            message: "Digite sua mensagem de commit:",
            validate: (input) =>
              input.trim() === ""
                ? "A mensagem de commit não pode estar vazia."
                : true,
          },
        ]);
        commitMessage = manualMessage;
      }

      // Caminho para o arquivo temporário
      const tempFile = path.join(os.tmpdir(), "commit_message.txt");

      // Escrever a mensagem inicial no arquivo temporário
      fs.writeFileSync(tempFile, commitMessage, { encoding: "utf-8" });

      // Abrir editor para finalizar a mensagem de commit
      commitChangesWithEditor(tempFile);

      // Ler a mensagem de commit atualizada após a edição
      const updatedCommitMessage = readCommitMessage(tempFile);

      // Remover o arquivo temporário após a leitura
      fs.unlinkSync(tempFile);

      // Verificar se a mensagem de commit não está vazia
      if (!updatedCommitMessage) {
        console.log(chalk.red("❌ A mensagem de commit está vazia."));
      } else {
        commitMessage = updatedCommitMessage;
        finalMessageGenerated = true; // Sair do loop se a mensagem não estiver vazia
      }
    }

    // 7. Realizar o commit com a mensagem final
    // Note que a mensagem já foi passada para o editor, então essa chamada pode ser removida
    // Caso contrário, certifique-se de que a função não está duplicando o commit
    // commitChangesWithEditor(commitMessage); // Removido para evitar duplicação

    // 8. Prompt para push
    const { push } = await inquirer.prompt([
      {
        type: "confirm",
        name: "push",
        message: "Deseja fazer push para o repositório remoto?",
        default: true,
      },
    ]);

    if (push) {
      pushChanges();
    } else {
      console.log(chalk.yellow("⚠️ Push não realizado."));
    }
  } catch (error) {
    console.error(
      chalk.red("❌ Erro durante o processo de criação do commit:"),
      error.message
    );
  }
}
