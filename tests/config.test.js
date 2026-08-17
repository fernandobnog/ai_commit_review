import path from "path";
import os from "os";

process.env.ACR_CONFIG_FILE = path.join(os.tmpdir(), `test_cfg_config_${process.pid}.json`);
process.env.PASSWORD_CRYPTO_KEY = "segredo_teste_key";

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "fs-extra";
import {
  loadConfig,
  saveConfig,
  deleteConfigFile,
  getConfigDirectory,
  ensureConfigDirectory,
  configFilePath
} from "../src/config.js";

test("config.js - Cobertura 100% de Configuração e I/O por Plataforma (Padrão AAA)", async (t) => {
  await t.test("getConfigDirectory deve resolver caminhos corretos para Windows, macOS e Linux", () => {
    // Arrange & Act
    const winPath = getConfigDirectory("win32", { APPDATA: "C:\\AppData" }, "C:\\Users\\test");
    const winFallback = getConfigDirectory("win32", {}, "C:\\Users\\test");
    const macPath = getConfigDirectory("darwin", {}, "/Users/test");
    const linuxXdg = getConfigDirectory("linux", { XDG_CONFIG_HOME: "/home/test/.custom_config" }, "/home/test");
    const linuxFallback = getConfigDirectory("linux", {}, "/home/test");

    // Assert
    assert.ok(winPath.includes("ai-commit-review"));
    assert.ok(winFallback.includes("ai-commit-review"));
    assert.ok(macPath.includes("Library"));
    assert.ok(linuxXdg.includes(".custom_config"));
    assert.ok(linuxFallback.includes(".config"));
  });

  await t.test("ensureConfigDirectory deve criar diretório e tratar erro no catch", () => {
    // Arrange
    const originalEnsure = fs.ensureDirSync;

    // Act 1: Sucesso
    const resSuccess = ensureConfigDirectory();
    assert.equal(resSuccess, true);

    // Act 2: Erro no catch
    fs.ensureDirSync = () => { throw new Error("Dir creation error"); };
    const resFail = ensureConfigDirectory();
    assert.equal(resFail, false);

    // Cleanup
    fs.ensureDirSync = originalEnsure;
  });

  await t.test("loadConfig, saveConfig e deleteConfigFile devem realizar ciclo de vida completo de I/O", () => {
    // Arrange
    deleteConfigFile();
    const mockData = { TEST_API_KEY: "sk-unit-test", TEST_MODEL: "gpt-5-nano" };

    // Act 1: Load sem arquivo
    const emptyConfig = loadConfig();
    assert.deepEqual(emptyConfig, {});

    // Act 2: Save arquivo
    saveConfig(mockData);
    const loadedConfig = loadConfig();
    assert.equal(loadedConfig.TEST_API_KEY, "sk-unit-test");

    // Act 3: Delete arquivo existente
    const deletedSuccess = deleteConfigFile();
    assert.equal(deletedSuccess, true);

    // Act 4: Delete arquivo inexistente
    const deletedNonExistent = deleteConfigFile();
    assert.equal(deletedNonExistent, false);
  });

  await t.test("funções de I/O devem tratar exceções de sistema de arquivos nos blocos catch", () => {
    // Arrange
    const originalExistsSync = fs.existsSync;
    const originalWriteJsonSync = fs.writeJsonSync;

    fs.existsSync = () => { throw new Error("FS Read Error Test"); };
    fs.writeJsonSync = () => { throw new Error("FS Write Error Test"); };

    // Act & Assert
    assert.doesNotThrow(() => loadConfig());
    assert.doesNotThrow(() => saveConfig({ key: "val" }));
    assert.doesNotThrow(() => deleteConfigFile());

    // Cleanup
    fs.existsSync = originalExistsSync;
    fs.writeJsonSync = originalWriteJsonSync;
  });

  await t.test("configFilePath deve ser exposto como string válida de caminho", () => {
    // Arrange & Act & Assert
    assert.equal(typeof configFilePath, "string");
    assert.ok(configFilePath.endsWith(".config.json"));
  });
});
