import chalk from "chalk";
import { validateConfiguration, updateValidApiKey } from "./configManager.js";
import { OpenAI } from "openai";
import { OpenAIModels, PromptType, SupportedLanguages, ModelContextLimits } from "./models.js";

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
                * Can the code be refactored to increase clarity, readability, or maintainability? (e.g., simplify complex logic, extract methods/functions, apply design principles like DRY - Don't Repeat Yourself).
                * Are there opportunities to optimize performance? (e.g., more efficient algorithms, reduction of costly operations, database query optimization).
                * Can the testability of the code be improved? How?
                * For each suggestion, provide a clear justification and, if possible, a small example of how it could be implemented.

            4.  **Best Practices and Code Quality Recommendations:**
                * Evaluate adherence to clean code principles: meaningful names for variables and functions, short functions with single responsibility, low coupling and high cohesion.
                * Does the code follow the language or project style conventions (if known)?
                * Are comments adequate? Do they explain the "why" and intentions, not just "what" the code does?
                * Were modularity and code reuse well applied or are there opportunities for such?

            **General Considerations about the Commit (if applicable):**
            * Are there any observations about the commit message (clarity, completeness)?
            * Do the changes seem cohesive and aligned with a single objective, or do they mix different concerns?
            * Are there broader implications for the system architecture or other modules?

            Your analysis should be:
            * **Complete and Specific:** Provide sufficient details and base your observations directly on code snippets from the diff. Avoid generic statements.
            * **Accurate and Justified:** Ensure that your observations about errors or improvements are technically correct and well-founded.
            * **Constructive:** The goal is to assist in improving code quality.
            * **Objective:** Maintain a neutral and professional tone, focused on technical aspects.

            ${languageInstruction}`;
  }
  if (promptType === PromptType.CREATE) {
    return `Your task is to generate a commit title and commit message (body) that are accurate, informative, and follow version control best practices. The response should respect the predominant language in the content of the files provided in the diffs.

            **Context:**
            You are analyzing the following code changes (diffs). Your goal is to summarize these changes clearly so that other developers (and your future self) can easily understand the purpose and impact of each commit.
            
            **Diffs:**
            ${diffs}

            **Internal Analysis Process (Steps you should follow before formulating the response):**
            1.  **General Understanding:** Analyze the set of diffs to identify the central theme or main objective of the modifications. Ask yourself: "What main problem do these changes solve?" or "What key functionality is being implemented, fixed, or altered?".
            2.  **Identification of "What":** For each significant change in the diffs, determine exactly *what* was modified (e.g., which functions, classes, variables, control flow logic, configuration files, etc.).
            3.  **Cautious Inference of "Why" (Motivation):**
                * Try to deduce *why* each significant change was made. Base this deduction strictly on evidence present in the diffs (e.g., code that simplifies complex logic, fixes inconsistent behavior, adds handling for a new use case visible in the code, removes obsolete/commented code).
                * **Important:** If the "why" is not clearly evident from the code changes, DO NOT INVENT a motivation. In this case, focus on describing the "what" and the observable impact of the change. A factual description of what was done is preferable to incorrect speculation about the reason.
            4.  **Impact Assessment:** Consider how the changes affect the behavior, performance, security, or maintainability of the project.

            **Output Instructions (Title and Commit Message):**

            -   **Commit Title:**
                -   ${languageInstruction} 
                -   Start with a relevant emoji that represents the nature of the change (suggestions: 🚀 for new features, ✨ for improvements, 🐛 for bug fixes, 🔧 for refactoring/tools, 📝 for documentation, ♻️ for refactoring, 🔒 for security, 📈 for performance).
                -   Use an imperative verb at the beginning of the sentence (e.g., "Add", "Fix", "Refactor", "Remove", "Update", "Improve").
                -   Be specific, concise, and direct about the main change.
                -   Maximum of 50 characters.

            -   **Commit Message (Body):**
                -   ${languageInstruction}
                -   **Detailed Description of Changes (What Was Done):**
                    * Describe the main changes made clearly.
                    * Use lists (bullet points) or short paragraphs to organize the explanation.
                    * Mention the most important parts of the code that were affected (e.g., "Modified function X to handle Y", "Removed class Z as it was obsolete"), but avoid pasting large chunks of the diffs.
                -   **Motivation and Context (Why the Change):**
                    * Explain the reason behind the changes. What problem was solved? What objective was achieved?
                    * If you based your inference of "why" on heuristics (and not on explicit comments in the diff), be objective in describing the scenario that the change seems to address.
                    * If the exact reason is not clear, describe the benefit or expected result of the change (e.g., "This change improves the readability of module X", "With this, processing of Y becomes more efficient").
                -   **Project Impact (How It Affects):**
                    * If applicable and inferable, briefly explain how the changes impact the project (e.g., "This fixes the bug reported in #123", "Allows users to now do Z", "Reduces loading time for page X").

            -   **Important Restrictions:**
                -   **Fidelity to Diffs:** Base ALL your response strictly on information contained in the diffs.
                -   **Don't Invent:** Do not add information, functionalities, reasons, or contexts that cannot be reasonably and directly inferred from the provided code changes.
                -   **Conciseness:** Avoid copying and pasting extensive portions of the diffs. The goal is to summarize and explain.
                -   **Privacy:** Do not include any personal or sensitive information.

            **Response Format (Exactly as in the example):**
            Title
            Message (body)`;
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
  if(config.OPENAI_API_BASEURL){
    openai = new OpenAI({baseURL:config.OPENAI_API_BASEURL, apiKey: config.OPENAI_API_KEY });
  }else{
    openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });
  }
  const prompt = generatePrompt(files, promptType, config);
  try {
    console.log(chalk.blue("📤 Sending request to AI..."));

    const isGpt5Nano = config.OPENAI_API_MODEL == OpenAIModels.GPT_5_NANO;
    const requestPayload = {
      model: config.OPENAI_API_MODEL,
      messages: [{ role: "user", content: prompt }],
      ...(isGpt5Nano && {
        reasoning_effort: "low",
        verbosity: "low",
      }),
    };

    const response = await openai.chat.completions.create(requestPayload);
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

/**
 * Get the context token limit for the configured model.
 * @returns {Promise<number>} The token limit for the model
 */
export async function getModelContextLimit() {
  const config = await validateConfiguration();
  const model = config.OPENAI_API_MODEL;
  return ModelContextLimits[model] || ModelContextLimits["default"];
}

/**
 * Summarize arbitrary text using the configured OpenAI model.
 * This helper is intended for internal use by contextManager to reduce token usage.
 */
export async function summarizeText(text) {
  const config = await validateConfiguration();
  let openai = null;
  if (config.OPENAI_API_BASEURL) {
    openai = new OpenAI({ baseURL: config.OPENAI_API_BASEURL, apiKey: config.OPENAI_API_KEY });
  } else {
    openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });
  }

  try {
    const languageInstruction = generateLanguageInstruction(config.OPENAI_RESPONSE_LANGUAGE);
    const prompt = `${languageInstruction}\nResuma de forma concisa e técnica o conteúdo a seguir. Seja direto e foque nas mudanças e impacto:\n\n${text}`;

    const requestPayload = {
      model: config.OPENAI_API_MODEL,
      messages: [{ role: "user", content: prompt }],
    };

    const response = await openai.chat.completions.create(requestPayload);
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error(chalk.red("❌ Error while summarizing text:"), error.message);
    // bubble up so caller can fallback
    throw error;
  }
}
