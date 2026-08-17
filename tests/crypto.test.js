process.env.PASSWORD_CRYPTO_KEY = "segredo_teste_key";

import { test } from "node:test";
import assert from "node:assert/strict";
import { criptografar, decriptografar, criptografarcli, obterChave, resetChave } from "../src/crypto.js";

test("crypto.js - Cobertura 100% de Criptografia e CLI (Padrão AAA)", async (t) => {
  await t.test("obterChave deve obter chave da variavel de ambiente e resetChave deve limpar", () => {
    resetChave();
    const chave1 = obterChave();
    assert.ok(Buffer.isBuffer(chave1));
    assert.equal(chave1.length, 32);

    resetChave();
    delete process.env.PASSWORD_CRYPTO_KEY;
    const chaveFallback = obterChave();
    assert.ok(Buffer.isBuffer(chaveFallback));
    process.env.PASSWORD_CRYPTO_KEY = "segredo_teste_key";
    resetChave();
  });

  await t.test("criptografar e decriptografar devem ser idempotentes de ida e volta", () => {
    const textoOriginal = "SenhaSuperSecreta123!";
    const textoCriptografado = criptografar(textoOriginal);
    assert.notEqual(textoCriptografado, textoOriginal);

    const textoDecriptografado = decriptografar(textoCriptografado);
    assert.equal(textoDecriptografado, textoOriginal);
  });

  await t.test("criptografarcli deve processar opções Encrypt, Decrypt e erros", async () => {
    // Act 1: Encrypt
    const mockPromptEncrypt = async () => ({ acao: "Encrypt", texto: "Teste123" });
    const resEncrypt = await criptografarcli(mockPromptEncrypt);
    assert.ok(resEncrypt);

    // Act 2: Decrypt válido
    const criptoValido = criptografar("TextoTeste");
    const mockPromptDecrypt = async () => ({ acao: "Decrypt", texto: criptoValido });
    const resDecrypt = await criptografarcli(mockPromptDecrypt);
    assert.equal(resDecrypt, "TextoTeste");

    // Act 3: Decrypt inválido
    const mockPromptInvalid = async () => ({ acao: "Decrypt", texto: "texto_invalido_hex" });
    const resInvalid = await criptografarcli(mockPromptInvalid);
    assert.equal(resInvalid, null);

    // Act 4: Exceção no prompt
    const mockPromptError = async () => { throw new Error("Erro no prompt"); };
    await assert.rejects(async () => await criptografarcli(mockPromptError), /Erro no prompt/);
  });
});
