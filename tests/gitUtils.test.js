import { test } from "node:test";
import assert from "node:assert/strict";
import * as gitUtils from "../src/gitUtils.js";

test("gitUtils.js - Validação de Re-exportação do Módulo Fachada (Padrão AAA)", async (t) => {
  await t.test("deve re-exportar todas as funções do gitCore, gitBranch e githubCli", () => {
    const exportedFunctions = [
      "executeGitCommand",
      "stageAllChanges",
      "clearStage",
      "undoLastCommitSoft",
      "commitChangesWithEditor",
      "getCommits",
      "getModifiedFiles",
      "getFileDiff",
      "getRepositoryDiff",
      "getStagedFileDiff",
      "getStagedFilesDiffs",
      "getCurrentBranch",
      "listBranches",
      "pullChanges",
      "pushChanges",
      "switchBranch",
      "mergeBranch",
      "checkConflicts",
      "getConflictDiff",
      "writeConflictToTempFile",
      "openFileInEditor",
      "updateFileFromTemp",
      "createPullRequest"
    ];

    for (const fnName of exportedFunctions) {
      assert.equal(typeof gitUtils[fnName], "function", `A função ${fnName} deve ser re-exportada em gitUtils.js`);
    }
  });

  await t.test("funções re-exportadas em gitUtils devem ser executáveis sem exceção com mocks de isolamento", () => {
    const mockDeps = { execSyncFn: () => "", executeGitCommandFn: () => "" };
    // Arrange & Act
    const output = gitUtils.executeGitCommand("git status --short", mockDeps);
    const branch = gitUtils.getCurrentBranch(mockDeps);
    const branches = gitUtils.listBranches(mockDeps);
    const commits = gitUtils.getCommits(0, 1, mockDeps);
    const diff = gitUtils.getRepositoryDiff(mockDeps);

    // Assert
    assert.equal(typeof output, "string");
    assert.equal(typeof branch, "string");
    assert.ok(Array.isArray(branches));
    assert.ok(Array.isArray(commits));
    assert.equal(typeof diff, "string");
  });
});
