import chalk from "chalk";
import inquirer from "inquirer";
import { getCommits, getModifiedFiles, getFileDiff } from "./gitUtils.js";
import { analyzeUpdatedCode } from "./openaiUtils.js";
import { buildContextForFiles } from "./contextManager.js";
import { PromptType } from "./models.js";

export function getDeps(deps = {}) {
  return {
    getCommitsFn: deps.getCommitsFn || getCommits,
    getModifiedFilesFn: deps.getModifiedFilesFn || getModifiedFiles,
    getFileDiffFn: deps.getFileDiffFn || getFileDiff,
    analyzeUpdatedCodeFn: deps.analyzeUpdatedCodeFn || analyzeUpdatedCode,
    buildContextForFilesFn: deps.buildContextForFilesFn || buildContextForFiles,
    promptFn: deps.promptFn || inquirer.prompt,
  };
}

export function buildChoicesList(allCommits, reachedEnd) {
  const choices = allCommits.map((commit) => ({
    name: `${commit.shaShort} - ${commit.date} - ${commit.message}`,
    value: commit.shaFull,
  }));

  choices.push(new inquirer.Separator());
  if (!reachedEnd) {
    choices.push({ name: "⬇️  Load more commits", value: "load_more" });
  }
  choices.push({ name: "🚪 Exit", value: "exit" });
  return choices;
}

export function loadMoreCommits(skip, limit, allCommits, getCommitsFn) {
  const newCommits = getCommitsFn(skip, limit);
  if (!newCommits || !newCommits.length) {
    console.log(chalk.yellow("⚠️ No additional commits to load. All available commits are displayed."));
    return { allCommits, skip, reachedEnd: true };
  }
  return {
    allCommits: [...allCommits, ...newCommits],
    skip: skip + limit,
    reachedEnd: false,
  };
}

export async function selectCommits(deps = {}) {
  const d = getDeps(deps);
  let skip = 0;
  const limit = 5;
  let allCommits = [];
  let selectedShas = [];
  let reachedEnd = false;

  while (true) {
    if (!reachedEnd && allCommits.length === 0) {
      const res = loadMoreCommits(skip, limit, allCommits, d.getCommitsFn);
      allCommits = res.allCommits;
      skip = res.skip;
      reachedEnd = res.reachedEnd;
    }

    const choices = buildChoicesList(allCommits, reachedEnd);
    const answers = await d.promptFn([
      {
        type: "checkbox",
        name: "selectedShas",
        message: "Select commits to analyze (Press Enter to finalize):",
        choices,
        pageSize: 100,
        loop: false,
      },
    ]);

    const userShas = answers.selectedShas || [];
    const loadMore = userShas.includes("load_more");
    const exitSelected = userShas.includes("exit");
    const commitsSelected = userShas.filter((sha) => sha !== "load_more" && sha !== "exit");

    if (exitSelected) {
      console.log(chalk.blue("👋 Process terminated by the user."));
      throw new Error("Process terminated by user.");
    }

    selectedShas = selectedShas.concat(commitsSelected);

    if (loadMore) {
      const res = loadMoreCommits(skip, limit, allCommits, d.getCommitsFn);
      allCommits = res.allCommits;
      skip = res.skip;
      reachedEnd = res.reachedEnd;
    } else {
      break;
    }
  }

  return selectedShas;
}

export async function processModifiedFiles(sha, modifiedFiles, deps = {}) {
  const d = getDeps(deps);
  const files = await Promise.all(
    modifiedFiles.map(async ({ status, file }) => {
      try {
        const diff = d.getFileDiffFn(sha, file);
        if (!diff) {
          console.warn(chalk.yellow(`⚠️ No differences found for file ${file}.`));
          return null;
        }
        return { filename: file, diff, status };
      } catch (error) {
        console.error(chalk.red(`❌ Error processing differences for file ${file}:`), error.message);
        return null;
      }
    })
  );
  return files.filter(Boolean);
}

export async function analyzeCommit(sha, deps = {}) {
  const d = getDeps(deps);
  try {
    console.log(chalk.blueBright(`\n📂 Analyzing commit ${sha}...`));
    const modifiedFiles = d.getModifiedFilesFn(sha);

    if (!modifiedFiles || !modifiedFiles.length) {
      console.log(chalk.yellow("⚠️ No modified files found in the commit."));
      return;
    }

    const files = await processModifiedFiles(sha, modifiedFiles, deps);
    if (!files.length) {
      console.log(chalk.yellow("⚠️ No valid differences found for analysis."));
      return;
    }

    const condensedFiles = await d.buildContextForFilesFn(files, PromptType.ANALYZE);
    const analysis = await d.analyzeUpdatedCodeFn(condensedFiles, PromptType.ANALYZE);

    console.log(chalk.magentaBright(`\n📊 Code analysis result for commit ${sha}:\n`), chalk.magenta(analysis));
    console.log(chalk.green("\nAnalyzed files:"));
    files.forEach((file) => console.log(chalk.green(`- ${file.filename}`)));
  } catch (error) {
    console.error(chalk.red("❌ Error analyzing commit:"), error.message);
  }
}

export async function analyzeCommits(deps = {}) {
  try {
    const selectedShas = await selectCommits(deps);
    if (!selectedShas || !selectedShas.length) {
      console.log(chalk.yellow("⚠️ You did not select any commits for analysis."));
      return;
    }
    for (const sha of selectedShas) {
      await analyzeCommit(sha, deps);
    }
  } catch (error) {
    console.error(chalk.red("❌ Error during execution:"), error.message);
  }
}
