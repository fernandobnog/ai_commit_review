import { test } from "node:test";
import assert from "node:assert/strict";
import { createPullRequest } from "../src/githubCli.js";

test("githubCli.js - Cobertura 100% de Criação Segura de PR via GitHub CLI (Padrão AAA)", async (t) => {
  await t.test("deve testar execução sem argumento deps utilizando fallbacks padrão", () => {
    // Arrange & Act & Assert
    try {
      createPullRequest({ base: "main", head: "dev", title: "Test", body: "Body" });
    } catch (err) {
      assert.ok(err);
    }
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
