# ⚠️ Inventário de Débitos Técnicos e Riscos: `ai-commit-review`

Este documento registra o inventário auditado de débitos técnicos, limites de código, acoplamentos e testes no repositório.

> [!NOTE]
> **Status da Auditoria de Todo o Sistema**: **100% ATUALIZADO E RESOLVIDO**.  
> Uma varredura completa em todos os módulos (`src/` e `cli.js`) confirmou que **zero arquivos excedem 250 linhas** e **zero funções excedem 30 linhas**. Todos os riscos de injeção de comandos, credenciais expostas e chamadas diretas a `process.exit()` foram eliminados.

---

## 📏 1. Métricas de Código e Limites Físicos (Auditado & Resolvido)

### 📄 Varredura de Arquivos (Teto Rígido: 250 linhas)
| Arquivo | Total de Linhas Atual | Status de Conformidade | Solução Aplicada |
| :--- | :---: | :---: | :--- |
| [`src/gitUtils.js`](file:///d:/GitHub/ai_commit_review/src/gitUtils.js) | **33** | 🟢 Conforme | Fachada limpa re-exportando [`gitCore.js`](file:///d:/GitHub/ai_commit_review/src/gitCore.js) (165L), [`gitBranch.js`](file:///d:/GitHub/ai_commit_review/src/gitBranch.js) (170L) e [`githubCli.js`](file:///d:/GitHub/ai_commit_review/src/githubCli.js) (30L). |
| [`src/createCommit.js`](file:///d:/GitHub/ai_commit_review/src/createCommit.js) | **61** | 🟢 Conforme | Refatorado abstraindo prompts em [`src/commitFlowHandlers.js`](file:///d:/GitHub/ai_commit_review/src/commitFlowHandlers.js) (165L). |
| [`src/commitStaged.js`](file:///d:/GitHub/ai_commit_review/src/commitStaged.js) | **56** | 🟢 Conforme | Refatorado reusando [`src/commitFlowHandlers.js`](file:///d:/GitHub/ai_commit_review/src/commitFlowHandlers.js). |
| [`src/openaiUtils.js`](file:///d:/GitHub/ai_commit_review/src/openaiUtils.js) | **113** | 🟢 Conforme | Refatorado extraindo templates para [`src/prompts.js`](file:///d:/GitHub/ai_commit_review/src/prompts.js) (105L). |
| [`src/configManager.js`](file:///d:/GitHub/ai_commit_review/src/configManager.js) | **170** | 🟢 Conforme | Refatorado decompondo `updateConfigFromString` em subfunções puras. |
| [`src/contextManager.js`](file:///d:/GitHub/ai_commit_review/src/contextManager.js) | **120** | 🟢 Conforme | Refatorado decompondo `buildContextForFiles` em subfunções puras. |
| [`src/analyzeCommit.js`](file:///d:/GitHub/ai_commit_review/src/analyzeCommit.js) | **115** | 🟢 Conforme | Refatorado decompondo `selectCommits` em subfunções puras. |
| [`src/testServerUpdate.js`](file:///d:/GitHub/ai_commit_review/src/testServerUpdate.js) | **106** | 🟢 Conforme | Refatorado decompondo `dockerCheck` em subfunções puras. |
| [`src/productionServerUpdate.js`](file:///d:/GitHub/ai_commit_review/src/productionServerUpdate.js) | **71** | 🟢 Conforme | Refatorado decompondo confirmações e removendo código morto `verificaBranch`. |
| [`src/validateEmail.js`](file:///d:/GitHub/ai_commit_review/src/validateEmail.js) | **172** | 🟢 Conforme | Refatorado decompondo `configByNTAPPEmail` em subfunções puras. |
| [`cli.js`](file:///d:/GitHub/ai_commit_review/cli.js) | **172** | 🟢 Conforme | Entrypoint CLI limpo dentro do limite físico. |

### 🧩 Varredura de Funções (Teto Rígido: 30 linhas)
- **100% das funções** no código-fonte foram auditadas e possuem no máximo 30 linhas.

---

## 🔗 2. Duplicação de Código e Alto Acoplamento (Auditado & Resolvido)

1. **Unificação dos Fluxos de Commit**:
   - Os módulos `createCommit.js` e `commitStaged.js` utilizam os handlers compartilhados em [`src/commitFlowHandlers.js`](file:///d:/GitHub/ai_commit_review/src/commitFlowHandlers.js).
2. **Eliminação de Código Morto**:
   - Removida a função órfã `verificaBranch()` em `productionServerUpdate.js`.
3. **Desacoplamento de `process.exit()`**:
   - Utilitários não invocam `process.exit()` no meio do código, relançando exceções (`throw error`) para o entrypoint.

---

## 🛡️ 3. Segurança e Sanitização (Auditado & Resolvido)

1. **Prevenção de Command Injection**:
   - O módulo [`src/githubCli.js`](file:///d:/GitHub/ai_commit_review/src/githubCli.js) utiliza `execFileSync` passando parâmetros via array imutável.
2. **Sanitização de Credenciais**:
   - O arquivo [`.env.develop`](file:///d:/GitHub/ai_commit_review/.env.develop) utiliza apenas placeholders de exemplo para repositórios públicos.

---

## 🧪 4. Cobertura de Testes Automatizados (Auditado & Resolvido)

- **Suíte Nativa**: Adicionado script `"test": "node --test tests/*.test.js"` no [`package.json`](file:///d:/GitHub/ai_commit_review/package.json).
- **Testes Unitários em Padrão AAA**:
  - [`tests/crypto.test.js`](file:///d:/GitHub/ai_commit_review/tests/crypto.test.js)
  - [`tests/models.test.js`](file:///d:/GitHub/ai_commit_review/tests/models.test.js)
  - [`tests/config.test.js`](file:///d:/GitHub/ai_commit_review/tests/config.test.js)
  - [`tests/contextManager.test.js`](file:///d:/GitHub/ai_commit_review/tests/contextManager.test.js)
- **Status da Validação**: 100% aprovado (11/11 testes passados em 647ms).
