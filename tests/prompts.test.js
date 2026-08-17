import { test } from "node:test";
import assert from "node:assert/strict";
import { generateLanguageInstruction, generatePrompt } from "../src/prompts.js";
import { PromptType } from "../src/models.js";

test("prompts.js - Geração de Instruções e Prompts 100% Cobertos (Padrão AAA)", async (t) => {
  await t.test("generateLanguageInstruction deve retornar idioma mapeado ou fallback para English (US)", () => {
    // Arrange & Act
    const resPt = generateLanguageInstruction("pt-BR");
    const resEn = generateLanguageInstruction("en-US");
    const resUnknown = generateLanguageInstruction("de-DE");
    const resUndefined = generateLanguageInstruction(undefined);

    // Assert
    assert.equal(resPt, "Please respond entirely in Portuguese (Brazil).");
    assert.equal(resEn, "Please respond entirely in English (US).");
    assert.equal(resUnknown, "Please respond entirely in English (US).");
    assert.equal(resUndefined, "Please respond entirely in English (US).");
  });

  await t.test("generatePrompt para PromptType.ANALYZE deve incluir instruções de Senior Code Reviewer", () => {
    // Arrange
    const files = [{ filename: "src/index.js", diff: "+ const x = 10;" }];
    const config = { OPENAI_RESPONSE_LANGUAGE: "pt-BR" };

    // Act
    const prompt = generatePrompt(files, PromptType.ANALYZE, config);

    // Assert
    assert.match(prompt, /senior code reviewer/i);
    assert.match(prompt, /src\/index\.js/);
    assert.match(prompt, /Portuguese \(Brazil\)/);
  });

  await t.test("generatePrompt para PromptType.CREATE deve incluir instruções de Commit Message", () => {
    // Arrange
    const files = [{ filename: "package.json", diff: "+ \"version\": \"1.0.0\"" }];
    const config = { OPENAI_RESPONSE_LANGUAGE: "en-US" };

    // Act
    const prompt = generatePrompt(files, PromptType.CREATE, config);

    // Assert
    assert.match(prompt, /commit title and commit message/i);
    assert.match(prompt, /package\.json/);
  });

  await t.test("generatePrompt com tipo inválido deve lançar erro", () => {
    // Arrange
    const files = [];
    const config = { OPENAI_RESPONSE_LANGUAGE: "pt-BR" };

    // Act & Assert
    assert.throws(() => generatePrompt(files, "INVALID_TYPE", config), /Invalid prompt type/);
  });
});
