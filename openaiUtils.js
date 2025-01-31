import chalk from "chalk";
import { validateConfiguration, updateValidApiKey } from "./configManager.js";
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
  return `Please respond entirely in ${language}.`;
}

/**
 * Generates the prompt for analyzing code changes.
 */
function generatePrompt(files, promptType, config) {
  const diffs = files
    .map(
      (file) => `
          **${file.filename}:**
          \`\`\`
          ${file.diff}
          \`\`\``
    )
    .join("\n");

  const languageInstruction = generateLanguageInstruction(
    config.OPENAI_RESPONSE_LANGUAGE
  );

  if (promptType === PromptType.ANALYZE) {
    return `Please analyze the changes in this commit and provide a concise summary of the modifications made to the following files. 
            Identify any potential errors or bugs, suggest improvements or optimizations, and recommend best practices to enhance code quality.
            Ensure your response is brief and objective.\n

            ${diffs}\n

            ${languageInstruction}`;
  }

  if (promptType === PromptType.CREATE) {
    return `Analyze the diffs of the following files and create a commit title and message 
            that follow best practices for version control, 
            respecting the language of the files' content:\n

            ${diffs}\n

            Instructions:\n

            - **For the Commit Title:**\n
              - ${languageInstruction}\n
              - Starts with an emoji (e.g., "🚀", "🔧", "📝").\n
              - Use a maximum of 50 characters.\n\
              - Start with an imperative verb.\n
              - Be specific and direct about the change made.\n
              
            - **For the Commit Message:**\n
              - ${languageInstruction}\n
              - Describe in detail the changes made.\n
              - Explain the reason for the change and how it impacts the project.\n
              - Use lists or short paragraphs to organize the explanation.\n
              
            - **Restrictions:**\n
              - Strictly base your response on the information provided in the diffs.\n
              - Do not invent information not present in the diffs.\n
              - Avoid copying and pasting large portions of the diffs.\n
              - Do not include personal or sensitive information in the commit.\n

            Please respond with the title followed by the description, each on a separate line, exactly like this:\n

            Title\n
            Description\n

            Example:\n

            🚀 Add user authentication\n
            Implemented user login and registration functionality using JWT tokens.`;
  }

  throw new Error(`Invalid prompt type: ${promptType}`);
}

/**
 * Analyzes updated code using OpenAI.
 */
export async function analyzeUpdatedCode(
  files,
  promptType = PromptType.ANALYZE
) {
  const config = await validateConfiguration();
  let openai = null;
  //TODO logica para acesso local ou remoto
  if(config.OPENAI_API_BASEURL){
    openai = new OpenAI({baseURL:config.OPENAI_API_BASEURL, apiKey: config.OPENAI_API_KEY });
  }else{
    openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });
  }
  const prompt = generatePrompt(files, promptType, config);
  try {
    console.log(chalk.blue("📤 Sending request to AI..."));
    const response = await openai.chat.completions.create({
      model: config.OPENAI_API_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
    });
    console.log(chalk.green("✅ Response received."));

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error(chalk.red("❌ Error analyzing updated code:", error.message));
    if(error.message.includes("401")) {
      await updateValidApiKey()
      return analyzeUpdatedCode(files, promptType);
    } else{
      throw error;
    }
  }
}
