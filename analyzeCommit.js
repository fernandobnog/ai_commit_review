import chalk from "chalk";
import inquirer from "inquirer";
import { getCommits, getModifiedFiles, getFileDiff } from "./gitUtils.js";
import { analyzeUpdatedCode } from "./openaiUtils.js";

/**
 * Handles the user's selection of commits, including dynamic loading.
 * @returns {Array<string>} - List of selected commit SHAs.
 */
const selectCommits = async () => {
  let skip = 0;
  const limit = 5;
  let allCommits = [];
  let selectedShas = [];
  let reachedEnd = false;

  while (true) {
    if (!reachedEnd && allCommits.length === 0) {
      const newCommits = getCommits(skip, limit);
      if (!newCommits.length) {
        console.log(
          chalk.yellow(
            "⚠️ Nenhum commit adicional para carregar. Todos os commits disponíveis estão exibidos."
          )
        );
        reachedEnd = true;
      } else {
        allCommits = [...allCommits, ...newCommits];
        skip += limit;
      }
    }

    const choices = allCommits.map((commit) => ({
      name: `${commit.shaShort} - ${commit.date} - ${commit.message}`,
      value: commit.shaFull,
    }));

    // Adiciona um separador para separar commits das opções adicionais
    choices.push(new inquirer.Separator());

    if (!reachedEnd) {
      choices.push({ name: "⬇️  Carregar mais commits", value: "load_more" });
    }

    // Adiciona a opção "Exit"
    choices.push({ name: "🚪 Sair", value: "exit" });

    const answers = await inquirer.prompt([
      {
        type: "checkbox",
        name: "selectedShas",
        message:
          "Selecione os commits para analisar (Pressione Enter para finalizar):",
        choices,
        pageSize: 100,
        loop: false,
        // Removida a validação para permitir selecionar "Exit" juntamente com outros commits
      },
    ]);

    const loadMore = answers.selectedShas.includes("load_more");
    const exitSelected = answers.selectedShas.includes("exit");
    const commitsSelected = answers.selectedShas.filter(
      (sha) => sha !== "load_more" && sha !== "exit"
    );

    if (exitSelected) {
      console.log(chalk.blue("👋 Processo encerrado pelo usuário."));
      process.exit(0); // Encerra o processo imediatamente
    }

    selectedShas = selectedShas.concat(commitsSelected);

    if (loadMore) {
      const newCommits = getCommits(skip, limit);
      if (!newCommits.length) {
        console.log(
          chalk.yellow(
            "⚠️ Nenhum commit adicional para carregar. Todos os commits disponíveis estão exibidos."
          )
        );
        reachedEnd = true;
      } else {
        allCommits = [...allCommits, ...newCommits];
        skip += limit;
      }
    } else {
      // Se 'load_more' não foi selecionado, assumimos que o usuário terminou a seleção
      break;
    }
  }

  return selectedShas;
};

/**
 * Main function for commit analysis.
 */
export const analyzeCommits = async () => {
  try {
    const selectedShas = await selectCommits();

    if (!selectedShas.length) {
      console.log(
        chalk.yellow("⚠️ Você não selecionou nenhum commit para análise.")
      );
      return;
    }

    for (const sha of selectedShas) {
      await analyzeCommit(sha);
    }
  } catch (error) {
    console.error(chalk.red("❌ Erro durante a execução:"), error.message);
  }
};

/**
 * Analyzes a specific commit.
 * @param {string} sha - The commit SHA to analyze.
 */
const analyzeCommit = async (sha) => {
  try {
    console.log(chalk.blueBright(`\n📂 Analisando commit ${sha}...`));
    const modifiedFiles = getModifiedFiles(sha);

    if (!modifiedFiles.length) {
      console.log(
        chalk.yellow("⚠️ Nenhum arquivo modificado encontrado no commit.")
      );
      return;
    }

    const files = await processModifiedFiles(sha, modifiedFiles);
    if (!files.length) {
      console.log(
        chalk.yellow("⚠️ Nenhuma diferença válida encontrada para análise.")
      );
      return;
    }

    const analysis = await analyzeUpdatedCode(files);
    console.log(
      chalk.magentaBright(
        `\n📊 Resultado da análise de código para o commit ${sha}:\n`
      ),
      chalk.magenta(analysis)
    );

    console.log(chalk.green("\nArquivos analisados:"));
    files.forEach((file) => console.log(chalk.green(`- ${file.filename}`)));
  } catch (error) {
    console.error(chalk.red("❌ Erro ao analisar o commit:"), error.message);
  }
};

/**
 * Processes modified files to extract differences.
 * @param {string} sha - The commit SHA.
 * @param {Array<{status: string, file: string}>} modifiedFiles - List of modified files.
 * @returns {Array<{filename: string, content: string, status: string}>} - List of files with diffs.
 */
const processModifiedFiles = async (sha, modifiedFiles) => {
  const files = await Promise.all(
    modifiedFiles.map(async ({ status, file }) => {
      try {
        const diff = getFileDiff(sha, file);
        if (!diff) {
          console.warn(
            chalk.yellow(
              `⚠️ Nenhuma diferença encontrada para o arquivo ${file}.`
            )
          );
          return null;
        }
        return { filename: file, content: diff, status };
      } catch (error) {
        console.error(
          chalk.red(`❌ Erro ao processar diferenças para o arquivo ${file}:`),
          error.message
        );
        return null;
      }
    })
  );
  return files.filter(Boolean);
};
