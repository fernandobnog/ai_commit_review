// openaiUtils.js

import chalk from "chalk";

// Helper function to generate the prompt for OpenAI
function generatePrompt(files) {
  return files
    .map(
      (file) => `Analyze the following changes in the file ${file.filename}:
\`\`\`diff
${file.content}
\`\`\`

Please respond:
1. Briefly describe what was changed.
2. Do the changes follow best practices? Justify.
3. Are there any issues with readability, efficiency, or style in the changes? Suggest improvements.
4. Additional recommendations to improve the code.`
    )
    .join("\n\n");
}

// Function to analyze the code
export async function analyzeUpdatedCode(files, openaiInstance, config) {
  const prompt = generatePrompt(files);

  console.log(chalk.blue("📤 Sending analysis request to OpenAI..."));
  try {
    const response = await openaiInstance.chat.completions.create({
      model: config.OPENAI_API_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
    });

    console.log(chalk.green("✅ Response received from OpenAI."));
    return response.choices[0].message.content.trim();
  } catch (error) {
    throw new Error("OpenAI: " + error.message);
  }
}
