import chalk from "chalk";
import { program } from "commander";
import inquirer from "inquirer";
import { showHelp } from "./helpers.js";
import { updateConfigFromString, ensureValidApiKey } from "./configManager.js";
import { analyzeCommits } from "./analyzeCommit.js"; // Analyze commits
import { createCommit } from "./createCommit.js"; // Create commits
import { criptografarcli } from "./crypto.js"; // Encrypt/decrypt functionality
import { updateServerToTest } from "./testServerUpdate.js"; // Script to Update Server to Test
import { updateServerToProduction } from "./productionServerUpdate.js"; // Script to Update Server to production
import { execSync } from "child_process";

try {
  console.log(chalk.blue("Verificando se a lib 'ai-commit-review' está atualizada..."));
  const outdatedData = execSync("npm outdated ai-commit-review --json", { encoding: "utf8" });
  const outdated = outdatedData ? JSON.parse(outdatedData) : {};
  if (Object.keys(outdated).length > 0) {
    console.log(chalk.yellow("Lib 'ai-commit-review' desatualizada. Atualizando..."));
    execSync("npm update ai-commit-review", { stdio: "inherit" });
    console.log(chalk.green("Lib 'ai-commit-review' atualizada com sucesso."));
  } else {
    console.log(chalk.green("Lib 'ai-commit-review' já está atualizada."));
  }
} catch (error) {
  if (error.stdout) {
    try {
      const outdated = JSON.parse(error.stdout || "{}");
      if (Object.keys(outdated).length > 0) {
        console.log(chalk.yellow("Lib 'ai-commit-review' desatualizada. Atualizando..."));
        execSync("npm update ai-commit-review", { stdio: "inherit" });
        console.log(chalk.green("Lib 'ai-commit-review' atualizada com sucesso."));
      } else {
        console.log(chalk.green("Lib 'ai-commit-review' já está atualizada."));
      }
    } catch {
      console.error(chalk.red("Erro ao verificar atualizações da lib 'ai-commit-review'."));
    }
  } else {
    console.error(chalk.red("Erro ao verificar atualizações da lib 'ai-commit-review'."));
  }
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
          { name: "Encrypt/Decrypt text", value: "crypto" },
          { name: "Update server to test", value: "updateTestServer" },
          { name: "Update server to production", value: "updateProductionServer" }
        ],
      },
    ]);

    if (command === "analyze") {
      await analyzeCommits();
    } else if (command === "create") {
      await createCommit();
    } else if (command === "crypto") {
      await criptografarcli();
    } else if (command === "updateTestServer") {
      await updateServerToTest();
    } else if (command === "updateProductionServer") {
      await updateServerToProduction();
    }
  })();
} else {
  program.parse(process.argv);
}
