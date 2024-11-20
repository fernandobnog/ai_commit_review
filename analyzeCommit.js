import chalk from "chalk";
import inquirer from "inquirer";
import { execSync } from "child_process";
import { validateConfiguration } from "./configManager.js";
import { getModifiedFiles, getFileDiff } from "./gitUtils.js";
import { analyzeUpdatedCode } from "./openaiUtils.js";

/**
 * Function to truncate strings based on a maximum length.
 * @param {string} str - The string to be truncated.
 * @param {number} maxLength - The maximum allowed length.
 * @returns {string} - The truncated string.
 */
function truncateString(str, maxLength) {
  if (str.length <= maxLength) {
    return str;
  }
  return str.slice(0, maxLength - 3) + "...";
}

/**
 * Retrieves commits in batches.
 * @param {number} skip - Number of commits to skip.
 * @param {number} limit - Number of commits to retrieve.
 * @returns {Array} - List of commits with full and abbreviated SHA, and formatted date/time.
 */
function getCommits(skip = 0, limit = 15) {
  // Changed to 15
  try {
    const stdout = execSync(
      `git log --skip=${skip} -n ${limit} --pretty=format:"%H\x1f%ct\x1f%s"`,
      { encoding: "utf-8" }
    );
    const commits = stdout
      .split("\n")
      .filter((line) => line)
      .map((line) => {
        const [shaFull, timestamp, message] = line.split("\x1f");
        const shaShort = shaFull.slice(0, 7); // Abbreviation for display
        const date = new Date(parseInt(timestamp) * 1000);
        const formattedDate = date
          .toLocaleString("en-US", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
          .replace(",", "");

        // Remove line breaks and truncate the message
        const singleLineMessage = message.replace(/\n/g, " ");
        const truncatedMessage = truncateString(singleLineMessage, 100); // Adjust length as needed

        return {
          shaFull,
          shaShort,
          date: formattedDate,
          message: truncatedMessage,
        };
      });

    console.log(`\n🔍 Commits retrieved: ${commits.length}`);
    commits.forEach((commit, index) => {
      console.log(
        `${index + 1}. ${commit.shaShort} - ${commit.date} - ${commit.message}`
      );
    });

    return commits;
  } catch (error) {
    console.error(chalk.red("❌ Error fetching commits:"), error.message);
    process.exit(1);
  }
}

/**
 * Main function to select commits and analyze them.
 */
export async function analyzeCommits() {
  try {
    validateConfiguration();

    let skip = 0;
    const limit = 15; // Changed to 15
    let selectedShas = [];
    let continueFetching = true;

    while (continueFetching) {
      const commits = getCommits(skip, limit);

      if (commits.length === 0) {
        console.log(chalk.yellow("⚠️ No more commits available."));
        break;
      }

      const choices = commits.map((commit) => ({
        name: `${commit.shaShort} - ${commit.date} - ${commit.message}`,
        value: commit.shaFull, // Use full SHA internally
      }));

      // Add options to load more commits or finish selection
      choices.push(new inquirer.Separator());
      choices.push({ name: "⬇️  Load more commits", value: "load_more" });
      choices.push({
        name: "✅  Finish selection",
        value: "finish_selection",
      });

      const answers = await inquirer.prompt([
        {
          type: "checkbox",
          name: "selectedShas",
          message: "Select commits to analyze:",
          choices,
          pageSize: 50, // Increased to accommodate more commits
        },
      ]);

      if (answers.selectedShas.includes("load_more")) {
        // Add selected commits (excluding control options) to the list
        selectedShas = selectedShas.concat(
          answers.selectedShas.filter(
            (sha) => sha !== "load_more" && sha !== "finish_selection"
          )
        );
        skip += limit;
        continue;
      } else if (answers.selectedShas.includes("finish_selection")) {
        selectedShas = selectedShas.concat(
          answers.selectedShas.filter(
            (sha) => sha !== "load_more" && sha !== "finish_selection"
          )
        );
        break;
      } else {
        // If no control option is selected, add the selected SHAs and finish
        selectedShas = selectedShas.concat(answers.selectedShas);
        continueFetching = false;
      }
    }

    if (selectedShas.length === 0) {
      console.log(chalk.yellow("⚠️ No commits selected for analysis."));
      return;
    }

    for (const sha of selectedShas) {
      await analyzeCommit(sha);
    }
  } catch (error) {
    console.error(chalk.red("❌ Error:"), error.message);
  }
}

/**
 * Analyzes a specific commit.
 * @param {string} sha - The full SHA of the commit to analyze.
 */
async function analyzeCommit(sha) {
  try {
    console.log(
      chalk.blueBright(
        `\n📂 Fetching modified files for commit ${chalk.bold(sha)}...`
      )
    );
    const modifiedFiles = await getModifiedFiles(sha);

    if (modifiedFiles.length === 0) {
      console.log(chalk.yellow("⚠️ No modified files found in the commit."));
      return;
    }

    console.log(chalk.blueBright("📄 Reading file differences..."));

    const files = await processModifiedFiles(sha, modifiedFiles);

    if (files.length === 0) {
      console.log(chalk.yellow("⚠️ No valid differences found for analysis."));
      return;
    }

    const analysis = await analyzeUpdatedCode(files);

    console.log(
      chalk.magentaBright(
        `\nCode Analysis Result for commit ${chalk.bold(sha)}:\n`
      )
    );
    console.log(chalk.magenta(analysis));

    console.log(chalk.green("\nAnalyzed Files:"));
    files.forEach((file) => {
      console.log(chalk.green(`- ${file.filename}`));
    });
  } catch (error) {
    console.error(chalk.red("❌ Error:"), error.message);
  }
}

/**
 * Processes modified files to extract differences.
 * @param {string} sha - The commit SHA.
 * @param {Array} modifiedFiles - List of modified files.
 * @returns {Array} - List of files with diffs.
 */
async function processModifiedFiles(sha, modifiedFiles) {
  const files = await Promise.all(
    modifiedFiles.map(async ({ status, file }) => {
      let diff = "";
      try {
        diff = await getFileDiff(sha, file);
        if (!diff) {
          console.warn(
            chalk.yellow(
              `⚠️ No differences found for file ${chalk.italic(file)}.`
            )
          );
          return null;
        }
        return { filename: file, content: diff, status };
      } catch (error) {
        console.error(
          chalk.red(
            `❌ Error reading differences for file ${chalk.bold(file)}:`,
            error.message
          )
        );
        return null;
      }
    })
  );

  return files.filter((file) => file !== null);
}
