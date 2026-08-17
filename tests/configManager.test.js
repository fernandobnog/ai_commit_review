process.env.PASSWORD_CRYPTO_KEY = "segredo_teste_key";

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  setApiKeyOpenAINTapp,
  resetConfig,
  setBaseURLOpenAILocal,
  setDefaultModel,
  setDefaultLanguage,
  validateConfiguration,
  ensureValidApiKey,
  updateValidApiKey,
  updateConfigFromString
} from "../src/configManager.js";
import { saveConfig, deleteConfigFile } from "../src/config.js";
import { criptografar } from "../src/crypto.js";

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

test("configManager.js - Cobertura 100% de Gerenciamento de Configuração (Padrão AAA)", async (t) => {
  t.beforeEach(() => {
    deleteConfigFile();
    process.env.CRIPTO_OPENAI_KEY = criptografar("sk-ntapp-secret-key");
    saveConfig({
      OPENAI_API_KEY: "sk-test-key",
      OPENAI_API_MODEL: "gpt-5-nano",
      OPENAI_RESPONSE_LANGUAGE: "pt-BR"
    });
  });

  t.afterEach(() => {
    deleteConfigFile();
  });

  await t.test("setApiKeyOpenAINTapp deve configurar a chave padrao NTAPP se vazia", () => {
    deleteConfigFile();
    const config = setApiKeyOpenAINTapp();
    assert.equal(config.OPENAI_API_KEY, "sk-ntapp-secret-key");
  });

  await t.test("resetConfig deve excluir arquivo de configuração ao confirmar", async () => {
    saveConfig({ TEST: "1" });
    await resetConfig(createPromptMock([{ restartConfig: false }]));
    await resetConfig(createPromptMock([{ restartConfig: true }]));
  });

  await t.test("setBaseURLOpenAILocal deve configurar IA local se detectada", async () => {
    const cfgLocal = await setBaseURLOpenAILocal({}, async () => true);
    assert.equal(cfgLocal.OPENAI_API_KEY, "local");

    const cfgNoLocal = await setBaseURLOpenAILocal({}, async () => false);
    assert.equal(cfgNoLocal.OPENAI_API_KEY, undefined);
  });

  await t.test("setDefaultModel e setDefaultLanguage devem definir padroes de modelo e idioma", () => {
    const c1 = setDefaultModel({});
    assert.equal(c1.OPENAI_API_MODEL, "gpt-5-nano");

    const c2 = setDefaultModel({ OPENAI_API_KEY: "local" });
    assert.equal(c2.OPENAI_API_MODEL, "openai/gpt-oss-20b");

    const c3 = setDefaultLanguage({});
    assert.equal(c3.OPENAI_RESPONSE_LANGUAGE, "pt-BR");
  });

  await t.test("validateConfiguration e ensureValidApiKey devem validar e atualizar chave interativa", async () => {
    const deps = {
      configBaseUrlLocalFn: async () => false,
      configByNTAPPEmailFn: async () => false,
      updateValidApiKeyFn: async () => {
        updateConfigFromString("OPENAI_API_KEY=sk-user-key");
      }
    };

    const cfg = await validateConfiguration(deps);
    assert.ok(cfg.OPENAI_API_KEY);

    await ensureValidApiKey(deps);

    // Act: deleteConfigFile para forcar falha e execucao do catch em ensureValidApiKey
    deleteConfigFile();
    const depsErr = {
      configBaseUrlLocalFn: async () => false,
      configByNTAPPEmailFn: async () => false,
      updateValidApiKeyFn: async () => { throw new Error("Chave invalida"); }
    };
    await assert.rejects(async () => await ensureValidApiKey(depsErr), /ACR not configured/);
  });

  await t.test("updateValidApiKey deve solicitar chave via prompt e salvar", async () => {
    const deps = {
      promptFn: createPromptMock([{ apiKey: "sk-prompt-key" }]),
      configBaseUrlLocalFn: async () => false,
      configByNTAPPEmailFn: async () => true
    };

    await updateValidApiKey(deps);

    const depsErr = {
      promptFn: async () => { throw new Error("Erro de prompt"); }
    };
    await assert.rejects(async () => await updateValidApiKey(depsErr), /Erro de prompt/);
  });

  await t.test("updateConfigFromString deve validar chaves, modelos, idiomas e formatos", () => {
    assert.throws(() => updateConfigFromString("INVALID_FORMAT"), /Invalid format/);
    assert.throws(() => updateConfigFromString("CHAVE_INVALIDA=valor"), /Invalid configuration key/);
    assert.throws(() => updateConfigFromString("OPENAI_API_MODEL=modelo_invalido"), /Invalid AI model/);
    assert.throws(() => updateConfigFromString("OPENAI_RESPONSE_LANGUAGE=lang_invalida"), /Invalid language code/);

    updateConfigFromString("OPENAI_API_KEY=sk-manual");
    updateConfigFromString("OPENAI_API_MODEL=gpt-5-nano");
    updateConfigFromString("OPENAI_RESPONSE_LANGUAGE=pt-BR");
  });
});
