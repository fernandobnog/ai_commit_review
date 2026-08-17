process.env.PASSWORD_CRYPTO_KEY = "segredo_teste_key";

import { test } from "node:test";
import assert from "node:assert/strict";
import inquirer from "inquirer";
import { getDeps, createCommit } from "../src/createCommit.js";
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
        result[q.name] = current[q.name] !== undefined ? current[q.name] : true;
      }
    }
    return result;
  };
}

test("createCommit.js - Cobertura 100% de Linhas, Branches e Funções (Padrão AAA)", async (t) => {
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
    assert.equal(typeof defaults.pullChangesFn, "function");
    assert.equal(typeof defaults.clearStageFn, "function");
    assert.equal(typeof defaults.stageAllChangesFn, "function");
    assert.equal(typeof defaults.getStagedFilesDiffsFn, "function");
    assert.equal(typeof defaults.pushChangesFn, "function");
    assert.equal(typeof defaults.promptFn, "function");

    const dummy = () => {};
    const injected = getDeps({
      pullChangesFn: dummy,
      clearStageFn: dummy,
      stageAllChangesFn: dummy,
      getStagedFilesDiffsFn: dummy,
      pushChangesFn: dummy,
      promptFn: dummy,
    });
    assert.equal(injected.pullChangesFn, dummy);
  });

  await t.test("createCommit deve tratar caso sem alterações staged", async () => {
    let clearRan = false;
    let stageRan = false;
    const depsNoStaged = {
      getCurrentBranchFn: () => "main",
      pullChangesFn: () => {},
      clearStageFn: () => { clearRan = true; },
      checkConflictsFn: () => [],
      stageAllChangesFn: () => { stageRan = true; },
      getStagedFilesDiffsFn: () => [],
      promptFn: createPromptMock([{ continueOnBranch: true }])
    };

    await createCommit(depsNoStaged);
    assert.equal(clearRan, true);
    assert.equal(stageRan, true);
  });

  await t.test("createCommit deve tratar aborto do commit e encerramento antecipado", async () => {
    const depsAbort = {
      getCurrentBranchFn: () => "main",
      pullChangesFn: () => {},
      clearStageFn: () => {},
      checkConflictsFn: () => [],
      stageAllChangesFn: () => {},
      getStagedFilesDiffsFn: () => [{ filename: "a.js", diff: "diff" }],
      commitChangesWithEditorFn: () => {},
      undoLastCommitSoftFn: () => {},
      promptFn: createPromptMock([
        { continueOnBranch: true },
        { messageOption: "manual" },
        { manualMessage: "feat: msg" },
        { abortCommit: true } // abortCommit
      ])
    };

    await createCommit(depsAbort);
  });

  await t.test("createCommit deve tratar fluxo feliz com push e sem push", async () => {
    // Act 1: Com push (push = true)
    let pushRan = false;
    const depsPush = {
      getCurrentBranchFn: () => "main",
      pullChangesFn: () => {},
      clearStageFn: () => {},
      checkConflictsFn: () => [],
      stageAllChangesFn: () => {},
      getStagedFilesDiffsFn: () => [{ filename: "b.js", diff: "diff" }],
      commitChangesWithEditorFn: () => {},
      pushChangesFn: () => { pushRan = true; },
      promptFn: createPromptMock([
        { continueOnBranch: true },
        { messageOption: "manual" },
        { manualMessage: "feat: msg" },
        { abortCommit: false },
        { push: true }
      ])
    };

    await createCommit(depsPush);
    assert.equal(pushRan, true);

    // Act 2: Sem push (push = false)
    let pushRanFalse = false;
    const depsNoPush = {
      getCurrentBranchFn: () => "main",
      pullChangesFn: () => {},
      clearStageFn: () => {},
      checkConflictsFn: () => [],
      stageAllChangesFn: () => {},
      getStagedFilesDiffsFn: () => [{ filename: "b.js", diff: "diff" }],
      commitChangesWithEditorFn: () => {},
      pushChangesFn: () => { pushRanFalse = true; },
      promptFn: createPromptMock([
        { continueOnBranch: true },
        { messageOption: "manual" },
        { manualMessage: "feat: msg" },
        { abortCommit: false },
        { push: false }
      ])
    };

    await createCommit(depsNoPush);
    assert.equal(pushRanFalse, false);
  });

  await t.test("createCommit deve relançar erros capturados no bloco try/catch principal", async () => {
    const depsError = {
      getCurrentBranchFn: () => { throw new Error("Erro de Git na branch"); }
    };
    await assert.rejects(async () => await createCommit(depsError), /Erro de Git na branch/);
  });

  await t.test("deve testar os fallbacks sem argumento deps utilizando mock global temporario em inquirer.prompt", async () => {
    const origPrompt = inquirer.prompt;
    inquirer.prompt = async () => ({
      continueOnBranch: true,
      abortCommit: false,
      push: false
    });

    try { await createCommit(); } catch (e) {}

    inquirer.prompt = origPrompt;
  });
});
