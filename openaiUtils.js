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
      `Please analyze the changes in this commit. Provide an overview of the modifications made to the files. Check for any apparent errors or bugs in the changes and point out potential improvements or optimizations that could be implemented. Additionally, suggest best practices that could be applied to improve code quality.
        ${file.filename}:\n${file.content}\n\n${languageInstruction}`,

    [PromptType.CREATE]: (file) =>
      `Analyze the content of the file ${file.filename} below and create a title and a commit message that follow best practices for version control, respecting the language of the file's content:

        ${file.content}

        Instructions:

        - For the Commit Title:
          - Starts with an emoji (e.g., "🚀", "🔧", "📝").
          - Use a maximum of 50 characters.
          - Start with an imperative verb (e.g., "Add", "Fix", "Remove").
          - Be specific and direct about the change made.
        - For the Commit Message:
          - Describe in detail the changes made.
          - Explain the reason for the change and how it impacts the project.
          - Use lists or short paragraphs to organize the explanation.
        - Restrictions:
          - Strictly base your response on the information provided in the file content.
          - Do not invent information not present in the file content.
          - Avoid copying and pasting large portions of the file content.
          - Do not include personal or sensitive information in the commit.

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
