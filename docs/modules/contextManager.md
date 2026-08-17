# 📄 Documentação do Módulo: `src/contextManager.js`

## 📌 Visão Geral
O módulo `src/contextManager.js` é responsável por condensar e resumir diffs de código extensos que excedem o limite de janela de contexto do modelo de IA configurado. Ele realiza a divisão de diffs grandes em pedaços (chunks), gera resumos via OpenAI e armazena os resumos em cache local (`.cache/context.json`) baseado em hash MD5 para evitar chamadas redundantes à API.

---

## 🛠️ Dependências e Importações

### Dependências Nativas Node.js
- `fs`: Manipulação do sistema de arquivos (`existsSync`, `mkdirSync`, `readFileSync`, `writeFileSync`, `unlinkSync`).
- `path`: Resolução do caminho do diretório de cache (`path.join(process.cwd(), ".cache")`).
- `crypto`: Geração de hash MD5 (`crypto.createHash("md5")`).

### Dependências Externas
- `chalk`: Formatação de saídas coloridas no terminal.

### Módulos Internos Importados
- [`src/openaiUtils.js`](file:///d:/GitHub/ai_commit_review/src/openaiUtils.js): `summarizeText`, `getModelContextLimit`.

---

## 📂 Armazenamento em Cache

- **Diretório**: `.cache/` (no diretório de trabalho atual do processo, `process.cwd()`).
- **Arquivo**: `.cache/context.json`.
- **Formato da Chave de Cache**: `${filename}:${md5(diff)}`.
- **Conteúdo Armazenado**: `{ summary: string, timestamp: number }`.

---

## 📐 Algoritmo de Cálculo de Contexto e Chunks

1. Obtém o limite de tokens do modelo (`getModelContextLimit()`).
2. Reserva:
   - `1000` tokens para a resposta da IA.
   - `200` tokens para as instruções do prompt de resumo.
3. Estima o limite em caracteres: `maxChars = (modelTokenLimit - 1200) * 4` (considerando 1 token ≈ 4 caracteres).
4. Se o diff do arquivo for menor ou igual a `maxChars`, o diff original é preservado.

---

## 🔄 Funções Exportadas

### `buildContextForFiles(files, promptType, options)`
- **Parâmetros**:
  - `files` (`Array<{ filename: string, diff: string, status: string }>`): Lista de arquivos alterados.
  - `promptType` (`string`): Parâmetro reservado para uso futuro.
  - `options` (`object`, opcional): Permite sobrescrever `maxChars` e `maxCombinedChars`.
- **Funcionamento**:
  - Verifica o cache por hash MD5 do diff. Se encontrado, retorna o diff formatado como resumo em cache `/* SUMMARY (cached): ... */`.
  - Se for necessário resumir:
    - Divide o diff em chunks de tamanho `maxChars`.
    - Envia cada chunk para `summarizeText()`.
    - Se a união dos resumos exceder `maxCombinedChars`, executa uma segunda camada de sumarização para consolidar tudo em um único parágrafo.
    - Grava o resultado no cache `.cache/context.json`.
- **Retorno**: `Promise<Array<{ filename: string, diff: string, status: string }>>` com os diffs (ou resumos de diffs) ajustados.

### `clearContextCache()`
- **Descrição**: Remove o arquivo `.cache/context.json` do sistema de arquivos via `fs.unlinkSync()`.
