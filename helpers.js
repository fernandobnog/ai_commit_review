// helpers.js

import chalk from "chalk";

/**
 * Displays the help message to the user.
 */
export function showHelp() {
  return `
${chalk.bold("Usage:")}
  ${chalk.cyan("gcr <COMMIT_SHA> [commands]")}

${chalk.bold("Description:")}
  A tool to analyze commits and code with AI from the local Git repository.

${chalk.bold("Required Variables:")}
  - ${chalk.yellow("OPENAI_API_KEY")}: Your OpenAI API key.
  - ${chalk.yellow(
    "OPENAI_API_MODEL"
  )}: The AI model used for analysis (e.g., gpt-4, gpt-4-turbo).
  - ${chalk.yellow(
    "OPENAI_RESPONSE_LANGUAGE"
  )}: The language for AI responses (e.g., English (US), Spanish).

${chalk.bold("Commands:")}
  ${chalk.cyan("gcr <COMMIT_SHA>")}        Analyzes a specific commit.
  ${chalk.cyan(
    "gcr set_config"
  )}          Updates configurations (e.g., OPENAI_API_KEY, OPENAI_API_MODEL, OPENAI_RESPONSE_LANGUAGE).

${chalk.bold("Examples:")}
  ${chalk.cyan("gcr 123456")}              Analyzes the commit with SHA 123456.
  ${chalk.cyan("gcr set_config OPENAI_API_KEY=your-key")}
  ${chalk.cyan("gcr set_config OPENAI_API_MODEL=gpt-4")}
  ${chalk.cyan("gcr set_config OPENAI_RESPONSE_LANGUAGE=Spanish")}
  `;
}
