import chalk from "chalk";
import { validateConfiguration } from "./configManager.js";
import { OpenAI } from "openai";

/**
 * Generates the language instruction for OpenAI prompts.
 */
function generateLanguageInstruction(langcode) {
  const languageMap = {
    "en-US": "English",
    "pt-BR": "Portuguese",
  };
  const language = languageMap[langcode] || "English";
  return `Please respond in ${language}.`;
}

/**
 * Generates the prompt for analyzing code changes.
 */
function generatePrompt(files, config) {
  const languageInstruction = generateLanguageInstruction(config.OPENAI_RESPONSE_LANGUAGE);

  return files
    .map((file) => `Analyze changes in file ${file.filename}:\n${file.content}\n\n${languageInstruction}`)
    .join("\n\n");
}

/**
 * Analyzes updated code using OpenAI.
 */
export async function analyzeUpdatedCode(files) {
  const config = validateConfiguration();

  const openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });
  const prompt = generatePrompt(files, config);

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
