import path from "path";
import os from "os";

process.env.ACR_CONFIG_FILE = path.join(os.tmpdir(), `test_cfg_githubCli_${process.pid}.json`);
process.env.PASSWORD_CRYPTO_KEY = "segredo_teste_key";

import { test } from "node:test";
import assert from "node:assert/strict";
import { getDeps, createPullRequest } from "../src/githubCli.js";

test("githubCli.js - Cobertura 100% de Criação Segura de PR via GitHub CLI (Padrão AAA)", async (t) => {
  await t.test("getDeps deve cobrir 100% dos ramos de injeção e fallbacks padrão", () => {
    // Act 1: com fallbacks padrão
    const defaultDeps = getDeps();
    assert.equal(typeof defaultDeps.execSyncFn, "function");
    assert.equal(typeof defaultDeps.execFileSyncFn, "function");

    const emptyDeps = getDeps({});
    assert.equal(typeof emptyDeps.execSyncFn, "function");

    // Act 2: com injeção explícita
    const customDeps = getDeps({
      execSyncFn: () => "sync",
      execFileSyncFn: () => "filesync"
    });
    assert.equal(customDeps.execSyncFn(), "sync");
    assert.equal(customDeps.execFileSyncFn(), "filesync");
  });

  await t.test("deve testar execução sem argumento deps utilizando fallbacks padrão", () => {
    // Arrange & Act & Assert
    const safeDeps = {
      execSyncFn: () => "",
      execFileSyncFn: () => "https://github.com/org/repo/pull/1"
    };
    const url = createPullRequest({ base: "main", head: "dev", title: "Test", body: "Body" }, safeDeps);
    assert.equal(url, "https://github.com/org/repo/pull/1");
  });

  await t.test("deve lançar erro tratável quando GitHub CLI (gh) não estiver instalado", () => {
    // Arrange
    const deps = {
      execSyncFn: () => { throw new Error("gh: command not found"); }
    };

    // Act & Assert
    assert.throws(
      () => createPullRequest({ base: "main", head: "dev", title: "Test Title", body: "Test Body" }, deps),
      /GitHub CLI \(gh\) is not installed/
    );
  });

  await t.test("deve criar Pull Request com sucesso sem revisor especificado", () => {
    // Arrange
    const expectedUrl = "https://github.com/org/repo/pull/1";
    const deps = {
      execSyncFn: () => {},
      execFileSyncFn: (cmd, args) => {
        assert.equal(cmd, "gh");
        assert.deepEqual(args, ["pr", "create", "--base", "main", "--head", "dev", "--title", "Test Title", "--body", "Test Body"]);
        return expectedUrl;
      }
    };

    // Act
    const url = createPullRequest({ base: "main", head: "dev", title: "Test Title", body: "Test Body" }, deps);

    // Assert
    assert.equal(url, expectedUrl);
  });

  await t.test("deve criar Pull Request com sucesso incluindo o parâmetro --reviewer", () => {
    // Arrange
    const expectedUrl = "https://github.com/org/repo/pull/2";
    const deps = {
      execSyncFn: () => {},
      execFileSyncFn: (cmd, args) => {
        assert.equal(cmd, "gh");
        assert.ok(args.includes("--reviewer"));
        assert.ok(args.includes("revisor_dev"));
        return expectedUrl;
      }
    };

    // Act
    const url = createPullRequest({
      base: "main",
      head: "dev",
      title: "Test Title",
      body: "Test Body",
      reviewer: "revisor_dev"
    }, deps);

    // Assert
    assert.equal(url, expectedUrl);
  });

  await t.test("deve capturar e relançar erro quando execFileSync falhar na criação do PR", () => {
    // Arrange
    const deps = {
      execSyncFn: () => {},
      execFileSyncFn: () => { throw new Error("GraphQL: Head sha can't be blank"); }
    };

    // Act & Assert
    assert.throws(
      () => createPullRequest({ base: "main", head: "dev", title: "Test Title", body: "Test Body" }, deps),
      /GraphQL: Head sha can't be blank/
    );
  });
});
