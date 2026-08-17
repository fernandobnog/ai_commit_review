process.env.PASSWORD_CRYPTO_KEY = "segredo_teste_key";

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getConfigDirectory,
  saveConfig,
  loadConfig,
  deleteConfigFile
} from "../src/config.js";

test("config.js - Cobertura 100% de Configuração (Padrão AAA)", async (t) => {
  t.afterEach(() => {
    deleteConfigFile();
  });

  await t.test("getConfigDirectory deve retornar caminhos corretos por plataforma", () => {
    const winDir = getConfigDirectory("win32", { APPDATA: "C:\\AppData" }, "C:\\User");
    assert.ok(winDir.includes("ai-commit-review"));

    const winDirFallback = getConfigDirectory("win32", {}, "C:\\User");
    assert.ok(winDirFallback.includes("AppData"));

    const macDir = getConfigDirectory("darwin", {}, "/Users/test");
    assert.ok(macDir.includes("ai-commit-review"));

    const linuxDir = getConfigDirectory("linux", { XDG_CONFIG_HOME: "/custom/config" }, "/home/test");
    assert.ok(linuxDir.includes("ai-commit-review"));

    const linuxDirFallback = getConfigDirectory("linux", {}, "/home/test");
    assert.ok(linuxDirFallback.includes("ai-commit-review"));
  });

  await t.test("saveConfig, loadConfig e deleteConfigFile devem ler, salvar e remover configs do disco", () => {
    deleteConfigFile();
    const loadedEmpty = loadConfig();
    assert.deepEqual(loadedEmpty, {});

    const testConfig = { OPENAI_API_KEY: "sk-unit-test", OPENAI_API_MODEL: "gpt-5-nano" };
    saveConfig(testConfig);

    const loadedConfig = loadConfig();
    assert.equal(loadedConfig.OPENAI_API_KEY, "sk-unit-test");

    const deleted = deleteConfigFile();
    assert.equal(deleted, true);

    const deletedAgain = deleteConfigFile();
    assert.equal(deletedAgain, false);
  });
});
