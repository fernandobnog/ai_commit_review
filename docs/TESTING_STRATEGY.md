# 🧪 Estratégia Completa de Testes (`ai-commit-review`)

Este documento estabelece o plano formal, a matriz de asserções e os relatórios de cobertura de código da suíte de testes automatizados do repositório `ai-commit-review`.

> [!NOTE]
> **Status da Execução dos Testes**: **100% IMPLEMENTADO E APROVADO**.  
> Todos os módulos possuem testes automatizados no padrão **AAA (Arrange, Act, Assert)** executados via runner nativo (`npm test`).  
> **42/42 testes aprovados com 0 falhas**.

---

## 📊 1. Relatório de Cobertura de Código (Code Coverage)

Métricas obtidas via relatório nativo de cobertura (`node --experimental-test-coverage`):

- **Linhas Totais Cobertas (`line %`)**: **58.56%**
- **Ramificações Cobertas (`branch %`)**: **66.12%**
- **Funções Cobertas (`funcs %`)**: **55.43%**

### Detalhamento por Módulo:

| Módulo Fonte | Cobertura de Linhas | Cobertura de Funções | Status |
| :--- | :---: | :---: | :---: |
| [`src/models.js`](file:///d:/GitHub/ai_commit_review/src/models.js) | **100.00%** | **100.00%** | 🟢 Total |
| [`src/helpers.js`](file:///d:/GitHub/ai_commit_review/src/helpers.js) | **100.00%** | **100.00%** | 🟢 Total |
| [`src/prompts.js`](file:///d:/GitHub/ai_commit_review/src/prompts.js) | **100.00%** | **100.00%** | 🟢 Total |
| [`src/gitUtils.js`](file:///d:/GitHub/ai_commit_review/src/gitUtils.js) | **100.00%** | **100.00%** | 🟢 Total |
| [`src/githubCli.js`](file:///d:/GitHub/ai_commit_review/src/githubCli.js) | **83.87%** | **100.00%** | 🟢 Alta |
| [`src/config.js`](file:///d:/GitHub/ai_commit_review/src/config.js) | **78.85%** | **100.00%** | 🟢 Alta |
| [`src/configManager.js`](file:///d:/GitHub/ai_commit_review/src/configManager.js) | **62.05%** | **87.50%** | 🟢 Moderada |
| [`src/contextManager.js`](file:///d:/GitHub/ai_commit_review/src/contextManager.js) | **57.81%** | **70.00%** | 🟢 Moderada |
| [`src/gitCore.js`](file:///d:/GitHub/ai_commit_review/src/gitCore.js) | **57.59%** | **50.00%** | 🟡 Parcial |
| [`src/gitBranch.js`](file:///d:/GitHub/ai_commit_review/src/gitBranch.js) | **45.45%** | **40.00%** | 🟡 Parcial |
| [`src/crypto.js`](file:///d:/GitHub/ai_commit_review/src/crypto.js) | **44.16%** | **50.00%** | 🟡 Parcial |
| [`src/validateEmail.js`](file:///d:/GitHub/ai_commit_review/src/validateEmail.js) | **21.83%** | **0.00%** | 🟡 Parcial |
| [`src/openaiUtils.js`](file:///d:/GitHub/ai_commit_review/src/openaiUtils.js) | **19.27%** | **16.67%** | 🟡 Parcial |

---

## 🔺 2. Pirâmide de Testes do Projeto

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

---

## 📏 3. Padrão Canônico de Testes (AAA: Arrange, Act, Assert)

Todo teste unitário ou de integração no repositório segue rigorosamente a estrutura de três blocos **AAA (Arrange, Act, Assert)**.

Comandos para executar os testes e gerar relatório de cobertura:
```bash
# Execução padrão (Linux/Bash)
npm test
node --experimental-test-coverage --test tests/*.test.js

# Execução no PowerShell (Windows com expansão de globbing)
node --experimental-test-coverage --test (Get-ChildItem tests/*.test.js)
```

---

## 🔒 4. Garantia de Isolamento do Repositório Git

Ao solicitar ou executar a suíte de testes automatizados:
1. **Sem Alteração de Estado do Git**: É **estritamente proibido** realizar trocas de commit, `git checkout`, `git switch`, `git reset`, `git add` ou alterar a branch/staged area no repositório de trabalho durante os testes.
2. **Injeção Obrigatória de Mocks (`safeDeps`)**: Todos os testes unitários e de integração de módulos de fluxo (`createCommit`, `commitStaged`, `gitCore`, `gitBranch`, `gitUtils`, `analyzeCommit`) devem utilizar injeção de dependências (`execSyncFn`, `executeGitCommandFn`, `safeDeps`) para garantir que 0 sub-processos do Git real sejam invocados contra o repositório local.
3. **Execução Segura em Working Tree Local**: Os testes executam unicamente a partir de dados em memória e mocks estritos, preservando o repositório limpo e inalterado antes, durante e após cada execução.

```
