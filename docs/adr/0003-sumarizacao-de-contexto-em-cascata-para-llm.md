# [ADR-0003] Sumarização de Contexto em Cascata e Chunking para LLMs

* **Status:** Aceito
* **Data / Versão:** Histórico / Inicial
* **Decisores / Contexto:** `src/contextManager.js`, `src/openaiUtils.js`, `src/models.js`

---

## 1. Contexto e Declaração do Problema
Commits ou conjuntos de arquivos alterados no Git frequentemente contêm milhares de linhas de diff.
Modelos LLM (como `gpt-5-nano` ou `openai/gpt-oss-20b`) possuem **limites rígidos de janela de contexto (context window limits)** medidos em tokens.
Enviar diffs brutos gigantescos diretamente à API gera dois problemas graves:
1. Erros HTTP por exceder o limite máximo de tokens do modelo (`context_length_exceeded`).
2. Consumo excessivo e desnecessário de tokens (custo financeiro e latência).

---

## 2. Decisão Arquitetural Adotada
Implementou-se um mecanismo de **Sumarização em Cascata baseada em Chunks com Cache Hashing** no módulo [`src/contextManager.js`](file:///d:/GitHub/ai_commit_review/src/contextManager.js).

### Detalhes do Algoritmo:
1. **Cálculo de Capacidade de Tokens**: A aplicação obtém o limite do modelo ativo via `ModelContextLimits` e reserva margens de segurança para instruções e resposta da IA.
2. **Chunking**: Se o diff de um arquivo ultrapassar o tamanho máximo de caracteres (`maxChars`), ele é fatiado em blocos menores (`chunkText`).
3. **Sumarização Recursiva**: Cada bloco é enviado para a OpenAI para gerar um resumo conciso. Se o conjunto combinado dos resumos ainda for extenso, uma segunda etapa de sumarização em cascata condensa tudo em um parágrafo técnico final.
4. **Cache por Hash MD5**: Cada diff sumarizado é indexado no `.cache/context.json` utilizando a chave `${filename}:${md5(diff)}`.

---

## 3. Consequências e Trade-offs

* **Impactos Positivos (Ganhos):**
  - **Resiliência a Diffs Gigantes**: Permite analisar commits massivos sem estourar a janela de tokens do modelo.
  - **Economia de Tokens**: Diffs idênticos ou não alterados são servidos diretamente do cache local sem novas chamadas à API.
* **Impactos Negativos / Débitos Aceitos (Trade-offs):**
  - **Perda de Detalhes Granulares em Diffs Extensos**: Ao sumarizar em cascata, detalhes de linhas específicas de código podem ser abstraídos pela IA em prol do contexto geral.
* **Diretrizes para Agentes de IA:**
  - Preserve a margem de segurança de tokens (`RESERVED_FOR_RESPONSE` e `RESERVED_FOR_INSTRUCTIONS`).
  - Mantenha a checagem de MD5 antes de disparar chamadas de sumarização para a OpenAI.
