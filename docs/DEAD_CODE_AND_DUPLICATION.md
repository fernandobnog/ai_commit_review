# 🧹 Inventário de Limpeza: Código Morto e Duplicações (`DRY`)

Este documento consolida a análise estática detalhada realizada sobre a base de código do `ai-commit-review`, identificando elementos em desuso, inconsistências de enums, trechos mortos e violações do princípio **DRY (Don't Repeat Yourself)**.

> [!NOTE]
> **Status da Auditoria de Código Morto e DRY**: **100% ATUALIZADO E RESOLVIDO**.  
> Todas as duplicações de código entre comandos, instaciação do SDK OpenAI, correções de enums em `models.js` e a lógica de bypass na CLI foram corrigidas e validadas.

---

## 💀 1. Métodos, Variáveis e Funções em Desuso (Auditado & Resolvido)

### 1.1 `verificaBranch()` em `src/productionServerUpdate.js` (RESOLVIDO)
- **Ação Aplicada**: Função removida do repositório. O fluxo utiliza a validação direta de branch sem manter código órfão.

### 1.2 Remoção do Enum `DEEPSEEK_LOCAL` e Padronização no Modelo OpenAI 20B (RESOLVIDO)
- **Ação Aplicada**: Removida a chave `DEEPSEEK_LOCAL` de `src/models.js` e substituída a configuração do servidor local por `OpenAIModels.OSS_20B_LOCAL` (`"openai/gpt-oss-20b"`) em [`src/configManager.js`](file:///d:/GitHub/ai_commit_review/src/configManager.js).

### 1.3 Lógica Condicional de Bypass em `cli.js` (RESOLVIDO)
- **Ação Aplicada**: Corrigido o operador lógico de `||` para `&&` na linha 53 de [`cli.js`](file:///d:/GitHub/ai_commit_review/cli.js):
  `if (!process.argv.includes("set_config") && !process.argv.includes("crypto")) { await ensureValidApiKey(); }`

---

## 🔁 2. Código Duplicado e Violações de DRY (Auditado & Resolvido)

### 2.1 Duplicação entre `createCommit.js` e `commitStaged.js` (RESOLVIDO)
- **Ação Aplicada**: Criado o módulo centralizador [`src/commitFlowHandlers.js`](file:///d:/GitHub/ai_commit_review/src/commitFlowHandlers.js). Os fluxos de confirmação de branch, verificação de conflitos, input/edição em editor temporário da mensagem de commit e confirmação de push foram 100% unificados.
- **Redução**:
  - `createCommit.js`: Reduzido de 337 para 61 linhas.
  - `commitStaged.js`: Reduzido de 328 para 56 linhas.

### 2.2 Instanciação Redundante do Cliente SDK OpenAI (RESOLVIDO)
- **Ação Aplicada**: Criada a fábrica auxiliar `createOpenAIInstance(config)` em [`src/openaiUtils.js`](file:///d:/GitHub/ai_commit_review/src/openaiUtils.js), eliminando duplicações na criação do cliente SDK.

### 2.3 Operações de Checkout e Pull de Branch Git (RESOLVIDO)
- **Ação Aplicada**: Unificadas as trocas de branch no submódulo [`src/gitBranch.js`](file:///d:/GitHub/ai_commit_review/src/gitBranch.js) usando `switchBranch()` e `mergeBranch()`.
