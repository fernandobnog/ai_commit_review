import chalk from "chalk";
import inquirer from "inquirer";
import { execSync } from "child_process";
import { validateConfiguration } from "./configManager.js";
import { getModifiedFiles, getFileDiff } from "./gitUtils.js";
import { analyzeUpdatedCode } from "./openaiUtils.js";

// Truncate strings to a maximum length.
const truncateString = (str, maxLength) =>
  str.length <= maxLength ? str : `${str.slice(0, maxLength - 3)}...`;

// Fetch commits from git in batches.
const fetchCommits = (skip = 0, limit = 5) => {
  try {
    const stdout = execSync(
      `git log --skip=${skip} -n ${limit} --pretty=format:"%H\x1f%ct\x1f%s"`,
      { encoding: "utf-8" }
    );
    return stdout
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [shaFull, timestamp, message] = line.split("\x1f");
        return {
          shaFull,
          shaShort: shaFull.slice(0, 7),
          date: formatDate(timestamp),
          message: truncateString(message.replace(/\n/g, " "), 100),
        };
      });
  } catch (error) {
    console.error(chalk.red("❌ Error fetching commits:"), error.message);
    process.exit(1);
  }
};

// Format a timestamp into a readable date string.
const formatDate = (timestamp) =>
  new Date(parseInt(timestamp, 10) * 1000)
    .toLocaleString("en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(",", "");

// Allow user to select commits for analysis, with dynamic load.
const selectCommits = async () => {
  let skip = 0;
  let limit = 5;
  let allCommits = [];
  let selectedShas = [];
  let continueFetching = true;
  let reachedEnd = false;

  while (continueFetching) {
    if (!reachedEnd) {
      // Fetch additional commits only if not already at the end
      const newCommits = fetchCommits(skip, limit);
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

    // Add options to load more commits or finish selection
    choices.push(new inquirer.Separator());
    if (!reachedEnd) {
      choices.push({ name: "⬇️  Load more commits", value: "load_more" });
    }
    choices.push({ name: "✅  Finish selection", value: "finish_selection" });

    const answers = await inquirer.prompt([
      {
        type: "checkbox",
        name: "selectedShas",
        message: "Select commits to analyze:",
        choices,
        pageSize: 50,
      },
    ]);

    const loadMore = answers.selectedShas.includes("load_more");
    const finishSelection = answers.selectedShas.includes("finish_selection");

    // Filter selected SHAs excluding control options
    selectedShas = selectedShas.concat(
      answers.selectedShas.filter(
        (sha) => sha !== "load_more" && sha !== "finish_selection"
      )
    );

    if (finishSelection) {
      break;
    }

    if (!loadMore) {
      continueFetching = false;
    }
  }

  return selectedShas;
};


// Analyze a specific commit.
const analyzeCommit = async (sha) => {
  try {
    console.log(chalk.blueBright(`\n📂 Analyzing commit ${sha}...`));
    const modifiedFiles = await getModifiedFiles(sha);

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

// Processes modified files to extract differences.
const processModifiedFiles = async (sha, modifiedFiles) => {
  const files = await Promise.all(
    modifiedFiles.map(async ({ status, file }) => {
      try {
        const diff = await getFileDiff(sha, file);
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

// Main function to analyze selected commits.
export const analyzeCommits = async () => {
  try {
    validateConfiguration();

    const selectedShas = await selectCommits();

    if (!selectedShas.length) {
      console.log(chalk.yellow("⚠️ No commits selected for analysis."));
      return;
    }

    for (const sha of selectedShas) {
      await analyzeCommit(sha);
    }
  } catch (error) {
    console.error(chalk.red("❌ Error during execution:"), error.message);
  }
};
