// helpers.js

import chalk from "chalk";
import i18n from "./i18n.js"; // Importa o i18n

/**
 * Displays the help message to the user.
 */
export function showHelp() {
  const usage = `${chalk.bold(i18n.__("helpers.showHelp.usage"))}
  ${chalk.cyan(i18n.__("helpers.showHelp.commandExample"))}`;

  const description = `${chalk.bold(i18n.__("helpers.showHelp.description"))}
  ${i18n.__("helpers.showHelp.descriptionText")}`;

  const requiredVariables = `${chalk.bold(
    i18n.__("helpers.showHelp.requiredVariables")
  )}
  - ${chalk.yellow(i18n.__("helpers.showHelp.variables.OPENAI_API_KEY"))}
  - ${chalk.yellow(i18n.__("helpers.showHelp.variables.OPENAI_API_MODEL"))}
  - ${chalk.yellow(
    i18n.__("helpers.showHelp.variables.OPENAI_RESPONSE_LANGUAGE")
  )}`;

  const commands = `${chalk.bold(i18n.__("helpers.showHelp.commands"))}
  - ${chalk.cyan(i18n.__("helpers.showHelp.commandList.analyze"))}
  - ${chalk.cyan(i18n.__("helpers.showHelp.commandList.create"))}
  - ${chalk.cyan(i18n.__("helpers.showHelp.commandList.setConfig"))}
  - ${chalk.cyan(i18n.__("helpers.showHelp.commandList.help"))}`;

  const examples = `${chalk.bold(i18n.__("helpers.showHelp.examples"))}
  - ${i18n.__("helpers.showHelp.exampleList.analyzeSpecific")}
  - ${i18n.__("helpers.showHelp.exampleList.configureApiKey")}
  - ${i18n.__("helpers.showHelp.exampleList.configureModel")}
  - ${i18n.__("helpers.showHelp.exampleList.configureLanguage")}
  - ${i18n.__("helpers.showHelp.exampleList.analyzeLatest")}
  - ${i18n.__("helpers.showHelp.exampleList.createCommit")}`;

  const tips = `${chalk.bold(i18n.__("helpers.showHelp.tips"))}
  - ${chalk.cyan(i18n.__("helpers.showHelp.tipsList.setConfig"))}
  - ${chalk.cyan(i18n.__("helpers.showHelp.tipsList.secureApiKey"))}
  - ${chalk.cyan(i18n.__("helpers.showHelp.tipsList.analyzeRecent"))}
  - ${chalk.cyan(i18n.__("helpers.showHelp.tipsList.documentation"))}`;

  return `
${usage}

${description}

${requiredVariables}

${commands}

${examples}

${tips}
  `;
}
