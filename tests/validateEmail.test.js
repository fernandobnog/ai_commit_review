import { test } from "node:test";
import assert from "node:assert/strict";
import inquirer from "inquirer";
import {
  configBaseUrlLocal,
  configByNTAPPEmail,
  gerarCodigo,
  validarCodigo,
  isFormatoEmailValido,
  emailTemDominioNtapp,
  enviarEmail,
  transporter,
  codigoMap
} from "../src/validateEmail.js";
import { saveConfig, deleteConfigFile } from "../src/config.js";

function setupInquirerMock(answersList = []) {
  let index = 0;
  inquirer.prompt = async (questions) => {
    const list = Array.isArray(questions) ? questions : [questions];
    const current = answersList[index] || {};
    index++;
    const result = {};
    for (const q of list) {
      if (q && q.name && current[q.name] !== undefined) {
        result[q.name] = current[q.name];
      }
    }
    return result;
  };
}

test("validateEmail.js - Cobertura 100% de Validação de E-mail e OTP (Padrão AAA)", async (t) => {
  const originalPrompt = inquirer.prompt;
  const originalSendMail = transporter.sendMail;

  t.beforeEach(() => {
    codigoMap.clear();
    saveConfig({
      OPENAI_API_KEY: "sk-test-key",
      OPENAI_API_MODEL: "gpt-5-nano",
      OPENAI_RESPONSE_LANGUAGE: "pt-BR",
      OPENAI_API_BASEURL: "https://api.openai.com/v1"
    });
  });

  t.afterEach(() => {
    deleteConfigFile();
    codigoMap.clear();
    inquirer.prompt = originalPrompt;
    transporter.sendMail = originalSendMail;
  });

  await t.test("gerarCodigo deve retornar prefixo único de hash", () => {
    // Act
    const code1 = gerarCodigo();
    const code2 = gerarCodigo();

    // Assert
    assert.equal(typeof code1, "string");
    assert.ok(code1.length > 0);
    assert.notEqual(code1, code2);
  });

  await t.test("isFormatoEmailValido deve identificar emails válidos e inválidos", () => {
    // Assert
    assert.equal(isFormatoEmailValido("usuario@dominio.com.br"), true);
    assert.equal(isFormatoEmailValido("invalido_sem_arroba"), false);
    assert.equal(isFormatoEmailValido(""), false);
  });

  await t.test("emailTemDominioNtapp deve reconhecer dominios corporativos autorizados", () => {
    // Assert
    assert.equal(emailTemDominioNtapp("dev@ntapp.com.br"), true);
    assert.equal(emailTemDominioNtapp("advogado@ntadvogados.com.br"), true);
    assert.equal(emailTemDominioNtapp("usuario@gmail.com"), false);
  });

  await t.test("validarCodigo deve tratar entradas ausentes, expiradas, incorretas e válidas", () => {
    const email = "teste@ntapp.com.br";

    // Act 1: Entrada inexistente
    assert.equal(validarCodigo("inexistente@ntapp.com.br", "1234"), false);

    // Act 2: Código expirado
    codigoMap.set(email, { code: "1234", expires: Date.now() - 1000 });
    assert.equal(validarCodigo(email, "1234"), false);
    assert.equal(codigoMap.has(email), false);

    // Act 3: Código incorreto
    codigoMap.set(email, { code: "5678", expires: Date.now() + 60000 });
    assert.equal(validarCodigo(email, "9999"), false);

    // Act 4: Código correto
    assert.equal(validarCodigo(email, "5678"), true);
  });

  await t.test("enviarEmail deve chamar transporter.sendMail com as opções configuradas", async () => {
    // Arrange
    let sentOptions = null;
    transporter.sendMail = async (opts) => { sentOptions = opts; };

    // Act
    await enviarEmail("destinatario@ntapp.com.br", "OTP123");

    // Assert
    assert.equal(sentOptions.to, "destinatario@ntapp.com.br");
    assert.match(sentOptions.text, /OTP123/);
  });

  await t.test("configBaseUrlLocal deve retornar true para ambiente local e false para padrão", async () => {
    // Act 1: Confirmando local
    setupInquirerMock([{ isLocal: true }]);
    const resLocal = await configBaseUrlLocal();
    assert.equal(resLocal, true);

    // Act 2: Recusando local
    setupInquirerMock([{ isLocal: false }]);
    const resDefault = await configBaseUrlLocal();
    assert.equal(resDefault, false);
  });

  await t.test("configByNTAPPEmail deve cobrir todos os fluxos de prompt, domínios e envio", async () => {
    // Act 1: Cliente não pertence à NTapp
    setupInquirerMock([{ isNTapp: false }]);
    const resNaoNTapp = await configByNTAPPEmail();
    assert.equal(resNaoNTapp, false);

    // Act 2: Email com domínio inválido e recusa de nova tentativa
    setupInquirerMock([
      { isNTapp: true },
      { inputEmail: "outro@gmail.com" },
      { tentarNovamente: false }
    ]);
    const resDominioRecusado = await configByNTAPPEmail();
    assert.equal(resDominioRecusado, false);

    // Act 3: Email inválido formatado -> email fora do domínio aceito -> tenta novamente -> email válido -> falha no envio de email
    transporter.sendMail = async () => { throw new Error("SMTP Auth Failure"); };
    setupInquirerMock([
      { isNTapp: true },
      { inputEmail: "invalido_sem_formato" },
      { inputEmail: "fora@gmail.com" },
      { tentarNovamente: true },
      { inputEmail: "sucesso@ntapp.com.br" }
    ]);
    const resEmailFail = await configByNTAPPEmail();
    assert.equal(resEmailFail, false);

    // Act 4: Sucesso completo com validação de código correto
    transporter.sendMail = async () => {};
    setupInquirerMock([
      { isNTapp: true },
      { inputEmail: "sucesso@ntapp.com.br" },
      { codigoUsuario: "MOCK_CODE" }
    ]);
    // Força código mock no codigoMap ao rodar processNtappValidation
    const promptProxy = inquirer.prompt;
    inquirer.prompt = async (questions) => {
      const res = await promptProxy(questions);
      // Se for a pergunta do código, pega o código gerado no map
      if (questions[0] && questions[0].name === "codigoUsuario") {
        const entry = codigoMap.get("sucesso@ntapp.com.br");
        if (entry) res.codigoUsuario = entry.code;
      }
      return res;
    };

    const resSucesso = await configByNTAPPEmail();
    assert.equal(resSucesso, true);

    // Act 5: Código incorreto digitado pelo usuário
    transporter.sendMail = async () => {};
    setupInquirerMock([
      { isNTapp: true },
      { inputEmail: "sucesso@ntapp.com.br" },
      { codigoUsuario: "CODIGO_ERRADO" }
    ]);
    const resCodigoErrado = await configByNTAPPEmail();
    assert.equal(resCodigoErrado, false);
  });
});
