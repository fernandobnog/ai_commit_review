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
      `Crie um título e uma mensagem de commit seguindo as melhores práticas para as alterações no arquivo ${file.filename}:

        ${file.content}

        Instruções:\n\n

        Título do Commit:\n
        Deve ser conciso (até 50 caracteres).\n
        Comece com um verbo no imperativo (por exemplo, "Adicionar", "Corrigir", "Atualizar").\n
        Seja descritivo sobre a alteração realizada.\n\n

        Mensagem do Commit:\n
        Separe o título da mensagem com uma linha em branco.\n
        Forneça uma descrição detalhada das alterações.\n
        Explique o porquê das mudanças, não apenas o o quê.\n
        Utilize parágrafos ou listas para organizar melhor a informação.\n\n

        Formato Esperado:\n
        [Título conciso e descritivo]\n
        [Descrição detalhada das alterações, explicando o motivo das mudanças e qualquer informação adicional relevante.]\n\n

        ${languageInstruction}`,
  };

  if (!promptMap[promptType]) {
    throw new Error(`Invalid prompt type: ${promptType}`);
  }

  return files.map(promptMap[promptType]).join("\n\n");
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
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error(chalk.red("❌ Error analyzing updated code:", error.message));
    throw error;
  }
}
