import fs from "fs";
import path from "path";
import crypto from "crypto";
import chalk from "chalk";
import { summarizeText, getModelContextLimit } from "./openaiUtils.js";

const CACHE_DIR = path.join(process.cwd(), ".cache");
const CACHE_FILE = path.join(CACHE_DIR, "context.json");

function ensureCache() {
  try {
    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR);
    if (!fs.existsSync(CACHE_FILE)) fs.writeFileSync(CACHE_FILE, JSON.stringify({}), "utf8");
  } catch (err) {
    console.warn(chalk.yellow("⚠️ Unable to create cache directory:"), err.message);
  }
}

function readCache() {
  try {
    ensureCache();
    const raw = fs.readFileSync(CACHE_FILE, "utf8");
    return JSON.parse(raw || "{}");
  } catch (err) {
    return {};
  }
}

function writeCache(cache) {
  try {
    ensureCache();
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), "utf8");
  } catch (err) {
    console.warn(chalk.yellow("⚠️ Unable to write cache file:"), err.message);
  }
}

function hashContent(text) {
  return crypto.createHash("md5").update(text || "").digest("hex");
}

function chunkText(text, maxChars) {
  if (!text) return [];
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + maxChars));
    i += maxChars;
  }
  return chunks;
}

/**
 * Build a condensed context for the provided files. It will chunk large diffs,
 * summarize each chunk (using the OpenAI helper), then if needed summarize the
 * combined summaries into one. Caches results by md5(diff).
 *
 * @param {Array<{filename:string,diff:string,status:string}>} files
 * @param {string} promptType - passed for possible future use (not required now)
 * @param {object} [options]
 * @returns {Promise<Array<{filename:string,diff:string,status:string}>>}
 */
export async function buildContextForFiles(files, promptType, options = {}) {
  const cache = readCache();
  
  // Get the model's context limit and calculate safe chunk size
  const modelTokenLimit = await getModelContextLimit();
  const CHARS_PER_TOKEN = 4; // Conservative estimate (1 token ≈ 4 chars)
  const INPUT_MARGIN = 0.25; // Use only 25% of context for input (rest for system prompt + output)
  
  const maxTokensForInput = Math.floor(modelTokenLimit * INPUT_MARGIN);
  const maxChars = options.maxChars || parseInt(process.env.OPENAI_CHUNK_SIZE_CHARS) || (maxTokensForInput * CHARS_PER_TOKEN);
  const maxCombinedChars = options.maxCombinedChars || maxChars;
  
  console.log(chalk.blue(`ℹ️  Model: ${modelTokenLimit} tokens | Chunk size: ~${Math.floor(maxChars/1000)}k chars (${maxTokensForInput} tokens max per chunk)`));

  const result = [];
  for (const file of files) {
    try {
      const key = `${file.filename}:${hashContent(file.diff)}`;
      if (cache[key]) {
        result.push({ ...file, diff: `/* SUMMARY (cached): ${cache[key].summary} */\n` });
        continue;
      }

      if ((file.diff || "").length <= maxChars) {
        // small enough, keep original
        result.push(file);
        continue;
      }

      // split into chunks and summarize each
      const chunks = chunkText(file.diff, maxChars);
      console.log(chalk.yellow(`  📦 Splitting ${file.filename} into ${chunks.length} chunks for summarization...`));
      
      const chunkSummaries = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkTokens = Math.ceil(chunk.length / CHARS_PER_TOKEN);
        console.log(chalk.gray(`    → Chunk ${i+1}/${chunks.length}: ${chunk.length} chars (~${chunkTokens} tokens)`));
        
        const prompt = `Resuma de forma concisa e técnica o seguinte trecho de diff (responda no mesmo idioma do conteúdo):\n\n${chunk}`;
        const summary = await summarizeText(prompt);
        chunkSummaries.push(summary);
      }

      let combined = chunkSummaries.join("\n\n");

      // If combined is still large, summarize again
      if (combined.length > maxCombinedChars) {
        const prompt = `Resuma de forma sucinta e técnica o seguinte conjunto de resumos de diff em um único parágrafo que capture as mudanças mais importantes:\n\n${combined}`;
        const finalSummary = await summarizeText(prompt);
        combined = finalSummary;
      }

      cache[key] = { summary: combined, timestamp: Date.now() };
      writeCache(cache);

      result.push({ ...file, diff: `/* SUMMARY:\n${combined}\n*/\n` });
    } catch (err) {
      console.warn(chalk.yellow(`⚠️ failed to build context for ${file.filename}: ${err.message}`));
      // fallback to original diff
      result.push(file);
    }
  }

  return result;
}

export function clearContextCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) fs.unlinkSync(CACHE_FILE);
    console.log(chalk.green("✅ Context cache cleared."));
  } catch (err) {
    console.warn(chalk.yellow("⚠️ Unable to clear cache:"), err.message);
  }
}

export default { buildContextForFiles, clearContextCache };
