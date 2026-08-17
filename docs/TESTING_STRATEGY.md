# 🧪 Estratégia Completa de Testes (`ai-commit-review`)

Este documento estabelece o plano formal e as diretrizes práticas para a implementação da suíte de testes automatizados do repositório `ai-commit-review`.

---

## 🔺 1. Pirâmide de Testes do Projeto

A arquitetura de testes do `ai-commit-review` é estruturada em 4 níveis complementares para garantir rápida execução, alta confiabilidade e cobertura completa dos fluxos de linha de comando.

```
       / \
      /   \     E2E / CLI Integration Tests (Execução real de comandos via binário acr)
     /  N4 \
    /-------\
   /   N3    \   Testes de Contrato (Schemas de Configuração e Payloads OpenAI / npm)
  /-----------\
 /     N2      \  Testes de Integração (Git CLI execution, OpenAI SDK mock, File System)
/---------------\
|      N1       | Testes Unitários (Funções puras, cálculos de contexto, modelos e crypto)
+---------------+
```

### Nível 1: Testes Unitários (N1)
- **Foco**: Funções puras, parsing de strings, enums, transformações de dados e regras de negócio isoladas.
- **Ferramentas Recomendadas**: `vitest` ou `jest` com suporte nativo a ESM.
- **Escopo**: `models.js`, `crypto.js`, `contextManager.js` (chunking/hashing), `helpers.js`, `validateEmail.js` (regex e validações de domínio).
- **Meta de Cobertura**: > 90% das funções utilitárias.

### Nível 2: Testes de Integração (N2)
- **Foco**: Módulos que interagem com o sistema operacional, Git CLI, APIs HTTP externas ou arquivos locais.
- **Ferramentas Recomendadas**: `vitest` com mocks de `child_process`, `fs-extra` e `openai`.
- **Escopo**: `gitUtils.js`, `openaiUtils.js`, `config.js`, `configManager.js`.
- **Meta de Cobertura**: 100% dos caminhos felizes e tratamento de erros de I/O / subprocessos.

### Nível 3: Testes de Contrato (N3)
- **Foco**: Garantir que as estruturas JSON de configuração local (`~/.config.json`), respostas simuladas da API OpenAI e parsing da saída do `npm outdated` sigam os esquemas esperados sem breaking changes.
- **Ferramentas**: Validação via DTOs/Zod ou schemas JSON estáticos.

### Nível 4: Testes E2E / CLI (N4)
- **Foco**: Testar a execução do executável binário (`dist/bundle.cjs` / `cli.js`) em um repositório Git temporário de teste, simulando entradas do usuário (`inquirer`).
- **Ferramentas**: `execa` + stubs de stdin.

---

## 📋 2. Matriz de Casos de Teste por Módulo

Abaixo está o mapeamento detalhado dos testes obrigatórios por módulo do sistema:

