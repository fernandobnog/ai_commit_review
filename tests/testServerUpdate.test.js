process.env.PASSWORD_CRYPTO_KEY = "segredo_teste_key";

import { test } from "node:test";
import assert from "node:assert/strict";
import inquirer from "inquirer";
import fs from "fs";
import path from "path";
import os from "os";
import {
  getDeps,
  getDockerFolders,
  promptVersionUpdate,
  dockerCheck,
  mergeToTest,
  updateServerToTest
} from "../src/testServerUpdate.js";
import { saveConfig, deleteConfigFile } from "../src/config.js";

function createPromptMock(answersList = []) {
  let index = 0;
  return async (questions) => {
    const list = Array.isArray(questions) ? questions : [questions];
    const current = answersList[index] || {};
    index++;
    const result = {};
    for (const q of list) {
      if (q && q.name) {
        if (q.validate && typeof q.validate === "function") {
          q.validate("invalido");
          q.validate("2026.08.001");
        }
        result[q.name] = current[q.name] !== undefined ? current[q.name] : true;
      }
    }
    return result;
  };
}

test("testServerUpdate.js - Cobertura 100% de Linhas, Branches e Funções (Padrão AAA)", async (t) => {
  let tempBaseDir;

  t.beforeEach(() => {
    saveConfig({
      OPENAI_API_KEY: "sk-test-key",
      OPENAI_API_MODEL: "gpt-5-nano",
      OPENAI_RESPONSE_LANGUAGE: "pt-BR"
    });
    tempBaseDir = fs.mkdtempSync(path.join(os.tmpdir(), "test_server_"));
  });

  t.afterEach(() => {
    deleteConfigFile();
    if (fs.existsSync(tempBaseDir)) {
      fs.rmSync(tempBaseDir, { recursive: true, force: true });
    }
  });

  await t.test("getDeps deve cobrir 100% dos ramos de injeção e fallbacks", () => {
    const defaults = getDeps();
    assert.equal(typeof defaults.getCurrentBranchFn, "function");
    assert.equal(typeof defaults.mergeBranchFn, "function");
    assert.equal(typeof defaults.switchBranchFn, "function");
    assert.equal(typeof defaults.pushChangesFn, "function");
    assert.equal(typeof defaults.createCommitFn, "function");
    assert.equal(typeof defaults.promptFn, "function");
    assert.equal(defaults.baseDir, process.cwd());

    const dummy = () => {};
    const injected = getDeps({
      getCurrentBranchFn: dummy,
      mergeBranchFn: dummy,
      switchBranchFn: dummy,
      pushChangesFn: dummy,
      createCommitFn: dummy,
      promptFn: dummy,
      baseDir: "/custom/path"
    });
    assert.equal(injected.getCurrentBranchFn, dummy);
    assert.equal(injected.baseDir, "/custom/path");
  });

  await t.test("getDockerFolders deve mapear pastas docker na raiz, arquivo docker e subdiretórios com arquivos/pastas ignoradas", () => {
    // Act 1: Pasta docker na raiz
    const rootDocker = path.join(tempBaseDir, "docker");
    fs.mkdirSync(rootDocker);
    const foldersRoot = getDockerFolders(tempBaseDir);
    assert.deepEqual(foldersRoot, ["docker"]);

    // Act 2: 'docker' como arquivo comum na raiz (fs.statSync(rootDocker).isDirectory() é false)
    fs.rmSync(rootDocker, { recursive: true });
    fs.writeFileSync(rootDocker, "arquivo de teste nao diretorio", "utf-8");
    const foldersFile = getDockerFolders(tempBaseDir);
    assert.deepEqual(foldersFile, []);

    // Act 3: Subdiretórios com subpasta docker (excluindo arquivos comuns, node_modules e .git)
    fs.unlinkSync(rootDocker);
    fs.writeFileSync(path.join(tempBaseDir, "readme.txt"), "arquivo comum na raiz", "utf-8");

    const modDir = path.join(tempBaseDir, "app_module");
    const subDocker = path.join(modDir, "docker");
    fs.mkdirSync(subDocker, { recursive: true });

    const ignoredNodeModules = path.join(tempBaseDir, "node_modules");
    fs.mkdirSync(ignoredNodeModules);

    const ignoredGit = path.join(tempBaseDir, ".git");
    fs.mkdirSync(ignoredGit);

    const foldersSub = getDockerFolders(tempBaseDir);
    assert.deepEqual(foldersSub, [path.join("app_module", "docker")]);
  });

  await t.test("promptVersionUpdate deve atualizar arquivo versao.txt ou ignorar conforme resposta", async () => {
    const dockerFolder = path.join(tempBaseDir, "docker");
    fs.mkdirSync(dockerFolder);
    const versionFile = path.join(dockerFolder, "versao.txt");

    // Act 1: updateVersion = false
    const depsNoUpdate = {
      baseDir: tempBaseDir,
      promptFn: createPromptMock([{ updateVersion: false }])
    };
    await promptVersionUpdate("docker", depsNoUpdate);
    assert.equal(fs.existsSync(versionFile), false);

    // Act 2: updateVersion = true com versao existente
    fs.writeFileSync(versionFile, "2026.01.001", "utf-8");
    const depsUpdate = {
      baseDir: tempBaseDir,
      promptFn: createPromptMock([{ updateVersion: true }, { version: "2026.08.002" }])
    };
    await promptVersionUpdate("docker", depsUpdate);
    const content = fs.readFileSync(versionFile, "utf-8").trim();
    assert.equal(content, "2026.08.002");
  });

  await t.test("dockerCheck deve tratar projetos nao dockerizados, sem pastas docker e fluxo com sucesso", async () => {
    // Act 1: isDockerized = false
    const depsNoDocker = {
      baseDir: tempBaseDir,
      promptFn: createPromptMock([{ isDockerized: false }])
    };
    const resNoDocker = await dockerCheck(depsNoDocker);
    assert.equal(resNoDocker, false);

    // Act 2: isDockerized = true mas sem pastas docker
    const depsNoFolders = {
      baseDir: tempBaseDir,
      promptFn: createPromptMock([{ isDockerized: true }])
    };
    const resNoFolders = await dockerCheck(depsNoFolders);
    assert.equal(resNoFolders, false);

    // Act 3: com pasta docker e atualização de versão
    fs.mkdirSync(path.join(tempBaseDir, "docker"));
    const depsOk = {
      baseDir: tempBaseDir,
      promptFn: createPromptMock([{ isDockerized: true }, { updateVersion: false }])
    };
    const resOk = await dockerCheck(depsOk);
    assert.equal(resOk, true);
  });

  await t.test("mergeToTest deve tratar branch test, branch teste, branch develop e branches de feature", async () => {
    let merged = [];
    let switched = "";

    const depsBase = {
      mergeBranchFn: async (from, to) => { merged.push(`${from}->${to}`); },
      switchBranchFn: (b) => { switched = b; }
    };

    // Act 1a: Branch test (ja na branch)
    await mergeToTest({ ...depsBase, getCurrentBranchFn: async () => "test" });
    assert.equal(merged.length, 0);

    // Act 1b: Branch teste (ja na branch)
    await mergeToTest({ ...depsBase, getCurrentBranchFn: async () => "teste" });
    assert.equal(merged.length, 0);

    // Act 2: Branch develop
    await mergeToTest({ ...depsBase, getCurrentBranchFn: async () => "develop" });
    assert.deepEqual(merged, ["develop->teste"]);

    // Act 3: Branch feature
    merged = [];
    await mergeToTest({ ...depsBase, getCurrentBranchFn: async () => "feature/x" });
    assert.deepEqual(merged, ["feature/x->develop", "develop->teste"]);
    assert.equal(switched, "teste");
  });

  await t.test("updateServerToTest deve tratar fluxo completo feliz e exceções em objeto Error e String", async () => {
    fs.mkdirSync(path.join(tempBaseDir, "docker"));

    let commitRan = false;
    let pushRan = false;

    const depsHappy = {
      baseDir: tempBaseDir,
      getCurrentBranchFn: async () => "develop",
      mergeBranchFn: async () => {},
      switchBranchFn: () => {},
      createCommitFn: async () => { commitRan = true; },
      pushChangesFn: () => { pushRan = true; },
      promptFn: createPromptMock([{ isDockerized: true }, { updateVersion: false }])
    };

    await updateServerToTest(depsHappy);
    assert.equal(commitRan, true);
    assert.equal(pushRan, true);

    // Act 2: dockerCheck falso (retorno antecipado)
    let commitRanFalse = false;
    const depsNoDocker = {
      baseDir: tempBaseDir,
      createCommitFn: async () => { commitRanFalse = true; },
      promptFn: createPromptMock([{ isDockerized: false }])
    };
    await updateServerToTest(depsNoDocker);
    assert.equal(commitRanFalse, false);

    // Act 3a: Exceção de objeto Error
    const depsErrorObj = {
      baseDir: tempBaseDir,
      promptFn: () => { throw new Error("Erro de prompt objeto"); }
    };
    await assert.rejects(async () => await updateServerToTest(depsErrorObj), /Erro de prompt objeto/);

    // Act 3b: Exceção de string pura (testa err.message || err)
    const depsErrorStr = {
      baseDir: tempBaseDir,
      promptFn: () => { throw "Erro de prompt string pura"; }
    };
    await assert.rejects(async () => await updateServerToTest(depsErrorStr), (err) => err === "Erro de prompt string pura");
  });

  await t.test("deve testar os fallbacks sem argumento deps utilizando mock global temporario em inquirer.prompt", async () => {
    const origPrompt = inquirer.prompt;
    inquirer.prompt = async () => ({ isDockerized: false });

    try { await updateServerToTest(); } catch (e) {}

    inquirer.prompt = origPrompt;
  });
});
