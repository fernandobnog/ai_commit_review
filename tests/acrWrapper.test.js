process.env.PASSWORD_CRYPTO_KEY = "segredo_teste_key";

import { test } from "node:test";
import assert from "node:assert/strict";
import { getDeps, runAcrWrapper, main } from "../src/acr-wrapper.js";
import { saveConfig, deleteConfigFile } from "../src/config.js";

test("acr-wrapper.js - Cobertura 100% de Linhas, Branches e Funções (Padrão AAA)", async (t) => {
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
    assert.equal(typeof defaults.spawnFn, "function");
    assert.ok(defaults.cliPath.endsWith("cli.js"));

    const dummy = () => {};
    const injected = getDeps({
      spawnFn: dummy,
      cliPath: "/custom/cli.js"
    });
    assert.equal(injected.spawnFn, dummy);
    assert.equal(injected.cliPath, "/custom/cli.js");
  });

  await t.test("runAcrWrapper deve executar spawnFn com os argumentos corretos", () => {
    let spawnCalled = false;
    let spawnArgs = [];

    const mockDeps = {
      spawnFn: (command, args, options) => {
        spawnCalled = true;
        spawnArgs = [command, args, options];
        return { pid: 1234 };
      },
      cliPath: "/app/cli.js"
    };

    const res = runAcrWrapper(["--test"], mockDeps);
    assert.equal(spawnCalled, true);
    assert.equal(spawnArgs[0], "node");
    assert.deepEqual(spawnArgs[1], ["--no-warnings", "/app/cli.js", "--test"]);
    assert.deepEqual(spawnArgs[2], { stdio: "inherit" });
    assert.equal(res.pid, 1234);

    // Testar fallback do parâmetro args sem argumentos
    let defaultArgsPassed = [];
    runAcrWrapper(undefined, {
      spawnFn: (cmd, args) => { defaultArgsPassed = args; }
    });
    assert.ok(Array.isArray(defaultArgsPassed));
  });

  await t.test("main deve executar runAcrWrapper apenas quando acr-wrapper for o script executado", () => {
    let spawnRan = false;
    const mockDeps = {
      spawnFn: () => {
        spawnRan = true;
        return { pid: 99 };
      }
    };

    // Act 1: process.argv[1] terminando em acr-wrapper.js
    const res1 = main("/path/to/acr-wrapper.js", ["--help"], mockDeps);
    assert.equal(spawnRan, true);
    assert.equal(res1.pid, 99);

    // Act 2: process.argv[1] terminando em acr-wrapper sem extensão
    spawnRan = false;
    const res2 = main("/path/to/acr-wrapper", ["--help"], mockDeps);
    assert.equal(spawnRan, true);
    assert.equal(res2.pid, 99);

    // Act 3: process.argv[1] diferente de acr-wrapper (ex: teste)
    spawnRan = false;
    const res3 = main("/path/to/outro.js", ["--help"], mockDeps);
    assert.equal(spawnRan, false);
    assert.equal(res3, undefined);

    // Act 4: process.argv[1] falsy (undefined)
    spawnRan = false;
    const res4 = main(undefined, ["--help"], mockDeps);
    assert.equal(spawnRan, false);
    assert.equal(res4, undefined);
  });
});
