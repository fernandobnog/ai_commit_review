# 📄 Documentação do Módulo: `src/gitBranch.js`

## 📌 Visão Geral
O módulo `src/gitBranch.js` gerencia operações de trocas de branch, atualizações (`pull`/`push`), stash automático com rollback resiliente e identificação/resolução de conflitos de merge.

---

## 🛠️ Dependências
- `src/gitCore.js`: `executeGitCommand`
- `chalk`, `fs`, `path`, `os`, `child_process`

---

## 🔄 Funções Exportadas
- `getCurrentBranch()`: Retorna o nome da branch ativa.
- `listBranches()`: Lista branches locais.
- `pullChanges()`: Executa `git pull --no-rebase`.
- `pushChanges()`: Executa `git push`.
- `switchBranch(branch)`: Alterna de branch com stash defensivo.
- `mergeBranch(fromBranch, toBranch)`: Executa merge entre branches.
- `checkConflicts()`: Retorna lista de arquivos em conflito.
- `getConflictDiff(file)`, `writeConflictToTempFile(file, diff)`, `openFileInEditor(tempFilePath)`, `updateFileFromTemp(file, tempFilePath)`: Resolução de conflitos.
