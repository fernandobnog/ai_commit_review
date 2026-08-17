# 📄 Documentação do Módulo: `src/gitCore.js`

## 📌 Visão Geral
O módulo `src/gitCore.js` abstrai as operações de leitura, log, diffs e staging do Git local através de execuções síncronas com tratamento de erros.

---

## 🛠️ Dependências
- `child_process.execSync`
- `chalk`

---

## 🔄 Funções Exportadas
- `executeGitCommand(command)`: Executa comandos git via `execSync` em UTF-8.
- `stageAllChanges()`: Executa `git add .`.
- `clearStage()`: Executa `git reset`.
- `undoLastCommitSoft()`: Executa `git reset --soft HEAD~1`.
- `commitChangesWithEditor(tempFilePath)`: Abre o editor com mensagem pré-carregada.
- `getCommits(skip, limit)`: Retorna lista formatada do histórico Git.
- `getModifiedFiles(sha)`: Retorna status e arquivos modificados de um commit.
- `getFileDiff(sha, file)`: Retorna diff de arquivo específico.
- `getRepositoryDiff()`: Retorna `git diff` não-staged.
- `getStagedFileDiff(file)`: Retorna diff de arquivo staged.
- `getStagedFilesDiffs()`: Retorna lista de arquivos e diffs staged.

---

## 🧪 Testes e Isolamento de Efeitos Colaterais
Todas as funções expostas em `gitCore.js` aceitam um objeto opcional `deps = {}` contendo `execSyncFn`. Durante a execução de testes automatizados, `execSyncFn` deve ser obrigatoriamente mockado para garantir que nenhuma operação real (`git add`, `git reset`, `git commit`) altere o repositório local.
