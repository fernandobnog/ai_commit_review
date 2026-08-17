# ⚠️ Inventário de Débitos Técnicos e Riscos: `ai-commit-review`

Este documento registra os débitos técnicos, estouro de métricas de código, acoplamentos e riscos de segurança identificados durante a auditoria minuciosa do repositório.

---

## 📏 1. Métricas de Código e Estouro de Limites

### 📄 Arquivos que Excedem o Limite de 250 Linhas
| Arquivo | Total de Linhas | Motivo do Estouro | Ação de Refatoração Recomendada |
| :--- | :---: | :--- | :--- |
| [`src/gitUtils.js`](file:///d:/GitHub/ai_commit_review/src/gitUtils.js) | **506** | Acúmulo de todas as operações de Git e GitHub CLI em um único arquivo. | Modularizar em `gitCore.js`, `gitBranch.js` e `githubCli.js`. |
| [`src/createCommit.js`](file:///d:/GitHub/ai_commit_review/src/createCommit.js) | **337** | Mistura de fluxo de staging, prompts interativos e envio de commit. | Extrair etapas interativas para handlers utilitários. |
| [`src/commitStaged.js`](file:///d:/GitHub/ai_commit_review/src/commitStaged.js) | **328** | Duplicação do fluxo de staging e prompts de confirmação. | Unificar com `createCommit.js` usando estratégias compartilhadas. |
| [`src/openaiUtils.js`](file:///d:/GitHub/ai_commit_review/src/openaiUtils.js) | **282** | Prompts de IA extensos mantidos em strings hardcoded no código. | Extrair os templates de prompt para arquivos Markdown/JSON externos. |

### 🧩 Funções que Ultrapassam 30 Linhas
| Arquivo | Função | Linhas Aprox. | Problema Identificado |
| :--- | :--- | :---: | :--- |
| [`src/createCommit.js`](file:///d:/GitHub/ai_commit_review/src/createCommit.js) | `createCommit()` | ~150 | Acúmulo de múltiplos passos do fluxo interativo em um bloco único. |
| [`src/commitStaged.js`](file:///d:/GitHub/ai_commit_review/src/commitStaged.js) | `commitStaged()` | ~140 | Sequência longa de validações, prompts e comandos Git. |
| [`src/openaiUtils.js`](file:///d:/GitHub/ai_commit_review/src/openaiUtils.js) | `generatePrompt()` | ~140 | Construção inline de prompts extensos com interpolação complexa. |
| [`src/productionServerUpdate.js`](file:///d:/GitHub/ai_commit_review/src/productionServerUpdate.js) | `updateServerToProduction()` | ~90 | Múltiplos prompts em cadeia e execuções diretas de comandos Git. |
| [`src/testServerUpdate.js`](file:///d:/GitHub/ai_commit_review/src/testServerUpdate.js) | `dockerCheck()` | ~78 | Varredura de diretórios Docker combinada com prompts interativos. |
| [`src/analyzeCommit.js`](file:///d:/GitHub/ai_commit_review/src/analyzeCommit.js) | `selectCommits()` | ~60 | Controle de paginação de terminal e acúmulo de seleções. |
| [`src/validateEmail.js`](file:///d:/GitHub/ai_commit_review/src/validateEmail.js) | `sendNotificationEmail()` | ~50 | Configuração e disparo de Nodemailer misturado com tratamento de erro de UI. |

---

## 🔗 2. Duplicação de Código e Alto Acoplamento

1. **Duplicação entre `createCommit.js` e `commitStaged.js`**:
   - Ambos os módulos reimplementam a lógica de verificação de branch, resolução de conflitos, staging, abertura de editor para mensagem de commit e `git push`.
2. **Duplicação nos Módulos de Servidor (`testServerUpdate.js` / `productionServerUpdate.js`)**:
   - Sequências idênticas de checkout de branch, merge, verificações de `git status --porcelain` e mensagens de confirmação visual.
3. **Acoplamento de Controle de Processo (`process.exit`)**:
   - Funções utilitárias e secundárias (como `dockerCheck`, `validateEmail` e `executeGitCommand`) invocam `process.exit(0)` ou `process.exit(1)` diretamente no meio da execução.
   - **Risco**: Impede o reúso dos módulos em contextos não-CLI ou em suítes de testes unitários.

---

## 🛡️ 3. Brechas de Segurança e Vulnerabilidades

> [!WARNING]
> **1. Risco de Injeção de Comandos (Command Injection)**:
> O módulo [`src/gitUtils.js`](file:///d:/GitHub/ai_commit_review/src/gitUtils.js) utiliza `execSync` com interpolação direta de strings para comandos de terminal (ex: `execSync("git merge --no-ff " + branch)` ou `execSync("gh pr create --title \"" + title + "\"")`). Se um parâmetro contiver caracteres como `;`, `&&` ou `$()`, comandos arbitrários do sistema operacional podem ser executados.

> [!CAUTION]
> **2. Exposição de Credenciais no Repositório**:
> O arquivo [`.env.develop`](file:///d:/GitHub/ai_commit_review/.env.develop) armazena uma senha real de servidor SMTP (`SMTP_PASS = "Md?4@#VN3QAy8Pr3XfyCD2Yf"`), conta de e-mail e chave de criptografia estática. Por padrão, o Webpack embutirá essas variáveis no bundle de produção (`dist/bundle.cjs`) caso o arquivo `.env` não exista no ambiente do usuário.

> [!IMPORTANT]
> **3. Ausência de Sanitização de Entradas**:
> Mensagens de commit e entradas de texto do usuário via `inquirer` são passadas diretamente para a API da OpenAI e para comandos Git sem higienização prvia contra caracteres especiais ou scripts maliciosos.

---

## 🧪 4. Cobertura de Testes Automatizados

- **Status Atual**: **0% de Cobertura de Testes** (nenhum arquivo `.test.js` ou `.spec.js` no repositório).
- **Inexistência de Framework**: O manifesto [`package.json`](file:///d:/GitHub/ai_commit_review/package.json) não possui bibliotecas de teste instaladas (`jest`, `vitest` ou `mocha`).
- **Falta de Mocks de Sistema**: Não há abstrações para isolar chamadas de sistema de arquivos (`fs`), execução de comandos Git (`execSync`) e requisições HTTP à API OpenAI durante a validação.
