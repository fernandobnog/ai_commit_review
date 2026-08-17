# 📄 Documentação do Módulo: `src/analyzeCommit.js`

## 📌 Visão Geral
O módulo `src/analyzeCommit.js` implementa a lógica do comando `acr analyze`. Ele provê uma interface interativa com carregamento paginado de commits do repositório Git local, extrai as alterações de cada commit selecionado, otimiza a janela de contexto via `contextManager` e submete os diffs para revisão de código inteligente via OpenAI (`openaiUtils`).

---

## 🛠️ Dependências e Importações

### Dependências Externas
- `chalk`: Formatação de saídas coloridas no terminal.
- `inquirer`: Interface de terminal com seleção múltipla por checkboxes (`type: "checkbox"`).

### Módulos Internos Importados
- [`src/gitUtils.js`](file:///d:/GitHub/ai_commit_review/src/gitUtils.js): `getCommits`, `getModifiedFiles`, `getFileDiff`.
- [`src/openaiUtils.js`](file:///d:/GitHub/ai_commit_review/src/openaiUtils.js): `analyzeUpdatedCode`.
- [`src/contextManager.js`](file:///d:/GitHub/ai_commit_review/src/contextManager.js): `buildContextForFiles`.
- [`src/models.js`](file:///d:/GitHub/ai_commit_review/src/models.js): Enum `PromptType`.

---

## 🔄 Fluxos de Execução

### 1. Seleção Interativa e Paginada de Commits (`selectCommits`)
- Carrega inicialmente um lote de 5 commits do histórico local (`getCommits(0, 5)`).
- Apresenta um menu de marcação de caixas (checkbox) com:
  - Formato dos itens: `<shaCurto> - <data> - <mensagem>`.
  - Opções de controle: `⬇️ Load more commits` e `🚪 Exit`.
- Se a opção `🚪 Exit` for selecionada, encerra o processo com `process.exit(0)`.
- Se a opção `⬇️ Load more commits` for selecionada, busca mais 5 commits no repositório (`skip += 5`) e atualiza a lista mantendo a seleção acumulada.

### 2. Processamento e Análise do Commit (`analyzeCommit`)
Para cada commit selecionado:
1. Obtém a lista de arquivos alterados no commit via `getModifiedFiles(sha)`.
2. Obtém os diffs dos arquivos via `getFileDiff(sha, file)`.
3. Processa os diffs pelo `buildContextForFiles(files, PromptType.ANALYZE)` para quebrar/resumir diffs excessivamente grandes.
4. Envia o contexto processado para `analyzeUpdatedCode(condensedFiles, PromptType.ANALYZE)`.
5. Exibe a análise detalhada gerada pela IA no console e a lista dos arquivos analisados.

---

## 🔄 Funções Exportadas

### `analyzeCommits()`
- **Descrição**: Função assíncrona principal acionada pelo comando `acr analyze`. Gerencia a seleção e dispara o ciclo de análise para cada commit escolhido.
