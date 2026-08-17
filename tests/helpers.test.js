import { test } from "node:test";
import assert from "node:assert/strict";
import { showHelp } from "../src/helpers.js";

test("helpers.js - Exibição de Ajuda (Padrão AAA)", async (t) => {
  await t.test("showHelp deve retornar string contendo todas as seções obrigatórias", () => {
    // Arrange & Act
    const helpOutput = showHelp();

    // Assert
    assert.equal(typeof helpOutput, "string");
    assert.match(helpOutput, /Usage:/);
    assert.match(helpOutput, /Description:/);
    assert.match(helpOutput, /Required Variables:/);
    assert.match(helpOutput, /Commands:/);
    assert.match(helpOutput, /Examples:/);
    assert.match(helpOutput, /Tips:/);
    assert.match(helpOutput, /OPENAI_API_KEY/);
  });
});
