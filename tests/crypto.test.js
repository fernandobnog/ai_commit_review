import { test } from "node:test";
import assert from "node:assert/strict";
import inquirer from "inquirer";
import { criptografar, decriptografar, criptografarcli, resetChave } from "../src/crypto.js";

test("crypto.js - Cobertura 100% de Criptografia AES-256-CBC (Padrão AAA)", async (t) => {
  await t.test("deve lançar erro se PASSWORD_CRYPTO_KEY não estiver definida", () => {
    // Arrange
    const originalEnv = process.env.PASSWORD_CRYPTO_KEY;
    delete process.env.PASSWORD_CRYPTO_KEY;
    resetChave();

    // Act & Assert
    assert.throws(
      () => decriptografar("dado_qualquer"),
      /PASSWORD_CRYPTO_KEY environment variable is not defined/
    );

    // Cleanup
    process.env.PASSWORD_CRYPTO_KEY = originalEnv;
    resetChave();
  });

  await t.test("deve criptografar e decriptografar texto em round-trip com sucesso", () => {
    // Arrange
    process.env.PASSWORD_CRYPTO_KEY = "segredo_para_teste_unitario";
    const textoOriginal = "Mensagem Secreta 123 !@#";

    // Act
    const cifrado = criptografar(textoOriginal);
    const decifrado = decriptografar(cifrado);

    // Assert
    assert.notEqual(cifrado, textoOriginal);
    assert.equal(decifrado, textoOriginal);
  });

  await t.test("deve decriptografar texto legado sem IV (retrocompatibilidade) com sucesso", () => {
    // Arrange
    process.env.PASSWORD_CRYPTO_KEY = "segredo_para_teste_unitario";
    const legacyCipher = "0a7ed6ea56f0cd14a159382f61cb20e655f5dcd95e06a060ee02f92ea2667e5331ce5593cf0fdaaca35500be2253267f";

    // Act
    const decifrado = decriptografar(legacyCipher);

    // Assert
    assert.equal(decifrado, "Teste CLI");
  });

  await t.test("deve tratar erro ao tentar decriptografar string hex inválida", () => {
    // Arrange
    process.env.PASSWORD_CRYPTO_KEY = "segredo_para_teste_unitario";

    // Act & Assert
    assert.throws(() => decriptografar("hex_invalido_12345"));
  });

  await t.test("criptografarcli deve executar opções de Encrypt, Decrypt e erro no catch via inquirer mock", async () => {
    // Arrange
    process.env.PASSWORD_CRYPTO_KEY = "segredo_para_teste_unitario";
    const originalPrompt = inquirer.prompt;

    // Act 1: Encrypt
    inquirer.prompt = async () => ({ acao: "Encrypt", texto: "Teste CLI" });
    await criptografarcli();

    // Act 2: Decrypt
    const cifrado = criptografar("Teste CLI");
    inquirer.prompt = async () => ({ acao: "Decrypt", texto: cifrado });
    await criptografarcli();

    // Act 3: Decrypt Inválido
    inquirer.prompt = async () => ({ acao: "Decrypt", texto: "invalido" });
    await criptografarcli();

    // Act 4: Rejeição no Inquirer (Catch block)
    inquirer.prompt = () => Promise.reject(new Error("Prompt Error Test"));
    await assert.rejects(async () => await criptografarcli(), /Prompt Error Test/);

    // Cleanup
    inquirer.prompt = originalPrompt;
  });
});
