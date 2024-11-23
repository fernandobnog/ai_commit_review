// helpers.js

import chalk from "chalk";

/**
 * Displays the help message to the user.
 */
export function showHelp() {
  const usage = `${chalk.bold("Uso:")}
  ${chalk.cyan("acr [comandos]")}`;

  const description = `${chalk.bold("Descrição:")}
  Uma ferramenta para analisar e criar commits e código com auxílio de IA diretamente do repositório Git local.`;

  const requiredVariables = `${chalk.bold("Variáveis Obrigatórias:")}
  - ${chalk.yellow("OPENAI_API_KEY")}: Sua chave de API da OpenAI.
  - ${chalk.yellow(
    "OPENAI_API_MODEL"
  )}: O modelo de IA usado para análise (ex.: gpt-4, gpt-4-turbo).
  - ${chalk.yellow(
    "OPENAI_RESPONSE_LANGUAGE"
  )}: O idioma para as respostas da IA (ex.: pt-BR, en-US).`;

  const commands = `${chalk.bold("Comandos:")}
  ${chalk.cyan(
    "acr analyze"
  )}                  Lista e analisa os últimos commits.
  ${chalk.cyan(
    "acr create"
  )}                   Cria um novo commit com assistência de IA.
  ${chalk.cyan(
    "acr set_config <chave=valor>"
  )} Atualiza as configurações (ex.: OPENAI_API_KEY, OPENAI_API_MODEL, OPENAI_RESPONSE_LANGUAGE).
  ${chalk.cyan("acr help")}                     Exibe esta ajuda detalhada.`;

  const examples = `${chalk.bold("Exemplos:")}
  - Analisar um commit específico:
    ${chalk.cyan("acr 123456")}

  - Configurar a chave da API da OpenAI:
    ${chalk.cyan("acr set_config OPENAI_API_KEY=sk-sua-chave")}

  - Configurar o modelo de IA:
    ${chalk.cyan("acr set_config OPENAI_API_MODEL=gpt-4")}

  - Configurar o idioma das respostas:
    ${chalk.cyan("acr set_config OPENAI_RESPONSE_LANGUAGE=pt-BR")}

  - Analisar os últimos commits:
    ${chalk.cyan("acr analyze")}

  - Criar um commit com assistência de IA:
    ${chalk.cyan("acr create")}`;

  const tips = `${chalk.bold("Dicas:")}
  - Use ${chalk.cyan(
    "acr set_config"
  )} para configurar suas preferências antes de usar a ferramenta.
  - Certifique-se de que sua chave de API (${chalk.yellow(
    "OPENAI_API_KEY"
  )}) seja mantida segura.
  - Analise apenas os commits mais recentes para melhorar a precisão e economizar recursos da API.
  - Consulte a documentação ou abra uma issue no GitHub se encontrar problemas.`;

  return `
${usage}

${description}

${requiredVariables}

${commands}

${examples}

${tips}
  `;
}

