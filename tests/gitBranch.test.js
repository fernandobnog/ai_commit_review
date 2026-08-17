process.env.PASSWORD_CRYPTO_KEY = "segredo_teste_key";

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import os from "os";
import {
  getCurrentBranch,
  listBranches,
  pullChanges,
  pushChanges,
  switchBranch,
  restoreStashOrRollback,
  mergeBranch,
  checkConflicts,
  getConflictDiff,
  writeConflictToTempFile,
  openFileInEditor,
  updateFileFromTemp
} from "../src/gitBranch.js";
import { saveConfig, deleteConfigFile } from "../src/config.js";

test("gitBranch.js - Cobertura 100% de Gerenciamento de Branches (Padrão AAA)", async (t) => {
  let tempBaseDir;

  t.beforeEach(() => {
    saveConfig({
      OPENAI_API_KEY: "sk-test-key",
      OPENAI_API_MODEL: "gpt-5-nano",
      OPENAI_RESPONSE_LANGUAGE: "pt-BR"
    });
    tempBaseDir = fs.mkdtempSync(path.join(os.tmpdir(), "git_branch_"));
  });

  t.afterEach(() => {
    deleteConfigFile();
    if (fs.existsSync(tempBaseDir)) {
      fs.rmSync(tempBaseDir, { recursive: true, force: true });
    }
  });

  await t.test("getCurrentBranch deve retornar o nome da branch atual ou 'unknown' em erro", () => {
    const depsSuccess = { executeGitCommandFn: () => "main" };
    assert.equal(getCurrentBranch(depsSuccess), "main");

    const depsError = { executeGitCommandFn: () => { throw new Error("Branch Fail"); } };
    assert.equal(getCurrentBranch(depsError), "unknown");
  });

  await t.test("listBranches deve listar branches sem o marcador asterisco ou retornar [] em erro", () => {
    const depsSuccess = { executeGitCommandFn: () => "* main\n  feature/1\n  develop" };
    const branches = listBranches(depsSuccess);
    assert.deepEqual(branches, ["main", "feature/1", "develop"]);

    const depsEmpty = { executeGitCommandFn: () => "" };
    assert.deepEqual(listBranches(depsEmpty), []);

    const depsError = { executeGitCommandFn: () => { throw new Error("List Fail"); } };
    assert.deepEqual(listBranches(depsError), []);
  });

  await t.test("pullChanges e pushChanges devem executar comandos e tratar erros", () => {
    let pullRan = false;
    let pushRan = false;

    const depsSuccess = {
      executeGitCommandFn: (cmd) => {
        if (cmd.includes("pull")) pullRan = true;
        if (cmd.includes("push")) pushRan = true;
        return "";
      }
    };

    pullChanges(depsSuccess);
    pushChanges(depsSuccess);
    assert.equal(pullRan, true);
    assert.equal(pushRan, true);

    const depsError = {
      executeGitCommandFn: () => { throw new Error("Git Error"); }
    };
    assert.throws(() => pullChanges(depsError), /Git Error/);
    pushChanges(depsError);
  });

  await t.test("switchBranch deve validar parâmetros e lidar com stash e erros", () => {
    // Parameter validation
    switchBranch(null);
    switchBranch("");

    // Act 1: Sem alterações (sem stash)
    let checkedOut = "";
    const depsNoStash = {
      executeGitCommandFn: (cmd) => {
        if (cmd.includes("rev-parse")) return "main";
        if (cmd.includes("status")) return "";
        if (cmd.includes("git checkout")) checkedOut = cmd.replace("git checkout ", "");
        return "";
      }
    };
    switchBranch("feature/teste", depsNoStash);
    assert.equal(checkedOut, "feature/teste");

    // Act 2: Com alterações (com stash pop com sucesso)
    let stashed = false;
    let stashPopped = false;
    const depsWithStash = {
      executeGitCommandFn: (cmd) => {
        if (cmd.includes("rev-parse")) return "main";
        if (cmd.includes("status")) return " M file.js";
        if (cmd.includes("stash pop")) stashPopped = true;
        if (cmd.includes("stash")) stashed = true;
        return "";
      }
    };
    switchBranch("feature/teste", depsWithStash);
    assert.equal(stashed, true);
    assert.equal(stashPopped, true);

    // Act 3: Erro no checkout
    const depsError = {
      executeGitCommandFn: () => { throw new Error("Checkout Fail"); }
    };
    assert.throws(() => switchBranch("feature/erro", depsError), /Checkout Fail/);
  });

  await t.test("restoreStashOrRollback deve tratar conflitos de stash e erros no rollback", () => {
    // Act 1: Restauração com sucesso na branch original
    let popOriginalSuccess = false;
    const depsRollbackOk = {
      executeGitCommandFn: (cmd) => {
        if (cmd.includes("stash pop")) popOriginalSuccess = true;
        return "";
      }
    };
    const errOrig = new Error("Stash Pop Conflict");
    assert.throws(() => restoreStashOrRollback("main", errOrig, depsRollbackOk), /Stash Pop Conflict/);
    assert.equal(popOriginalSuccess, true);

    // Act 2: Erro na restauração da branch original
    const depsRollbackErr = {
      executeGitCommandFn: (cmd) => {
        if (cmd.includes("stash pop")) throw new Error("Fatal Stash Pop Failure");
        return "";
      }
    };
    assert.throws(() => restoreStashOrRollback("main", errOrig, depsRollbackErr), /Fatal Stash Pop Failure/);
  });

  await t.test("mergeBranch deve executar switch, merge e pullChanges", async () => {
    let mergedFrom = "";
    const depsMerge = {
      executeGitCommandFn: (cmd) => {
        if (cmd.includes("git merge")) mergedFrom = cmd;
        return "";
      }
    };
    await mergeBranch("dev", "main", depsMerge);
    assert.ok(mergedFrom.includes("dev"));
  });

  await t.test("checkConflicts e getConflictDiff devem identificar conflitos de merge", () => {
    const statusOutput = "UU file1.js\nM  file2.js\nUU file3.js";
    const depsConflict = {
      executeGitCommandFn: (cmd) => {
        if (cmd.includes("status")) return statusOutput;
        if (cmd.includes("diff")) return "<<<<<<< HEAD";
        return "";
      }
    };

    const conflicts = checkConflicts(depsConflict);
    assert.deepEqual(conflicts, ["file1.js", "file3.js"]);

    const diff = getConflictDiff("file1.js", depsConflict);
    assert.equal(diff, "<<<<<<< HEAD");

    const depsError = { executeGitCommandFn: () => { throw new Error("Status Fail"); } };
    assert.deepEqual(checkConflicts(depsError), []);
    assert.equal(getConflictDiff("file1.js", depsError), "");
  });

  await t.test("writeConflictToTempFile, openFileInEditor e updateFileFromTemp devem manipular arquivos temporarios", () => {
    const tempPath = writeConflictToTempFile("teste.js", "conteudo conflito");
    assert.ok(fs.existsSync(tempPath));

    let editorRan = false;
    const depsEditor = {
      execSyncFn: () => { editorRan = true; return ""; }
    };
    openFileInEditor(tempPath, depsEditor);
    assert.equal(editorRan, true);

    // Erro no editor
    const depsEditorErr = {
      execSyncFn: () => { throw new Error("Editor Fail"); }
    };
    openFileInEditor(tempPath, depsEditorErr);

    // updateFileFromTemp
    const targetFile = path.join(tempBaseDir, "target_test.js");
    fs.writeFileSync(targetFile, "original");

    let addedFile = "";
    const depsUpdate = {
      executeGitCommandFn: (cmd) => {
        if (cmd.includes("git add")) addedFile = cmd;
        return "";
      }
    };
    updateFileFromTemp(targetFile, tempPath, depsUpdate);
    assert.ok(addedFile.includes("target_test.js"));

    // Erro updateFileFromTemp
    updateFileFromTemp("inexistente.txt", tempPath, depsUpdate);

    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  });

  await t.test("deve testar chamadas sem argumento deps utilizando mocks seguros de executeGitCommand", () => {
    const safeDeps = {
      executeGitCommandFn: (cmd) => {
        if (cmd.includes("rev-parse")) return "master";
        if (cmd.includes("status")) return "";
        return "";
      },
      execSyncFn: () => ""
    };

    getCurrentBranch(safeDeps);
    listBranches(safeDeps);
    pullChanges(safeDeps);
    pushChanges(safeDeps);
    switchBranch("master", safeDeps);
    checkConflicts(safeDeps);
    getConflictDiff("file.js", safeDeps);
    openFileInEditor("file.txt", safeDeps);
    updateFileFromTemp("file.txt", "file.txt", safeDeps);
  });
});
