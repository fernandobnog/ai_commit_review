// openaiUtils.js

import chalk from "chalk";
import { SupportedLanguages } from "./models.js"; // Import SupportedLanguages
import { validateConfiguration } from "./helpers.js";
import { OpenAI } from "openai";

/**
 * Helper function to get the language name from the code.
 * @param {string} langcode - The language code (e.g., "en-US").
 * @returns {string} - The readable name of the language (e.g., "English (US)").
 * @throws {Error} - If the language code is not found.
 */
function getLanguageName(langcode) {
  const languageEntry = Object.values(SupportedLanguages).find(
    (lang) => lang.code === langcode
  );
  if (!languageEntry) {
    throw new Error(
      `The language code is not supported. Please check the "OPENAI_RESPONSE_LANGUAGE" setting.`
    );
  }
  return languageEntry.name;
}

/**
 * Helper function to generate the prompt for OpenAI
 * @param {Array} files - Array of file objects containing filename and diff content.
 * @param {object} config - Configuration object containing API key, model, and language.
 * @returns {string} - The generated prompt.
 * @throws {Error} - If the language code is not supported.
 */
function generatePrompt(files, config) {
  const languageName = getLanguageName(config.OPENAI_RESPONSE_LANGUAGE); // May throw an error here
  const languageInstruction = `Please respond in ${languageName}.`;

  return files
    .map(
      (file) => `Analyze the following changes in the file ${file.filename}:
  \`\`\`diff
  ${file.content}
  \`\`\`

  ${languageInstruction}

  Please respond:
  1. Briefly describe what was changed.
  2. Do the changes follow best practices? Justify.
  3. Are there any issues with readability, efficiency, or style in the changes? Suggest improvements.
  4. Additional recommendations to improve the code.`
    )
    .join("\n\n");
}

/**
 * Function to analyze the code using the OpenAI API
 * @param {Array} files - Array of file objects containing filename and diff content.
 * @returns {string} - The result of the OpenAI analysis.
 * @throws {Error} - If there is a failure in the analysis or language mapping.
 */
export async function analyzeUpdatedCode(files) {
  const config = validateConfiguration();

  const openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });
  let prompt;
  try {
    prompt = generatePrompt(files, config); // Passes the entire config
  } catch (error) {
    console.error(chalk.red(`❌ Error generating prompt: ${error.message}`));
    throw error; // Propagates the error to prevent prompt execution
  }

  console.log(chalk.blue("📤 Sending analysis request to OpenAI..."));
  try {
    const response = await openai.chat.completions.create({
      model: config.OPENAI_API_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
    });

    console.log(chalk.green("✅ Response received from OpenAI."));
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error(
      chalk.red(
        "❌ Error analyzing the code:",
        error.response?.data || error.message
      )
    );
    throw error;
  }
}
