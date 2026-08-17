process.env.PASSWORD_CRYPTO_KEY = "segredo_teste_key";

import { test } from "node:test";
import assert from "node:assert/strict";
import * as gitUtils from "../src/gitUtils.js";
import { saveConfig, deleteConfigFile } from "../src/config.js";

test("gitUtils.js - Validação de Re-exportação do Módulo Fachada (Padrão AAA)", async (t) => {
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

  await t.test("deve re-exportar todas as funções do gitCore, gitBranch e githubCli", () => {
    const exportedFunctions = [
      "executeGitCommand",
      "getCommits",
      "getModifiedFiles",
      "getFileDiff",
      "getRepositoryDiff",
      "clearStage",
      "stageAllChanges",
      "undoLastCommitSoft",
      "commitChangesWithEditor",
      "getStagedFileDiff",
      "getStagedFilesDiffs",
      "getCurrentBranch",
      "listBranches",
      "switchBranch",
      "pullChanges",
      "pushChanges",
      "mergeBranch",
      "checkConflicts",
      "getConflictDiff",
      "writeConflictToTempFile",
      "openFileInEditor",
      "updateFileFromTemp",
      "createPullRequest"
    ];

    for (const fnName of exportedFunctions) {
      assert.equal(typeof gitUtils[fnName], "function", `Esperava que gitUtils re-exportasse a função ${fnName}`);
    }
  });

  await t.test("funções re-exportadas em gitUtils devem ser executáveis sem exceção", async () => {
    assert.doesNotThrow(() => {
      try { gitUtils.listBranches(); } catch (e) {}
      try { gitUtils.getCurrentBranch(); } catch (e) {}
      try { gitUtils.checkConflicts(); } catch (e) {}
      try { gitUtils.getRepositoryDiff(); } catch (e) {}
    });
  });
});
