import fs from "fs";
import path from "path";
import crypto from "crypto";
import chalk from "chalk";
import { summarizeText } from "./openaiUtils.js";

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
  const maxChars = options.maxChars || parseInt(process.env.OPENAI_CHUNK_SIZE_CHARS) || 8000; // default chunk size (chars)
  const maxCombinedChars = options.maxCombinedChars || maxChars;

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
      const chunkSummaries = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
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
