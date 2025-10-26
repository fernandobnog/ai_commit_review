import chalk from "chalk";
import { program } from "commander";
import inquirer from "inquirer";
import { showHelp } from "./src/helpers.js";
import { updateConfigFromString, ensureValidApiKey, resetConfig } from "./src/configManager.js";
import { analyzeCommits } from "./src/analyzeCommit.js"; // Analyze commits
import { createCommit } from "./src/createCommit.js"; // Create commits
import { commitStaged } from "./src/commitStaged.js"; // Commit staged changes
import { criptografarcli } from "./src/crypto.js"; // Encrypt/decrypt functionality
import { updateServerToTest } from "./src/testServerUpdate.js"; // Script to Update Server to Test
import { updateServerToProduction } from "./src/productionServerUpdate.js"; // Script to Update Server to production
import { execSync } from "child_process";

try {
  console.log(chalk.blue("Checking if 'ai-commit-review' lib is up to date..."));
  let outdatedData;
  try {
    outdatedData = execSync("npm outdated -g ai-commit-review --json", {
      encoding: "utf8",
      stdio: ['pipe', 'pipe', 'pipe']
    });
  } catch (error) {
    outdatedData = error.stdout || "";
  }

  if (outdatedData.trim()) {
    try {
      const outdated = JSON.parse(outdatedData);
      if (Object.keys(outdated).length > 0) {
        console.log(chalk.yellow("'ai-commit-review' lib is outdated. Updating..."));

        await resetConfig();

        execSync("npm update -g ai-commit-review", { stdio: "inherit" });
        console.log(chalk.green("'ai-commit-review' lib updated successfully."));
        process.exit(0);
      } else {
        console.log(chalk.green("'ai-commit-review' lib is already up to date."));
      }
    } catch (parseError) {
      console.log(chalk.green("'ai-commit-review' lib is already up to date."));
    }
  } else {
    console.log(chalk.green("'ai-commit-review' lib is already up to date."));
  }
} catch (error) {
  console.error(chalk.red("Error checking 'ai-commit-review' lib updates:"), error.message);
}

process.noDeprecation = true;

// Ensure a valid API key unless updating config or using the crypto command
if (!process.argv.includes("set_config") || !process.argv.includes("crypto")) {
  await ensureValidApiKey();
}

// Custom help information
program.helpInformation = showHelp;

program
  .name("acr")
  .description("A tool to analyze commits and create new ones with AI assistance");

// Command for encrypting and decrypting text
program
  .command("crypto")
  .description("Encrypt and decrypt text")
  .action(async () => {
    await criptografarcli();
  });

// Command to analyze commits
program
  .command("analyze")
  .description("Analyze individual or grouped commits from the local Git repository")
  .action(async () => {
    await analyzeCommits();
  });

// Command to create a new commit
program
  .command("create")
  .description("Create a new commit with AI assistance")
  .action(async () => {
    await createCommit();
  });

// Command to commit staged changes
program
  .command("commit")
  .description("Commit staged changes with AI assistance")
  .action(async () => {
    await commitStaged();
  });

// Command to update server to test
program
  .command("updateTestServer")
  .description("Update server to test")
  .action(async () => {
    await updateServerToTest();
  });

// Command to update server to production
program
  .command("updateProductionServer")
  .description("Update server to production")
  .action(async () => {
    await updateServerToProduction();
  });

  // Command to reset configuration
program
  .command("resetConfig")
  .description("Reset configuration to defaults")
  .action(async () => {
    await resetConfig();
  });

// Command to update configurations
program
  .command("set_config <keyValue>")
  .description("Update configurations with KEY=VALUE (e.g., OPENAI_API_KEY=<value>)")
  .action((keyValue) => {
    try {
      updateConfigFromString(keyValue);
    } catch (error) {
      console.error(chalk.red("❌ Error updating configuration:", error.message));
    }
  });

// Prompt the user if no command is provided
if (!process.argv.slice(2).length) {
  console.log(chalk.yellow("⚠️ No command provided."));
  (async () => {
    const { command } = await inquirer.prompt([
      {
        type: "list",
        name: "command",
        message: "What do you want to do?",
        choices: [
          { name: "Analyze commits", value: "analyze" },
          { name: "Create a new commit", value: "create" },
          { name: "Commit staged changes", value: "commit" },
          { name: "Encrypt/Decrypt text", value: "crypto" },
          { name: "Update server to test", value: "updateTestServer" },
          { name: "Update server to production", value: "updateProductionServer" },
          { name: "Reset configuration", value: "resetConfig" }
        ],
      },
    ]);

    if (command === "analyze") {
      await analyzeCommits();
    } else if (command === "create") {
      await createCommit();
    } else if (command === "commit") {
      await commitStaged();
    } else if (command === "crypto") {
      await criptografarcli();
    } else if (command === "updateTestServer") {
      await updateServerToTest();
    } else if (command === "updateProductionServer") {
      await updateServerToProduction();
    } else if (command === "resetConfig") {
      await resetConfig();
    }
  })();
} else {
  program.parse(process.argv);
}
