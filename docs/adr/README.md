# 🏛️ Registros de Decisões Arquiteturais (`Architecture Decision Records - ADRs`)

Este diretório contém o registro formal de todas as decisões arquiteturais relevantes (ADRs) tomadas no projeto **`ai-commit-review`**. Os ADRs registram o contexto técnico, a solução escolhida, as consequências e as diretrizes imutáveis para desenvolvedores e agentes de Inteligência Artificial.

---

## 📌 Como Propor um Novo ADR

1. Crie um novo arquivo no formato `docs/adr/NNNN-titulo-em-kebab-case.md` incrementando a sequência numérica (ex: `0006-novo-padrao.md`).
2. Utilize rigorosamente o **Template Canônico MADR** disponibilizado abaixo.
3. Submeta o ADR para revisão e atualize a tabela de registro no `docs/adr/README.md` e o índice em `docs/MAP_INDEX.md`.

---

## 📊 Registro Histórico de Decisões Arquiteturais

| Número | Data / Marco | Título da Decisão | Status | Arquivo |
| :---: | :---: | :--- | :---: | :--- |
| **ADR-0001** | Inicial | Adoção de Arquitetura CLI baseada em ES Modules e Webpack Bundle | `Aceito` | [`0001-adocao-de-arquitetura-cli-com-esm-e-webpack.md`](file:///d:/GitHub/ai_commit_review/docs/adr/0001-adocao-de-arquitetura-cli-com-esm-e-webpack.md) |
| **ADR-0002** | Inicial | Persistência Descentralizada Baseada em Arquivos JSON Locais | `Aceito` | [`0002-persistencia-baseada-em-arquivos-json-locais.md`](file:///d:/GitHub/ai_commit_review/docs/adr/0002-persistencia-baseada-em-arquivos-json-locais.md) |
| **ADR-0003** | Inicial | Sumarização de Contexto em Cascata e Chunking para LLMs | `Aceito` | [`0003-sumarizacao-de-contexto-em-cascata-para-llm.md`](file:///d:/GitHub/ai_commit_review/docs/adr/0003-sumarizacao-de-contexto-em-cascata-para-llm.md) |
| **ADR-0004** | Inicial | Criptografia Simétrica AES-256-CBC para Proteção de Credenciais | `Aceito` | [`0004-criptografia-simetrica-aes-256-cbc-para-credenciais.md`](file:///d:/GitHub/ai_commit_review/docs/adr/0004-criptografia-simetrica-aes-256-cbc-para-credenciais.md) |
| **ADR-0005** | Inicial | Delegação de Fluxos de Release e PR para o GitHub CLI (`gh`) | `Aceito` | [`0005-integracao-com-github-cli-para-automacao-de-releases.md`](file:///d:/GitHub/ai_commit_review/docs/adr/0005-integracao-com-github-cli-para-automacao-de-releases.md) |

---

## 📝 Template Canônico de Novo ADR (MADR Simplificado)

```markdown
# [ADR-NNNN] [Título Curto e Imperativo da Decisão]

* **Status:** [Aceito | Proposto | Substituído por ADR-XXXX | Depreciado]
* **Data / Versão:** [Data ou Marco]
* **Decisores / Contexto:** [Módulos afetados / Papéis]

## 1. Contexto e Declaração do Problema
[Descreva a necessidade técnica, arquitetural ou de negócio que motivou a decisão. Quais eram as restrições?]

## 2. Decisão Arquitetural Adotada
[Descreva o que foi escolhido e implementado concretamente, mencionando bibliotecas, padrões ou mecanismos.]

## 3. Consequências e Trade-offs
* **Impactos Positivos (Ganhos):** [Ganhos em manutenibilidade, performance, segurança ou desacoplamento]
* **Impactos Negativos / Débitos Aceitos (Trade-offs):** [Limitações ou complexidades assumidas deliberadamente]
* **Diretrizes para Agentes de IA:** [Regras estritas que NUNCA devem ser alteradas sem um novo ADR formal]
```
