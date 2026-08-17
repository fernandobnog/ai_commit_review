# 📄 Documentação do Módulo: `src/validateEmail.js`

## 📌 Visão Geral
O módulo `src/validateEmail.js` gerencia o fluxo de verificação para execução de modelos locais de IA (LM Studio / Ollama) e o processo de validação por e-mail institucional para clientes NTApp, incluindo a geração de código OTP temporário enviado via SMTP.

---

## 🛠️ Dependências e Importações

### Dependências Externas
- `inquirer`: Prompts interativos de confirmação e entrada de texto.
- `nodemailer`: Envio de e-mails de validação via protocolo SMTP.
- `chalk`: Formatação de saídas coloridas no terminal.
- `uuid`: Geração de identificador único (`v4 as uuidv4`).

### Módulos Internos Importados
- [`src/configManager.js`](file:///d:/GitHub/ai_commit_review/src/configManager.js): `setApiKeyOpenAINTapp`.

---

## 📧 Configuração SMTP e Variáveis de Ambiente Exigidas

O envio de e-mails exige as seguintes variáveis de ambiente configuradas no sistema:
- `SMTP_HOST`: Host do servidor SMTP.
- `SMTP_PORT`: Porta do servidor SMTP.
- `SMTP_USER`: Usuário de autenticação SMTP.
- `SMTP_PASS`: Senha de autenticação SMTP.
- `FROM_EMAIL`: Endereço de e-mail remetente padrão.

---

## 🔐 Regras de Domínio e Código OTP

1. **Domínios Válidos**:
   - Apenas e-mails terminados em `@ntapp.com.br` ou `@ntadvogados.com.br` são aceitos.
2. **Geração do Código**:
   - Obtido a partir da primeira seção do UUID (`uuidv4().split("-")[0]`).
3. **Validade**:
   - Armazenado em um `Map` em memória (`codigoMap`) com expiração fixada em **10 minutos**.

---

## 🔄 Funções Exportadas

### `configBaseUrlLocal()`
- **Descrição**: Pergunta interativamente ao usuário se o modelo de IA está executando localmente (`Is the AI model running locally?`).
- **Retorno**: `Promise<boolean>` (`true` se o usuário confirmar que a IA é local; `false` caso contrário).

### `configByNTAPPEmail()`
- **Descrição**: Executa o fluxo de validação para clientes NTApp.
- **Fluxo**:
  1. Pergunta ao usuário se o cliente pertence à NTApp (`Does this client belong to NTapp?`).
  2. Solicita um e-mail válido com domínio `@ntapp.com.br` ou `@ntadvogados.com.br`.
  3. Gera o código OTP e armazena no `Map` com expiração de 10 minutos.
  4. Envia o código via `nodemailer`.
  5. Solicita ao usuário o código recebido no e-mail.
  6. Se o código for válido, executa `setApiKeyOpenAINTapp()` para salvar a chave de API institucional e retorna `true`.
  7. Se inválido ou em caso de erro no envio do e-mail, retorna `false`.
