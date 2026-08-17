process.env.PASSWORD_CRYPTO_KEY = "segredo_teste_key";

import { test } from "node:test";
import assert from "node:assert/strict";
import inquirer from "inquirer";
import {
  getDeps,
  buildChoicesList,
  loadMoreCommits,
  selectCommits,
  processModifiedFiles,
  analyzeCommit,
  analyzeCommits
} from "../src/analyzeCommit.js";
import { saveConfig, deleteConfigFile } from "../src/config.js";

function createPromptMock(answersList = []) {
  let index = 0;
  return async (questions) => {
    const current = answersList[index] || {};
    index++;
    return current;
  };
}

test("analyzeCommit.js - Cobertura 100% de Linhas, Branches e Funções (Padrão AAA)", async (t) => {
  t.beforeEach(() => {
    saveConfig({
      OPENAI_API_KEY: "sk-test-key",
      OPENAI_API_MODEL: "gpt-5-nano",
      OPENAI_RESPONSE_LANGUAGE: "pt-BR"
    });
  });

  t.afterEach(() => {
    deleteConfigFile();
  });

  await t.test("getDeps deve cobrir 100% dos ramos de injeção e fallbacks", () => {
    const defaults = getDeps();
    assert.equal(typeof defaults.getCommitsFn, "function");
    assert.equal(typeof defaults.getModifiedFilesFn, "function");
    assert.equal(typeof defaults.getFileDiffFn, "function");
    assert.equal(typeof defaults.analyzeUpdatedCodeFn, "function");
    assert.equal(typeof defaults.buildContextForFilesFn, "function");
    assert.equal(typeof defaults.promptFn, "function");

    const dummy = () => {};
    const injected = getDeps({
      getCommitsFn: dummy,
      getModifiedFilesFn: dummy,
      getFileDiffFn: dummy,
      analyzeUpdatedCodeFn: dummy,
      buildContextForFilesFn: dummy,
      promptFn: dummy
    });
    assert.equal(injected.getCommitsFn, dummy);
  });

  await t.test("buildChoicesList deve montar lista com e sem a opção load_more", () => {
    const commits = [{ shaShort: "1234567", shaFull: "1234567890", date: "17/08", message: "Initial commit" }];

    // Act 1: reachedEnd = false (inclui load_more)
    const choices1 = buildChoicesList(commits, false);
    assert.ok(choices1.some((c) => c.value === "load_more"));
    assert.ok(choices1.some((c) => c.value === "exit"));

    // Act 2: reachedEnd = true (não inclui load_more)
    const choices2 = buildChoicesList(commits, true);
    assert.equal(choices2.some((c) => c.value === "load_more"), false);
    assert.ok(choices2.some((c) => c.value === "exit"));
  });

  await t.test("loadMoreCommits deve tratar retornos de novos commits ou lista vazia", () => {
    // Act 1: Sem novos commits
    const resEmpty = loadMoreCommits(0, 5, [], () => []);
    assert.equal(resEmpty.reachedEnd, true);

    // Act 2: Com novos commits
    const newComms = [{ shaFull: "abc" }];
    const resLoaded = loadMoreCommits(0, 5, [], () => newComms);
    assert.equal(resLoaded.reachedEnd, false);
    assert.equal(resLoaded.skip, 5);
    assert.equal(resLoaded.allCommits.length, 1);
  });

  await t.test("selectCommits deve tratar seleção de commits, carregar mais, respostas undefined e saída cancelada pelo usuario", async () => {
    let mockCommitsCalls = 0;
    const deps = {
      getCommitsFn: () => {
        mockCommitsCalls++;
        if (mockCommitsCalls === 1) return [{ shaFull: "sha1", shaShort: "sha1", date: "17/08", message: "m1" }];
        return [{ shaFull: "sha2", shaShort: "sha2", date: "17/08", message: "m2" }];
      },
      promptFn: createPromptMock([
        { selectedShas: ["load_more"] }, // 1ª iteração: seleciona carregar mais
        { selectedShas: ["sha1", "sha2"] } // 2ª iteração: seleciona commits
      ])
    };

    const selected = await selectCommits(deps);
    assert.deepEqual(selected, ["sha1", "sha2"]);

    // Act 2: Resposta undefined de selectedShas (testa fallback || [])
    const depsFallback = {
      getCommitsFn: () => [{ shaFull: "sha1" }],
      promptFn: createPromptMock([{}])
    };
    const selectedFallback = await selectCommits(depsFallback);
    assert.deepEqual(selectedFallback, []);

    // Act 3: Seleção da opção "exit" (lança exceção)
    const depsExit = {
      getCommitsFn: () => [{ shaFull: "sha1" }],
      promptFn: createPromptMock([{ selectedShas: ["exit"] }])
    };
    await assert.rejects(async () => await selectCommits(depsExit), /Process terminated by user/);
  });

  await t.test("processModifiedFiles deve tratar diffs validos, diffs vazios e erros de git", async () => {
    const modifiedFiles = [
      { status: "M", file: "valido.js" },
      { status: "M", file: "sem_diff.js" },
      { status: "M", file: "erro.js" }
    ];

    const deps = {
      getFileDiffFn: (sha, file) => {
        if (file === "valido.js") return "+ const a = 1;";
        if (file === "sem_diff.js") return "";
        throw new Error("Erro de diff");
      }
    };

    const files = await processModifiedFiles("sha123", modifiedFiles, deps);
    assert.equal(files.length, 1);
    assert.equal(files[0].filename, "valido.js");
  });

  await t.test("analyzeCommit deve tratar commits sem arquivos, sem diffs e fluxo feliz de análise com IA", async () => {
    // Act 1: Commit sem arquivos modificados
    await analyzeCommit("sha0", { getModifiedFilesFn: () => [] });

    // Act 2: Commit com arquivo mas sem diffs validos
    await analyzeCommit("sha1", {
      getModifiedFilesFn: () => [{ status: "M", file: "f.js" }],
      getFileDiffFn: () => ""
    });

    // Act 3: Fluxo feliz com análise de IA efetuada
    let codeAnalyzed = false;
    await analyzeCommit("sha2", {
      getModifiedFilesFn: () => [{ status: "M", file: "f2.js" }],
      getFileDiffFn: () => "+ const b = 2;",
      buildContextForFilesFn: async (f) => f,
      analyzeUpdatedCodeFn: async () => {
        codeAnalyzed = true;
        return "Análise de IA concluída";
      }
    });
    assert.equal(codeAnalyzed, true);

    // Act 4: Tratamento de erro na análise
    await analyzeCommit("sha3", {
      getModifiedFilesFn: () => { throw new Error("Erro no git diff-tree"); }
    });
  });

  await t.test("analyzeCommits deve tratar seleção vazia, fluxo com múltiplos commits e exceção no loop", async () => {
    // Act 1: Nossos commits selecionados (seleção vazia)
    await analyzeCommits({
      getCommitsFn: () => [],
      promptFn: createPromptMock([{ selectedShas: [] }])
    });

    // Act 2: Fluxo feliz com múltiplos commits analisados
    let analyzedCount = 0;
    await analyzeCommits({
      getCommitsFn: () => [{ shaFull: "shaA" }, { shaFull: "shaB" }],
      getModifiedFilesFn: () => [{ status: "M", file: "f.js" }],
      getFileDiffFn: () => "+ diff",
      buildContextForFilesFn: async (f) => f,
      analyzeUpdatedCodeFn: async () => { analyzedCount++; return "ok"; },
      promptFn: createPromptMock([{ selectedShas: ["shaA", "shaB"] }])
    });
    assert.equal(analyzedCount, 2);

    // Act 3: Exceção no selectCommits (capturada no try/catch principal)
    await analyzeCommits({
      getCommitsFn: () => [{ shaFull: "shaA" }],
      promptFn: createPromptMock([{ selectedShas: ["exit"] }])
    });
  });

  await t.test("deve testar os fallbacks utilizando mocks seguros de Git e inquirer.prompt", async () => {
    const origPrompt = inquirer.prompt;
    inquirer.prompt = async () => ({ selectedShas: [] });

    const safeDeps = {
      getCommitsFn: () => [],
      getModifiedFilesFn: () => [],
      getFileDiffFn: () => "",
      analyzeUpdatedCodeFn: async () => "",
      buildContextForFilesFn: async () => "",
      promptFn: inquirer.prompt
    };

    try { await analyzeCommits(safeDeps); } catch (e) {}

    inquirer.prompt = origPrompt;
  });
});
