// prompts.js
import { PromptType, SupportedLanguages } from "./models.js";

/**
 * Generates language instruction for OpenAI prompts.
 */
export function generateLanguageInstruction(langcode) {
  const languageMap = Object.values(SupportedLanguages).reduce((map, lang) => {
    map[lang.code] = lang.name;
    return map;
  }, {});
  const language = languageMap[langcode] || "English (US)";
  return `Please respond entirely in ${language}.`;
}

/**
 * Generates prompt for code review or commit creation.
 */
export function generatePrompt(files, promptType, config) {
  const diffs = files
    .map((file) => `\n **${file.filename}:**\n \`\`\`\n ${file.diff}\n \`\`\``)
    .join("\n");

  const languageInstruction = generateLanguageInstruction(config.OPENAI_RESPONSE_LANGUAGE);

  if (promptType === PromptType.ANALYZE) {
    return buildAnalyzePrompt(diffs, languageInstruction);
  }
  if (promptType === PromptType.CREATE) {
    return buildCreatePrompt(diffs, languageInstruction);
  }

  throw new Error(`Invalid prompt type: ${promptType}`);
}

function buildAnalyzePrompt(diffs, languageInstruction) {
  return `Assume the role of a senior code reviewer.

Analyze in detail the following code changes (commits) provided:

${diffs}

For each modified file, organize your analysis as follows:

**File: [File Name]**

1.  **Detailed Summary of Modifications:**
    * What was the main objective and expected impact of the changes in this file?
    * Describe the main functionalities or logic that were added, removed, or significantly altered.

2.  **Identification of Errors, Potential Bugs, and Vulnerabilities:**
    * Are there logic errors, exception handling failures, race conditions, memory leaks, or other bugs?
    * Were security vulnerabilities introduced or neglected (e.g., SQL Injection, XSS, insecure input handling)?
    * For each identified item:
        * Quote the relevant code snippet (or approximate line).
        * Explain in detail the nature of the problem.
        * Describe the potential impact (e.g., incorrect behavior, system failure, security breach).

3.  **Improvement and Optimization Suggestions (with justifications):**
    * Can the code be refactored to increase clarity, readability, or maintainability?
    * Are there opportunities to optimize performance?
    * Can the testability of the code be improved? How?

4.  **Best Practices and Code Quality Recommendations:**
    * Evaluate adherence to clean code principles.
    * Does the code follow style conventions?
    * Are comments adequate?

${languageInstruction}`;
}

function buildCreatePrompt(diffs, languageInstruction) {
  return `Your task is to generate a commit title and commit message (body).

**Diffs:**
${diffs}

**Output Instructions:**
- **Commit Title:**
  - ${languageInstruction}
  - Start with a relevant emoji (🚀, ✨, 🐛, 🔧, 📝, ♻️, 🔒, 📈).
  - Use an imperative verb.
  - Maximum of 50 characters.

- **Commit Message (Body):**
  - ${languageInstruction}
  - Detailed Description of Changes (What Was Done)
  - Motivation and Context (Why the Change)
  - Project Impact (How It Affects)

**Response Format (Exactly as in the example):**
Title
Message (body)`;
}
