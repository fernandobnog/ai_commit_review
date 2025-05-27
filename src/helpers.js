// helpers.js

import chalk from "chalk";

/**
 * Displays the help message to the user.
 */
export function showHelp() {
  const usage = `${chalk.bold("Usage:")}
  ${chalk.cyan("acr [commands]")}`;

  const description = `${chalk.bold("Description:")}
  A tool to analyze and create commits and code with AI assistance directly from the local Git repository.`;

  const requiredVariables = `${chalk.bold("Required Variables:")}
  - ${chalk.yellow("OPENAI_API_KEY")}: Your OpenAI API key.
  - ${chalk.yellow(
    "OPENAI_API_MODEL"
  )}: The AI model used for analysis (e.g., gpt-4, gpt-4-turbo).
  - ${chalk.yellow(
    "OPENAI_RESPONSE_LANGUAGE"
  )}: The language for AI responses (e.g., en-US, pt-BR).`;

  const commands = `${chalk.bold("Commands:")}
  ${chalk.cyan(
    "acr analyze"
  )}                  Lists and analyzes the latest commits.
  ${chalk.cyan(
    "acr create"
  )}                   Creates a new commit with AI assistance.
  ${chalk.cyan(
    "acr set_config <key=value>"
  )} Updates the configurations (e.g., OPENAI_API_KEY, OPENAI_API_MODEL, OPENAI_RESPONSE_LANGUAGE).
  ${chalk.cyan("acr help")}                     Displays this detailed help message.`;

  const examples = `${chalk.bold("Examples:")}
  - Analyze a specific commit:
    ${chalk.cyan("acr 123456")}

  - Set the OpenAI API key:
    ${chalk.cyan("acr set_config OPENAI_API_KEY=sk-your-key")}

  - Set the AI model:
    ${chalk.cyan("acr set_config OPENAI_API_MODEL=gpt-4")}

  - Set the response language:
    ${chalk.cyan("acr set_config OPENAI_RESPONSE_LANGUAGE=en-US")}

  - Analyze the latest commits:
    ${chalk.cyan("acr analyze")}

  - Create a commit with AI assistance:
    ${chalk.cyan("acr create")}`;

  const tips = `${chalk.bold("Tips:")}
  - Use ${chalk.cyan(
    "acr set_config"
  )} to configure your preferences before using the tool.
  - Ensure your API key (${chalk.yellow(
    "OPENAI_API_KEY"
  )}) is kept secure.
  - Analyze only the most recent commits to improve accuracy and save API resources.
  - Refer to the documentation or open an issue on GitHub if you encounter problems.`;

  return `
${usage}

${description}

${requiredVariables}

${commands}

${examples}

${tips}
  `;
}
