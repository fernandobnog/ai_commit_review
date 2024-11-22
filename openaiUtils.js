import chalk from "chalk";
import { validateConfiguration } from "./configManager.js";
import { OpenAI } from "openai";
import { PromptType, SupportedLanguages } from "./models.js";

/**
 * Generates the language instruction for OpenAI prompts.
 */
function generateLanguageInstruction(langcode) {
  const languageMap = Object.values(SupportedLanguages).reduce((map, lang) => {
    map[lang.code] = lang.name;
    return map;
  }, {});
  const language = languageMap[langcode];
  return `Please respond in ${language}.`;
}

/**
 * Generates the prompt for analyzing code changes.
 */
function generatePrompt(files, promptType, config) {
  const languageInstruction = generateLanguageInstruction(
    config.OPENAI_RESPONSE_LANGUAGE
  );

  const promptMap = {
    [PromptType.ANALYZE]: (file) =>
      `Por favor, analise as alterações neste commit. Forneça uma visão geral das modificações realizadas nos arquivos. Verifique se há algum erro ou bug aparente nas mudanças e aponte possíveis melhorias ou otimizações que podem ser implementadas. Além disso, sugira boas práticas que poderiam ser aplicadas para aumentar a qualidade do código.
        ${file.filename}:\n${file.content}\n\n${languageInstruction}`,
    [PromptType.CREATE]: (file) =>
      `Analise o conteúdo do arquivo ${file.filename} abaixo e crie um título e uma mensagem de commit que sigam as melhores práticas para controle de versões:

        ${file.content}

        Instruções:

        Para o Título do Commit:

        Não insira as palavras "Título do Commit:" no texto.
        Use no máximo 50 caracteres.
        Comece com um verbo no imperativo (ex.: "Adicionar", "Corrigir", "Remover").
        Seja específico e direto sobre a alteração realizada.
        Para a Mensagem do Commit:

        Não insira as palavras "Mensagem do Commit:" no texto.
        Separe o título e a mensagem com uma linha em branco.
        Descreva de forma detalhada as alterações realizadas.
        Explique o motivo da alteração e como ela impacta o projeto.
        Use listas ou parágrafos curtos para organizar a explicação.
        Restrições:

        Não inclua Título do Commit: ou Mensagem do Commit: no texto da resposta.
        Baseie-se estritamente nas informações fornecidas no conteúdo do arquivo.
        Não invente informações que não estejam no conteúdo do arquivo.
        Evite copiar e colar trechos extensos do arquivo.
        Não insira informações pessoais ou sensíveis no commit.
        Formato da Resposta:

        [Título do Commit]
        [Descrição detalhada das alterações, incluindo o porquê da mudança e qualquer informação relevante.]

        ${languageInstruction}`,
  };

  if (!promptMap[promptType]) {
    throw new Error(`Invalid prompt type: ${promptType}`);
  }

  const prompt = files.map(promptMap[promptType]).join("\n\n");

  console.log(chalk.blue("📝 Generated prompt for OpenAI:"));
  return prompt;
}

/**
 * Analyzes updated code using OpenAI.
 */
export async function analyzeUpdatedCode(
  files,
  promptType = PromptType.ANALYZE
) {
  const config = validateConfiguration();

  const openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });
  const prompt = generatePrompt(files, promptType, config);

  try {
    console.log(chalk.blue("📤 Sending request to OpenAI..."));
    const response = await openai.chat.completions.create({
      model: config.OPENAI_API_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
    });
    console.log(chalk.green("✅ Response received."));

    const completion = response.choices[0].message.content.trim();
    console.log(chalk.blue(completion));
    return completion;
  } catch (error) {
    console.error(chalk.red("❌ Error analyzing updated code:", error.message));
    throw error;
  }
}
