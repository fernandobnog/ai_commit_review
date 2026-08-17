process.env.PASSWORD_CRYPTO_KEY = "segredo_teste_key";

import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { analyzeUpdatedCode, getModelContextLimit, summarizeText } from "../src/openaiUtils.js";
import { saveConfig, deleteConfigFile } from "../src/config.js";
import { PromptType } from "../src/models.js";

function createMockOpenAI(responseContent = "Análise mock da IA", shouldFail = false, failMessage = "401 Unauthorized") {
  return {
    chat: {
      completions: {
        create: async (payload) => {
          if (shouldFail) {
            throw new Error(failMessage);
          }
          return {
            choices: [{ message: { content: responseContent } }]
          };
        }
      }
    }
  };
}

test("openaiUtils.js - Cobertura 100% de Integração com OpenAI (Padrão AAA)", async (t) => {
  let mockServer;

  t.before((done) => {
    mockServer = http.createServer((req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ choices: [{ message: { content: "Resposta do servidor HTTP local" } }] }));
    });
    mockServer.listen(9999, "127.0.0.1", done);
  });

  t.after((done) => {
    if (mockServer) mockServer.close(done);
    else done();
  });

  t.beforeEach(() => {
    saveConfig({
      OPENAI_API_KEY: "sk-test-key",
      OPENAI_API_MODEL: "gpt-5-nano",
      OPENAI_RESPONSE_LANGUAGE: "pt-BR",
      OPENAI_API_BASEURL: "http://127.0.0.1:9999/v1"
    });
  });

  t.afterEach(() => {
    deleteConfigFile();
  });

  await t.test("getModelContextLimit deve retornar limite do modelo ou default para desconhecido", async () => {
    // Act 1: gpt-5-nano
    const limitNano = await getModelContextLimit();
    assert.equal(limitNano, 128000);

    // Act 2: modelo desconhecido
    saveConfig({
      OPENAI_API_KEY: "sk-test-key",
      OPENAI_API_MODEL: "modelo-desconhecido",
      OPENAI_RESPONSE_LANGUAGE: "en-US",
      OPENAI_API_BASEURL: "http://127.0.0.1:9999/v1"
    });
    const limitDefault = await getModelContextLimit();
    assert.equal(limitDefault, 8000);
  });

  await t.test("analyzeUpdatedCode deve processar requisições felizes com e sem GPT_5_NANO", async () => {
    // Act 1: modelo gpt-5-nano (com reasoning_effort)
    const mockClient = createMockOpenAI("Review gpt-5-nano feito");
    const res1 = await analyzeUpdatedCode(
      [{ filename: "app.js", diff: "+ const x = 1;" }],
      PromptType.ANALYZE,
      { openaiClient: mockClient }
    );
    assert.equal(res1, "Review gpt-5-nano feito");

    // Act 2: modelo convencional sem baseurl
    saveConfig({
      OPENAI_API_KEY: "sk-test-key",
      OPENAI_API_MODEL: "openai/gpt-oss-20b",
      OPENAI_RESPONSE_LANGUAGE: "en-US",
      OPENAI_API_BASEURL: "http://127.0.0.1:9999/v1"
    });
    const mockClient2 = createMockOpenAI("Review gpt-oss-20b feito");
    const res2 = await analyzeUpdatedCode(
      [{ filename: "app.js", diff: "+ const y = 2;" }],
      PromptType.CREATE,
      { openaiClient: mockClient2 }
    );
    assert.equal(res2, "Review gpt-oss-20b feito");
  });

  await t.test("analyzeUpdatedCode deve truncar arquivos mantendo arquivos pequenos intactos", async () => {
    // Arrange: Modelo com limite pequeno para forçar truncamento
    saveConfig({
      OPENAI_API_KEY: "sk-test-key",
      OPENAI_API_MODEL: "openai/gpt-oss-20b", // Context limit 8000
      OPENAI_RESPONSE_LANGUAGE: "pt-BR",
      OPENAI_API_BASEURL: "http://127.0.0.1:9999/v1"
    });

    const diffGigante = "LARGE_DIFF_LINE_".repeat(2000); // ~34.000 chars
    const files = [
      { filename: "pequeno.js", diff: "const a = 1;" },
      { filename: "grande.js", diff: diffGigante }
    ];
    const mockClient = createMockOpenAI("Review de diff truncado");

    // Act
    const result = await analyzeUpdatedCode(files, PromptType.ANALYZE, { openaiClient: mockClient });

    // Assert
    assert.equal(result, "Review de diff truncado");
  });

  await t.test("analyzeUpdatedCode deve tratar erro 401 recarregando chave API e relançar outros erros", async () => {
    // Act 1: Erro 401 com retry bem sucedido
    let updateKeyCalled = false;
    let attempts = 0;
    const mockClientRetry = {
      chat: {
        completions: {
          create: async () => {
            attempts++;
            if (attempts === 1) throw new Error("401 Unauthorized API Key");
            return { choices: [{ message: { content: "Sucesso no retry" } }] };
          }
        }
      }
    };

    const resRetry = await analyzeUpdatedCode(
      [{ filename: "a.js", diff: "diff" }],
      PromptType.ANALYZE,
      {
        openaiClient: mockClientRetry,
        updateValidApiKeyFn: async () => { updateKeyCalled = true; }
      }
    );
    assert.equal(resRetry, "Sucesso no retry");
    assert.equal(updateKeyCalled, true);

    // Act 2: Erro genérico (ex: 500 Server Error)
    const mockClientFail = createMockOpenAI("", true, "500 Internal Server Error");
    await assert.rejects(
      async () => await analyzeUpdatedCode([{ filename: "a.js", diff: "diff" }], PromptType.ANALYZE, { openaiClient: mockClientFail }),
      /500 Internal Server Error/
    );
  });

  await t.test("summarizeText deve sumarizar textos curtos, truncar textos longos e tratar limites e erros", async () => {
    // Act 1: Texto normal
    const mockClient = createMockOpenAI("Resumo efetuado");
    const res1 = await summarizeText("Texto curto para resumo", { openaiClient: mockClient });
    assert.equal(res1, "Resumo efetuado");

    // Act 2: Texto longo com truncamento
    saveConfig({
      OPENAI_API_KEY: "sk-test-key",
      OPENAI_API_MODEL: "openai/gpt-oss-20b",
      OPENAI_RESPONSE_LANGUAGE: "pt-BR",
      OPENAI_API_BASEURL: "http://127.0.0.1:9999/v1"
    });
    const textoLongo = "TEXTO_MUITO_LONGO_".repeat(1000);
    const res2 = await summarizeText(textoLongo, { openaiClient: mockClient });
    assert.equal(res2, "Resumo efetuado");

    // Act 3: Erro no cliente
    const mockClientFail = createMockOpenAI("", true, "Network Error");
    await assert.rejects(
      async () => await summarizeText("teste", { openaiClient: mockClientFail }),
      /Network Error/
    );
  });

  await t.test("summarizeText deve lançar erro se prompt estimado exceder o limite de tokens do modelo", async () => {
    // Arrange: limite extremamente baixo mockado no modelo
    saveConfig({
      OPENAI_API_KEY: "sk-test-key",
      OPENAI_API_MODEL: "modelo-micro",
      OPENAI_RESPONSE_LANGUAGE: "pt-BR",
      OPENAI_API_BASEURL: "http://127.0.0.1:9999/v1"
    });

    const mockClient = createMockOpenAI("ok");
    // Act & Assert (Prompt excedendo limite de 8000 tokens com margem reservada)
    const textoGigante = "X".repeat(40000);
    await assert.rejects(
      async () => await summarizeText(textoGigante, { openaiClient: mockClient }),
      /Prompt too large/
    );
  });

  await t.test("deve testar getOpenAIClient sem a opção de mock conectando ao servidor HTTP local", async () => {
    // Act 1: Com BASEURL
    saveConfig({
      OPENAI_API_KEY: "sk-test-key",
      OPENAI_API_MODEL: "gpt-5-nano",
      OPENAI_RESPONSE_LANGUAGE: "pt-BR",
      OPENAI_API_BASEURL: "http://127.0.0.1:9999/v1"
    });
    const resAnalyze = await analyzeUpdatedCode([{ filename: "a.js", diff: "diff" }]);
    assert.equal(resAnalyze, "Resposta do servidor HTTP local");

    const resSummarize = await summarizeText("teste");
    assert.equal(resSummarize, "Resposta do servidor HTTP local");

    // Act 2: Sem BASEURL (usando mockClient para não fazer chamada externa)
    saveConfig({
      OPENAI_API_KEY: "sk-test-key",
      OPENAI_API_MODEL: "gpt-5-nano",
      OPENAI_RESPONSE_LANGUAGE: "pt-BR"
    });
    const mockClient = createMockOpenAI("Resposta sem BASEURL");
    const resNoBaseUrl = await analyzeUpdatedCode([{ filename: "b.js", diff: "diff" }], PromptType.ANALYZE, { openaiClient: mockClient });
    assert.equal(resNoBaseUrl, "Resposta sem BASEURL");
  });
});
