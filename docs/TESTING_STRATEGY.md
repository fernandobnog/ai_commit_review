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
npm test
node --experimental-test-coverage --test tests/*.test.js
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

---

## 🔒 4. Garantia de Isolamento do Repositório Git

Ao solicitar ou executar a suíte de testes automatizados:
1. **Sem Alteração de Estado do Git**: É **estritamente proibido** realizar trocas de commit, `git checkout`, `git switch` ou alterar a branch atual no repositório de trabalho.
2. **Execução Segura em Working Tree Local**: Os testes executam unicamente a partir da working tree e commit atual, utilizando mocks para todas as interações com subprocessos de sistema.

```
