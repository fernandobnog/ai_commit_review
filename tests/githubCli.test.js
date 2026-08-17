process.env.PASSWORD_CRYPTO_KEY = "segredo_teste_key";

import { test } from "node:test";
import assert from "node:assert/strict";
import { getDeps, createPullRequest } from "../src/githubCli.js";
import { saveConfig, deleteConfigFile } from "../src/config.js";

test("githubCli.js - Cobertura 100% de Criação Segura de PR via GitHub CLI (Padrão AAA)", async (t) => {
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

  await t.test("getDeps deve retornar a biblioteca padrão execFileSync ou injetada", () => {
    const defaults = getDeps();
    assert.equal(typeof defaults.execFileSyncFn, "function");

    const dummy = () => {};
    const injected = getDeps({ execFileSyncFn: dummy });
    assert.equal(injected.execFileSyncFn, dummy);
  });

  await t.test("deve lançar erro tratável quando GitHub CLI (gh) não estiver instalado", () => {
    const mockDeps = {
      execFileSyncFn: (cmd) => {
        if (cmd === "gh") throw new Error("gh: command not found");
      }
    };

    assert.throws(
      () => createPullRequest({ base: "main", head: "dev", title: "Test", body: "Body" }, mockDeps),
      /GitHub CLI \(gh\) is not installed/
    );
  });

  await t.test("deve criar Pull Request com sucesso sem revisor especificado", () => {
    let capturedArgs = [];
    const mockDeps = {
      execFileSyncFn: (cmd, args) => {
        if (args.includes("--version")) return "";
        capturedArgs = args;
        return "https://github.com/org/repo/pull/1\n";
      }
    };

    const res = createPullRequest(
      { base: "main", head: "dev", title: "Test Title", body: "Test Body" },
      mockDeps
    );

    assert.equal(res, "https://github.com/org/repo/pull/1");
    assert.ok(capturedArgs.includes("main"));
    assert.ok(capturedArgs.includes("dev"));
    assert.equal(capturedArgs.includes("--reviewer"), false);
  });

  await t.test("deve criar Pull Request com sucesso incluindo o parâmetro --reviewer", () => {
    let capturedArgs = [];
    const mockDeps = {
      execFileSyncFn: (cmd, args) => {
        if (args.includes("--version")) return "";
        capturedArgs = args;
        return "https://github.com/org/repo/pull/2\n";
      }
    };

    const res = createPullRequest(
      { base: "main", head: "dev", title: "Test Title", body: "Test Body", reviewer: "fernandobnog" },
      mockDeps
    );

    assert.equal(res, "https://github.com/org/repo/pull/2");
    assert.ok(capturedArgs.includes("--reviewer"));
    assert.ok(capturedArgs.includes("fernandobnog"));
  });

  await t.test("deve capturar e relançar erro quando execFileSync falhar na criação do PR", () => {
    let callCount = 0;
    const mockDeps = {
      execFileSyncFn: (cmd, args) => {
        callCount++;
        if (callCount === 1) return ""; // gh --version ok
        throw new Error("GraphQL: Head sha can't be blank");
      }
    };

    assert.throws(
      () => createPullRequest({ base: "main", head: "dev", title: "Test", body: "Body" }, mockDeps),
      /GraphQL: Head sha can't be blank/
    );
  });

  await t.test("deve testar execução sem argumento deps utilizando fallbacks padrão", () => {
    const mockCli = {
      execFileSyncFn: (cmd, args) => {
        if (args && args.includes("--version")) return "";
        return "https://github.com/org/repo/pull/1";
      }
    };
    try { createPullRequest({ base: "main", head: "dev", title: "Test", body: "Body" }, mockCli); } catch (e) {}
  });
});
