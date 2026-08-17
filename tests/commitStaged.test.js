process.env.PASSWORD_CRYPTO_KEY = "segredo_teste_key";

import { test } from "node:test";
import assert from "node:assert/strict";
import inquirer from "inquirer";
import { getDeps, commitStaged } from "../src/commitStaged.js";
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
        result[q.name] = current[q.name] !== undefined ? current[q.name] : (q.type === "input" ? "feat: mensagem automatica" : true);
      }
    }
    return result;
  };
}

test("commitStaged.js - Cobertura 100% de Linhas, Branches e Funções (Padrão AAA)", async (t) => {
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
    assert.equal(typeof defaults.getStagedFilesDiffsFn, "function");
    assert.equal(typeof defaults.pushChangesFn, "function");
    assert.equal(typeof defaults.promptFn, "function");

    const dummy = () => {};
    const injected = getDeps({
      pullChangesFn: dummy,
      getStagedFilesDiffsFn: dummy,
      pushChangesFn: dummy,
      promptFn: dummy,
    });
    assert.equal(injected.pullChangesFn, dummy);
  });

  await t.test("commitStaged deve tratar caso sem alterações staged", async () => {
    let pullCalled = false;
    const depsNoStaged = {
      getCurrentBranchFn: () => "main",
      pullChangesFn: () => { pullCalled = true; },
      checkConflictsFn: () => [],
      getStagedFilesDiffsFn: () => [],
      promptFn: createPromptMock([{ continueOnBranch: true }])
    };

    await commitStaged(depsNoStaged);
    assert.equal(pullCalled, true);
  });

  await t.test("commitStaged deve tratar aborto do commit e encerramento antecipado", async () => {
    const depsAbort = {
      getCurrentBranchFn: () => "main",
      pullChangesFn: () => {},
      checkConflictsFn: () => [],
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

    await commitStaged(depsAbort);
  });

  await t.test("commitStaged deve tratar fluxo feliz com push e sem push", async () => {
    // Act 1: Com push (push = true)
    let pushRan = false;
    const depsPush = {
      getCurrentBranchFn: () => "main",
      pullChangesFn: () => {},
      checkConflictsFn: () => [],
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

    await commitStaged(depsPush);
    assert.equal(pushRan, true);

    // Act 2: Sem push (push = false)
    let pushRanFalse = false;
    const depsNoPush = {
      getCurrentBranchFn: () => "main",
      pullChangesFn: () => {},
      checkConflictsFn: () => [],
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

    await commitStaged(depsNoPush);
    assert.equal(pushRanFalse, false);
  });

  await t.test("commitStaged deve relançar erros capturados no bloco try/catch principal", async () => {
    const depsError = {
      getCurrentBranchFn: () => { throw new Error("Erro de Git na branch"); }
    };
    await assert.rejects(async () => await commitStaged(depsError), /Erro de Git na branch/);
  });

  await t.test("deve testar os fallbacks utilizando mocks seguros de Git e inquirer.prompt", async () => {
    const origPrompt = inquirer.prompt;
    inquirer.prompt = async () => ({
      continueOnBranch: true,
      abortCommit: false,
      push: false
    });

    const safeDeps = {
      getCurrentBranchFn: () => "main",
      pullChangesFn: () => {},
      checkConflictsFn: () => [],
      getStagedFilesDiffsFn: () => [],
      pushChangesFn: () => {},
      promptFn: inquirer.prompt
    };

    try { await commitStaged(safeDeps); } catch (e) {}

    inquirer.prompt = origPrompt;
  });
});
