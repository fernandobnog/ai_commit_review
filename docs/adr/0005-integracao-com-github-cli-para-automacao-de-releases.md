# [ADR-0005] Delegação de Fluxos de Release e PR para o GitHub CLI (`gh`)

* **Status:** Aceito
* **Data / Versão:** Histórico / Inicial
* **Decisores / Contexto:** `src/gitUtils.js`, `src/productionServerUpdate.js`

---

## 1. Contexto e Declaração do Problema
O comando `acr updateProductionServer` automatiza o fluxo de promoção de código do ambiente de teste (`teste`) para produção (`master`).
Como parte desse fluxo, o sistema precisa:
1. Criar um Pull Request oficial no GitHub.
2. Definir branches de origem e destino (`teste` -> `master`).
3. Atribuir o revisor técnico responsável (`fernandobnog`).

Integrar uma SDK completa da API REST/GraphQL do GitHub (como Octokit) exigiria gerenciar tokens OAuth pessoais (PATs), scopes de permissão, fluxos de login no navegador e renovação de tokens dentro da CLI.

---

## 2. Decisão Arquitetural Adotada
Decidiu-se **delegar a criação de Pull Requests para a CLI oficial do GitHub (`gh`)** instalada no sistema operacional host do desenvolvedor.

### Detalhes de Implementação:
- [`src/gitUtils.js`](file:///d:/GitHub/ai_commit_review/src/gitUtils.js) (função `createPullRequest`) executa uma verificação prévia de presença do binário com `gh --version`.
- A abertura do PR é realizada invocando o comando `gh pr create` via subprocesso com os parâmetros `--base`, `--head`, `--title`, `--body` e `--reviewer`.

---

## 3. Consequências e Trade-offs

* **Impactos Positivos (Ganhos):**
  - **Reaproveitamento de Autenticação**: O desenvolvedor utiliza a sessão já autenticada do `gh auth login` na máquina, sem necessidade de digitar tokens adicionais na CLI `acr`.
  - **Redução de Dependências**: Evita adicionar a biblioteca Octokit e dezenas de transitivas ao `package.json`.
* **Impactos Negativos / Débitos Aceitos (Trade-offs):**
  - **Dependência Externa de Software**: O usuário é obrigado a ter o utilitário `gh` instalado no sistema operacional para executar o comando `updateProductionServer`.
* **Diretrizes para Agentes de IA:**
  - Mantenha a verificação de presença do `gh` antes de invocar comandos de Pull Request.
  - Siga a diretriz de segurança de substituir interpolação direta de strings por `execFileSync` com array de argumentos imutáveis.
