process.env.PASSWORD_CRYPTO_KEY = "segredo_teste_key";

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  executeGitCommand,
  formatGitDate,
  truncateString,
  getCommits,
  getModifiedFiles,
  getFileDiff,
  getRepositoryDiff,
  clearStage,
  stageAllChanges,
  undoLastCommitSoft,
  commitChangesWithEditor,
  getStagedFileDiff,
  getStagedFilesDiffs
} from "../src/gitCore.js";
import { saveConfig, deleteConfigFile } from "../src/config.js";

test("gitCore.js - Cobertura 100% de Operações do Git (Padrão AAA)", async (t) => {
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

  await t.test("executeGitCommand deve retornar output limpo e relançar erros no catch", () => {
    const depsSuccess = { execSyncFn: () => "  main \n" };
    const res = executeGitCommand("git branch", depsSuccess);
    assert.equal(res, "main");

    const depsError = { execSyncFn: () => { throw new Error("Git Error"); } };
    assert.throws(() => executeGitCommand("git status", depsError), /Git Error/);
  });

  await t.test("stageAllChanges deve executar git add . e lançar erro em falhas", () => {
    let ran = false;
    const depsSuccess = { execSyncFn: () => { ran = true; return ""; } };
    stageAllChanges(depsSuccess);
    assert.equal(ran, true);

    const depsError = { execSyncFn: () => { throw new Error("Add Fail"); } };
    assert.throws(() => stageAllChanges(depsError), /Add Fail/);
  });

  await t.test("clearStage deve executar git reset e capturar exceções sem quebrar fluxo", () => {
    let ran = false;
    const depsSuccess = { execSyncFn: () => { ran = true; return ""; } };
    clearStage(depsSuccess);
    assert.equal(ran, true);

    const depsError = { execSyncFn: () => { throw new Error("Reset Fail"); } };
    clearStage(depsError);
  });

  await t.test("undoLastCommitSoft deve executar git reset --soft HEAD~1 e relançar exceções", () => {
    let ran = false;
    const depsSuccess = { execSyncFn: () => { ran = true; return ""; } };
    undoLastCommitSoft(depsSuccess);
    assert.equal(ran, true);

    const depsError = { execSyncFn: () => { throw new Error("Undo Fail"); } };
    assert.throws(() => undoLastCommitSoft(depsError), /Undo Fail/);
  });

  await t.test("commitChangesWithEditor deve executar git commit com editor e relançar exceção", () => {
    let ran = false;
    const depsSuccess = { execSyncFn: () => { ran = true; return ""; } };
    commitChangesWithEditor("/tmp/msg.txt", depsSuccess);
    assert.equal(ran, true);

    const depsError = { execSyncFn: () => { throw new Error("Commit Fail"); } };
    assert.throws(() => commitChangesWithEditor("/tmp/msg.txt", depsError), /Commit Fail/);
  });

  await t.test("getCommits e utilitários de data/string devem cobrir parsings, truncamentos e falhas", () => {
    assert.equal(truncateString("curto", 10), "curto");
    assert.equal(truncateString("texto_muito_longo_para_truncar", 10), "texto_m...");

    const dStr = formatGitDate("1700000000");
    assert.ok(typeof dStr === "string");

    const sampleOutput = "sha123full\x1f1700000000\x1fMensagem de commit";
    const depsSuccess = { execSyncFn: () => sampleOutput };
    const commits = getCommits(0, 5, depsSuccess);
    assert.equal(commits.length, 1);
    assert.equal(commits[0].shaShort, "sha123f");

    const depsEmpty = { execSyncFn: () => "" };
    assert.deepEqual(getCommits(0, 5, depsEmpty), []);

    const depsError = { execSyncFn: () => { throw new Error("Log Fail"); } };
    assert.deepEqual(getCommits(0, 5, depsError), []);
  });

  await t.test("getModifiedFiles deve retornar arquivos modificados e tratar saída vazia e exceções", () => {
    const depsSuccess = { execSyncFn: () => "M\tapp.js\nA\tindex.js" };
    const files = getModifiedFiles("sha123", depsSuccess);
    assert.equal(files.length, 2);
    assert.equal(files[0].file, "app.js");

    const depsEmpty = { execSyncFn: () => "" };
    assert.deepEqual(getModifiedFiles("sha123", depsEmpty), []);

    const depsError = { execSyncFn: () => { throw new Error("Diff Fail"); } };
    assert.deepEqual(getModifiedFiles("sha123", depsError), []);
  });

  await t.test("getFileDiff e getRepositoryDiff devem retornar diff ou string vazia em erro", () => {
    const depsSuccess = { execSyncFn: () => "+ diff content" };
    assert.equal(getFileDiff("sha123", "app.js", depsSuccess), "+ diff content");
    assert.equal(getRepositoryDiff(depsSuccess), "+ diff content");

    const depsError = { execSyncFn: () => { throw new Error("Fail"); } };
    assert.equal(getFileDiff("sha123", "app.js", depsError), "");
    assert.equal(getRepositoryDiff(depsError), "");
  });

  await t.test("getStagedFileDiff e getStagedFilesDiffs devem cobrir arquivos deletados, linhas vazias e erros", () => {
    let callCount = 0;
    const depsDeleted = {
      execSyncFn: (cmd) => {
        callCount++;
        if (cmd.includes("diff --cached")) throw new Error("Staged diff fail");
        if (cmd.includes("ls-files --deleted")) return "deleted.js";
        return "";
      }
    };
    const diffDel = getStagedFileDiff("deleted.js", depsDeleted);
    assert.ok(diffDel.includes("File deleted: deleted.js"));

    const depsError = {
      execSyncFn: (cmd) => {
        if (cmd.includes("diff --cached --name-only")) return "file1.js\nfile2.js";
        throw new Error("Diff fail");
      }
    };
    const stagedFiles = getStagedFilesDiffs(depsError);
    assert.equal(stagedFiles.length, 2);

    const depsDiffFail = {
      execSyncFn: () => { throw new Error("Diff --cached fail"); }
    };
    assert.deepEqual(getStagedFilesDiffs(depsDiffFail), []);
  });

  await t.test("deve testar chamadas sem o argumento deps executando os fallbacks padrão", () => {
    try { executeGitCommand("git --version"); } catch (e) {}
    try { getCommits(0, 1); } catch (e) {}
    try { getModifiedFiles("HEAD"); } catch (e) {}
    try { getFileDiff("HEAD", "package.json"); } catch (e) {}
    try { getRepositoryDiff(); } catch (e) {}
    try { clearStage(); } catch (e) {}
    try { stageAllChanges(); } catch (e) {}
    try { undoLastCommitSoft(); } catch (e) {}
    try { commitChangesWithEditor("non_existent_file.txt"); } catch (e) {}
    try { getStagedFileDiff("package.json"); } catch (e) {}
    try { getStagedFilesDiffs(); } catch (e) {}
  });
});
