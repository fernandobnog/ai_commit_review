import chalk from "chalk";
import inquirer from "inquirer";
import { getCommits, getModifiedFiles, getFileDiff } from "./gitUtils.js";
import { analyzeUpdatedCode } from "./openaiUtils.js";
import { PromptType } from "./models.js";

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
            "⚠️ No additional commits to load. All available commits are displayed."
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

    // Add a separator to distinguish commits from additional options
    choices.push(new inquirer.Separator());

    if (!reachedEnd) {
      choices.push({ name: "⬇️  Load more commits", value: "load_more" });
    }

    // Add the "Exit" option
    choices.push({ name: "🚪 Exit", value: "exit" });

    const answers = await inquirer.prompt([
      {
        type: "checkbox",
        name: "selectedShas",
        message: "Select commits to analyze (Press Enter to finalize):",
        choices,
        pageSize: 100,
        loop: false,
        // Removed validation to allow selecting "Exit" along with other commits
      },
    ]);

    const loadMore = answers.selectedShas.includes("load_more");
    const exitSelected = answers.selectedShas.includes("exit");
    const commitsSelected = answers.selectedShas.filter(
      (sha) => sha !== "load_more" && sha !== "exit"
    );

    if (exitSelected) {
      console.log(chalk.blue("👋 Process terminated by the user."));
      process.exit(0); // Immediately terminates the process
    }

    selectedShas = selectedShas.concat(commitsSelected);

    if (loadMore) {
      const newCommits = getCommits(skip, limit);
      if (!newCommits.length) {
        console.log(
          chalk.yellow(
            "⚠️ No additional commits to load. All available commits are displayed."
          )
        );
        reachedEnd = true;
      } else {
        allCommits = [...allCommits, ...newCommits];
        skip += limit;
      }
    } else {
      // If 'load_more' was not selected, assume the user has finished selection
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
        chalk.yellow("⚠️ You did not select any commits for analysis.")
      );
      return;
    }

    for (const sha of selectedShas) {
      await analyzeCommit(sha);
    }
  } catch (error) {
    console.error(chalk.red("❌ Error during execution:"), error.message);
  }
};

/**
 * Analyzes a specific commit.
 * @param {string} sha - The commit SHA to analyze.
 */
const analyzeCommit = async (sha) => {
  try {
    console.log(chalk.blueBright(`\n📂 Analyzing commit ${sha}...`));
    const modifiedFiles = getModifiedFiles(sha);

    if (!modifiedFiles.length) {
      console.log(chalk.yellow("⚠️ No modified files found in the commit."));
      return;
    }

    const files = await processModifiedFiles(sha, modifiedFiles);
    if (!files.length) {
      console.log(chalk.yellow("⚠️ No valid differences found for analysis."));
      return;
    }

    const analysis = await analyzeUpdatedCode(files, PromptType.ANALYZE);
    console.log(
      chalk.magentaBright(`\n📊 Code analysis result for commit ${sha}:\n`),
      chalk.magenta(analysis)
    );

    console.log(chalk.green("\nAnalyzed files:"));
    files.forEach((file) => console.log(chalk.green(`- ${file.filename}`)));
  } catch (error) {
    console.error(chalk.red("❌ Error analyzing commit:"), error.message);
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
            chalk.yellow(`⚠️ No differences found for file ${file}.`)
          );
          return null;
        }
        return { filename: file, content: diff, status };
      } catch (error) {
        console.error(
          chalk.red(`❌ Error processing differences for file ${file}:`),
          error.message
        );
        return null;
      }
    })
  );
  return files.filter(Boolean);
};
