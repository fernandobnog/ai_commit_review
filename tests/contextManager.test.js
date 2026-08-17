import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import http from "node:http";
import {
  buildContextForFiles,
  clearContextCache,
  hashContent,
  chunkText,
  ensureCache,
  readCache,
  writeCache
} from "../src/contextManager.js";
import { saveConfig, deleteConfigFile } from "../src/config.js";

const CACHE_DIR = path.join(process.cwd(), ".cache");
const CACHE_FILE = path.join(CACHE_DIR, "context.json");

function cleanCacheFile() {
  if (fs.existsSync(CACHE_FILE)) {
    try {
      fs.unlinkSync(CACHE_FILE);
    } catch (err) {}
  }
}

test("contextManager.js - Cobertura 100% de Gerenciamento de Contexto e Ramificações (Padrão AAA)", async (t) => {
  let mockServer;

  t.before(async () => {
    await new Promise((resolve) => {
      mockServer = http.createServer((req, res) => {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ choices: [{ message: { content: "Resumo mock" } }] }));
      });
      mockServer.listen(9998, "127.0.0.1", resolve);
    });
  });

  t.after(async () => {
    if (mockServer) {
      if (typeof mockServer.closeAllConnections === "function") {
        mockServer.closeAllConnections();
      }
      await new Promise((resolve) => mockServer.close(resolve));
    }
  });

  t.beforeEach(() => {
    cleanCacheFile();
    saveConfig({
      OPENAI_API_KEY: "sk-test-key",
      OPENAI_API_MODEL: "gpt-5-nano",
      OPENAI_RESPONSE_LANGUAGE: "pt-BR",
      OPENAI_API_BASEURL: "http://127.0.0.1:9998/v1"
    });
  });

  t.afterEach(() => {
    cleanCacheFile();
    deleteConfigFile();
  });

  await t.test("hashContent deve gerar hash MD5 consistente para string e fallback para null/empty", () => {
    // Arrange & Act
    const hash1 = hashContent("conteudo_teste");
    const hash2 = hashContent("conteudo_teste");
    const hashEmpty = hashContent(null);
    const hashUndefined = hashContent(undefined);

    // Assert
    assert.equal(hash1, hash2);
    assert.equal(typeof hash1, "string");
    assert.equal(typeof hashEmpty, "string");
    assert.equal(typeof hashUndefined, "string");
  });

  await t.test("chunkText deve tratar falsy, strings vazias e truncamentos", () => {
    // Arrange & Act
    const emptyChunks = chunkText("", 10);
    const nullChunks = chunkText(null, 10);
    const undefinedChunks = chunkText(undefined, 10);
    const textChunks = chunkText("1234567890ABCDEFGHIJ", 5);

    // Assert
    assert.deepEqual(emptyChunks, []);
    assert.deepEqual(nullChunks, []);
    assert.deepEqual(undefinedChunks, []);
    assert.equal(textChunks.length, 4);
    assert.equal(textChunks[0], "12345");
    assert.equal(textChunks[3], "FGHIJ");
  });

  await t.test("buildContextForFiles deve cobrir todas as ramificações de options e diffs nulos/curtos", async () => {
    // Act 1: sem options (usando fallbacks de maxChars e maxCombinedChars)
    const files1 = [
      { filename: "sem_diff.js", diff: null },
      { filename: "curto.js", diff: "const x = 1;" }
    ];
    const res1 = await buildContextForFiles(files1, "analyze");
    assert.equal(res1[0].filename, "sem_diff.js");
    assert.equal(res1[1].diff, "const x = 1;");

    // Act 2: com diff grande e re-sumarização (combined.length > maxCombinedChars)
    const files2 = [{ filename: "grande.js", diff: "DIFF_CHUNK_CONTENT_".repeat(10) }];
    const res2 = await buildContextForFiles(files2, "analyze", { maxChars: 30, maxCombinedChars: 5 });
    assert.match(res2[0].diff, /\/\* SUMMARY:\nResumo mock\n\*\//);

    // Act 3: com diff grande sem re-sumarização (combined.length <= maxCombinedChars)
    cleanCacheFile();
    const res3 = await buildContextForFiles(files2, "analyze", { maxChars: 30, maxCombinedChars: 1000 });
    assert.match(res3[0].diff, /\/\* SUMMARY:\n/);

    // Act 4: leitura do cache gerado
    const resCached = await buildContextForFiles(files2, "analyze", { maxChars: 30 });
    assert.match(resCached[0].diff, /\/\* SUMMARY \(cached\):/);
  });

  await t.test("ensureCache, readCache e writeCache devem cobrir ramificações de arquivos vazios/ausentes e erros", () => {
    // Act 1: ensureCache quando CACHE_DIR existe mas CACHE_FILE não existe
    cleanCacheFile();
    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR);
    ensureCache();
    assert.ok(fs.existsSync(CACHE_FILE));

    // Act 2: readCache com arquivo de conteúdo vazio ("")
    fs.writeFileSync(CACHE_FILE, "", "utf8");
    const emptyCache = readCache();
    assert.deepEqual(emptyCache, {});

    // Act 3: readCache com JSON corrompido
    fs.writeFileSync(CACHE_FILE, "CORRUPTED_JSON", "utf8");
    const parsedCache = readCache();
    assert.deepEqual(parsedCache, {});

    // Act 4: ensureCache catch block
    const originalExists = fs.existsSync;
    const originalMkdir = fs.mkdirSync;

    fs.existsSync = (p) => (p === CACHE_DIR ? false : true);
    fs.mkdirSync = () => { throw new Error("Mkdir Fail"); };
    assert.doesNotThrow(() => ensureCache());

    fs.existsSync = originalExists;
    fs.mkdirSync = originalMkdir;

    // Act 5: writeCache catch block
    const originalWrite = fs.writeFileSync;
    fs.writeFileSync = () => { throw new Error("Write Fail"); };
    assert.doesNotThrow(() => writeCache({ key: "val" }));
    fs.writeFileSync = originalWrite;
  });

  await t.test("clearContextCache deve testar com arquivo existente, ausente e erro no catch", () => {
    // Act 1: Limpar quando arquivo não existe
    cleanCacheFile();
    assert.doesNotThrow(() => clearContextCache());

    // Act 2: Limpar quando arquivo existe
    writeCache({ key: "val" });
    assert.ok(fs.existsSync(CACHE_FILE));
    clearContextCache();
    assert.ok(!fs.existsSync(CACHE_FILE));

    // Act 3: Erro no catch do unlinkSync
    writeCache({ key: "val" });
    const originalUnlink = fs.unlinkSync;
    fs.unlinkSync = () => { throw new Error("Unlink Failure Test"); };

    assert.doesNotThrow(() => clearContextCache());

    // Cleanup
    fs.unlinkSync = originalUnlink;
  });

  await t.test("buildContextForFiles deve tratar exceção graciosa quando summarizeFileChunks falha", async () => {
    // Arrange
    saveConfig({
      OPENAI_API_KEY: "sk-invalid",
      OPENAI_API_MODEL: "gpt-5-nano",
      OPENAI_RESPONSE_LANGUAGE: "pt-BR",
      OPENAI_API_BASEURL: "http://127.0.0.1:1111/v1" // Porta sem servidor
    });
    const fileLongo = { filename: "erro.js", diff: "EXTRA_LONG_".repeat(30) };

    // Act
    const result = await buildContextForFiles([fileLongo], "analyze", { maxChars: 10 });

    // Assert
    assert.equal(result[0].filename, "erro.js");
    assert.equal(result[0].diff, fileLongo.diff);
  });
});
