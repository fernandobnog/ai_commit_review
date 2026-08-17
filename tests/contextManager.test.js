process.env.PASSWORD_CRYPTO_KEY = "segredo_teste_key";

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import {
  ensureCache,
  readCache,
  writeCache,
  hashContent,
  chunkText,
  buildContextForFiles,
  clearContextCache
} from "../src/contextManager.js";
import { saveConfig, deleteConfigFile } from "../src/config.js";

test("contextManager.js - Cobertura 100% de Gerenciador de Contexto e Cache (Padrão AAA)", async (t) => {
  t.beforeEach(() => {
    saveConfig({
      OPENAI_API_KEY: "sk-test-key",
      OPENAI_API_MODEL: "gpt-5-nano",
      OPENAI_RESPONSE_LANGUAGE: "pt-BR"
    });
    clearContextCache();
  });

  t.afterEach(() => {
    deleteConfigFile();
    clearContextCache();
  });

  await t.test("ensureCache, readCache, writeCache e hashContent devem gerenciar cache local", () => {
    ensureCache();
    const hash = hashContent("conteudo_teste");
    assert.equal(typeof hash, "string");

    const cacheData = { [hash]: { summary: "Resumo em cache", timestamp: Date.now() } };
    writeCache(cacheData);

    const readData = readCache();
    assert.ok(readData[hash]);
  });

  await t.test("chunkText deve dividir textos em pedaços com tamanho máximo especificado", () => {
    assert.deepEqual(chunkText("", 10), []);
    const chunks = chunkText("1234567890ABCDEF", 5);
    assert.equal(chunks.length, 4);
    assert.equal(chunks[0], "12345");
  });

  await t.test("buildContextForFiles deve tratar arquivos pequenos, grandes com resumo e cache existente", async () => {
    const files = [
      { filename: "pequeno.js", diff: "const a = 1;", status: "M" },
      { filename: "grande.js", diff: "A".repeat(500), status: "M" }
    ];

    const options = {
      getModelContextLimitFn: async () => 4000,
      summarizeTextFn: async (prompt) => "Resumo do diff",
      maxChars: 100,
      maxCombinedChars: 50
    };

    // Act 1: Gerar contexto e gravar resumo no cache
    const context1 = await buildContextForFiles(files, "ANALYZE", options);
    assert.equal(context1.length, 2);
    assert.ok(context1[1].diff.includes("SUMMARY:"));

    // Act 2: Gerar contexto utilizando o cache gravado
    const context2 = await buildContextForFiles(files, "ANALYZE", options);
    assert.ok(context2[1].diff.includes("SUMMARY (cached):"));

    // Act 3: Tratamento de exceção na sumarização (fallback para diff original)
    const optionsError = {
      getModelContextLimitFn: async () => 4000,
      summarizeTextFn: async () => { throw new Error("Erro da OpenAI API"); },
      maxChars: 50
    };
    const filesError = [{ filename: "erro.js", diff: "B".repeat(200), status: "M" }];
    const contextError = await buildContextForFiles(filesError, "ANALYZE", optionsError);
    assert.equal(contextError[0].diff, "B".repeat(200));
  });

  await t.test("clearContextCache deve limpar cache sem erros", () => {
    clearContextCache();
    clearContextCache(); // chamada idônea duplicada
  });
});
