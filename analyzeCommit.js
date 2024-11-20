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
  let limit = 5;
  let allCommits = [];
  let selectedShas = [];
  let continueFetching = true;
  let reachedEnd = false;

  while (continueFetching) {
    if (!reachedEnd && allCommits.length === 0) {
      const newCommits = getCommits(skip, limit);
      if (!newCommits.length) {
        console.log(
          chalk.yellow(
            "⚠️ No more commits to load. All available commits are displayed."
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

    choices.push(new inquirer.Separator());
    if (!reachedEnd) {
      choices.push({ name: "⬇️  Load more commits", value: "load_more" });
    }
    choices.push({ name: "🚪 Exit", value: "finish_selection" });

    const answers = await inquirer.prompt([
      {
        type: "checkbox",
        name: "selectedShas",
        message: "Select commits to analyze: ",
        choices,
        pageSize: 100,
        loop: false,
      },
    ]);

    const loadMore = answers.selectedShas.includes("load_more");
    const finishSelection = answers.selectedShas.includes("finish_selection");

    selectedShas = selectedShas.concat(
      answers.selectedShas.filter(
        (sha) => sha !== "load_more" && sha !== "finish_selection"
      )
    );

    if (finishSelection) {
      break;
    }

    if (loadMore) {
      const newCommits = getCommits(skip, limit);
      if (!newCommits.length) {
        console.log(
          chalk.yellow(
            "⚠️ No more commits to load. All available commits are displayed."
          )
        );
        reachedEnd = true;
      } else {
        allCommits = [...allCommits, ...newCommits];
        skip += limit;
      }
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
        chalk.yellow(
          "⚠️   You exited without selecting any commits for analysis."
        )
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

    const analysis = await analyzeUpdatedCode(files);
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