| Módulo Fonte | Testes Unitários Obrigatórios (N1) | Testes de Integração & Mocks (N2/N3) | Factories e Stubs |
| :--- | :--- | :--- | :--- |
| [`src/models.js`](file:///d:/GitHub/ai_commit_review/src/models.js) | - Imutabilidade dos objetos congelados (`Object.freeze`).<br>- Mapeamento de chaves `OpenAIModels`, `ModelContextLimits`, `ConfigKeys`. | N/A (Módulo puro). | Factory de `ConfigKeys` mock. |
| [`src/crypto.js`](file:///d:/GitHub/ai_commit_review/src/crypto.js) | - Encriptação e decriptação determinística com chave válida.<br>- Lançamento de erro caso `PASSWORD_CRYPTO_KEY` não esteja definida.<br>- Tratamento de exceção ao tentar decifrar string inválida ou corrompida. | N/A | Mock de `process.env.PASSWORD_CRYPTO_KEY`. |
| [`src/config.js`](file:///d:/GitHub/ai_commit_review/src/config.js) | - Resolução do diretório de configuração por SO (Windows, macOS, Linux).<br>- Garantia de fallback seguro quando o arquivo `.config.json` não existe. | - Leitura e escrita real em diretório temporário isolado (`tmp`).<br>- Exclusão do arquivo via `deleteConfigFile`. | Fixture de `.config.json` válido e inválido. |
| [`src/configManager.js`](file:///d:/GitHub/ai_commit_review/src/configManager.js) | - Parsing de chave-valor na função `updateConfigFromString('KEY=VAL')`.<br>- Validação de modelo de IA e idioma suportado.<br>- Lançamento de erros com mensagens explicativas para chaves inválidas. | - Integração com `loadConfig` e `saveConfig`.<br>- Mock de `inquirer` para prompts interativos (`resetConfig`, `updateValidApiKey`). | Mock de `inquirer.prompt`. |
| [`src/contextManager.js`](file:///d:/GitHub/ai_commit_review/src/contextManager.js) | - Função `chunkText`: divisão exata de strings longas em blocos de tamanho `maxChars`.<br>- Função `hashContent`: geração consistente de MD5.<br>- Verificação do cálculo de limite de tokens (`modelTokenLimit - RESERVED_TOKENS`). | - Integração com o cache local em `.cache/context.json`.<br>- Mock de `summarizeText` do `openaiUtils` para evitar chamadas de API durante o empacotamento do contexto. | Factory de lista de diffs (`files[]`). |
| [`src/gitUtils.js`](file:///d:/GitHub/ai_commit_review/src/gitUtils.js) | - Validação de argumentos em `switchBranch` (rejeitar strings vazias/nulas).<br>- Formatting de datas do Git (`formatGitDate`) e truncamento de strings (`truncateString`). | - Mock de `child_process.execSync` para todas as chamadas Git (`git log`, `git diff`, `git checkout`, `git stash`, `gh pr create`).<br>- Simulação de cenários com e sem conflito de merge. | Stub de retorno para `git log` com delimitador `\x1f`. |
| [`src/openaiUtils.js`](file:///d:/GitHub/ai_commit_review/src/openaiUtils.js) | - Construção de prompts (`generatePrompt`) para os tipos `ANALYZE` e `CREATE`.<br>- Geração de instruções de idioma (`generateLanguageInstruction`). | - Mock do cliente `OpenAI` (`openai.chat.completions.create`).<br>- Simulação de erro 401 (Unauthorized) e disparador de rotação de chave via `updateValidApiKey`. | Mock de resposta de `ChatCompletion`. |
| [`src/validateEmail.js`](file:///d:/GitHub/ai_commit_review/src/validateEmail.js) | - RegEx `isFormatoEmailValido` (formatos aceitos e rejeitados).<br>- Validação de domínio `emailTemDominioNtapp` (`@ntapp.com.br` e `@ntadvogados.com.br`).<br>- Validação de código e expiração no `codigoMap`. | - Mock do transporter de e-mail (`nodemailer.createTransport`).<br>- Interceptação de envio via SMTP. | Factory de e-mail e código OTP. |
| [`src/analyzeCommit.js`](file:///d:/GitHub/ai_commit_review/src/analyzeCommit.js) | - Filtragem de commits selecionados vs opções de controle (`load_more`, `exit`). | - Fluxo de integração entre seleção de commits, extração de diffs via `gitUtils`, sumarização via `contextManager` e envio para OpenAI. | Mock de `inquirer.prompt` com checkboxes. |
| [`src/createCommit.js`](file:///d:/GitHub/ai_commit_review/src/createCommit.js) | - Verificação da criação e exclusão do arquivo temporário `commit_message.txt`. | - Fluxo completo: checkout, pull, verificação de conflitos, staging, geração de mensagem via IA, confirmação e push. | Mock de `inquirer.prompt` e `commitChangesWithEditor`. |
| [`src/commitStaged.js`](file:///d:/GitHub/ai_commit_review/src/commitStaged.js) | - Leitura da mensagem de commit do arquivo temporário em `readCommitMessage`. | - Fluxo de commit apenas para alterações já em staging, integrando com `analyzeUpdatedCode`. | Stub de staged files `getStagedFilesDiffs`. |
| [`src/testServerUpdate.js`](file:///d:/GitHub/ai_commit_review/src/testServerUpdate.js) | - Validação de expressão regular para formato de versão (`yyyy.nn.nnn`). | - Descoberta de pastas `docker/` no sistema de arquivos.<br>- Leitura/escrita no arquivo `versao.txt`. | Fixture de estrutura de diretório `docker/versao.txt`. |
| [`src/productionServerUpdate.js`](file:///d:/GitHub/ai_commit_review/src/productionServerUpdate.js) | - Validação dos nomes fixos das branches de fluxo (`teste` -> `develop` / `master`). | - Integração com `createPullRequest` via GitHub CLI (`gh`).<br>- Interceptação de confirmações do usuário e verificação de working tree limpa. | Stub do status do Git (`git status --porcelain`). |
| [`src/helpers.js`](file:///d:/GitHub/ai_commit_review/src/helpers.js) | - Função `showHelp`: verificação da inclusão de seções obrigatórias (Usage, Commands, Required Variables, Examples, Tips). | N/A | Output string assertion. |
| [`cli.js`](file:///d:/GitHub/ai_commit_review/cli.js) | - Verificação do roteamento de subcomandos (`analyze`, `create`, `commit`, `crypto`, `set_config`, etc.). | - Parsing de argumentos `process.argv`.<br>- Tratamento gracioso de erros globais sem vazar stack trace. | Execa CLI binario mock. |

---

## 📏 3. Padrão Canônico de Testes (AAA: Arrange, Act, Assert)

Todo teste unitário ou de integração no repositório deve seguir rigorosamente a estrutura de três blocos **AAA (Arrange, Act, Assert)** com nomenclaturas descritivas no formato `describe` / `it`.

### Exemplo 1: Teste Unitário Puramente Funcional (`crypto.test.js`)

```javascript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { decriptografar } from "../src/crypto.js";

describe("crypto.js - Decriptação Segura", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("deve decriptografar com sucesso uma string previamente cifrada quando a chave de ambiente estiver definida", () => {
    // 1. ARRANGE (Preparação)
    process.env.PASSWORD_CRYPTO_KEY = "segredo_super_seguro_de_teste";
    const textoCriptografado = "e4a8b79f2c1d3e4f5a6b7c8d9e0f1a2b"; // Mock de payload encriptado

    // 2. ACT (Ação)
    const resultado = decriptografar(textoCriptografado);

    // 3. ASSERT (Validação)
    expect(resultado).toBeDefined();
    expect(typeof resultado).toBe("string");
  });

  it("deve lançar um erro descritivo se PASSWORD_CRYPTO_KEY não estiver presente no ambiente", () => {
    // 1. ARRANGE
    delete process.env.PASSWORD_CRYPTO_KEY;

    // 2. ACT & 3. ASSERT
    expect(() => {
      decriptografar("qualquer_payload");
    }).toThrow("PASSWORD_CRYPTO_KEY environment variable is not defined.");
  });
});
```

### Exemplo 2: Teste de Integração com Mock do Git CLI (`gitUtils.test.js`)

```javascript
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as child_process from "child_process";
import { getCommits } from "../src/gitUtils.js";

vi.mock("child_process");

describe("gitUtils.js - getCommits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve retornar um array formatado de commits a partir da saída bruta do comando git log", () => {
    // 1. ARRANGE
    const mockGitLogOutput = 
      "a1b2c3d4e5f67890\x1f1700000000\x1ffeat: adiciona suporte a LLM local\n" +
      "f0e9d8c7b6a54321\x1f1700003600\x1ffix: corrige vazamento de memória no cache";

    vi.spyOn(child_process, "execSync").mockReturnValue(mockGitLogOutput);

    // 2. ACT
    const commits = getCommits(0, 2);

    // 3. ASSERT
    expect(child_process.execSync).toHaveBeenCalledWith(
      expect.stringContaining('git log --skip=0 -n 2 --pretty=format:"%H\x1f%ct\x1f%s"'),
      expect.any(Object)
    );
    expect(commits).toHaveLength(2);
    expect(commits[0]).toEqual({
      shaFull: "a1b2c3d4e5f67890",
      shaShort: "a1b2c3d",
      date: expect.any(String),
      message: "feat: adiciona suporte a LLM local"
    });
  });
});
```
