# 📄 Documentação do Módulo: `src/testServerUpdate.js`

## 📌 Visão Geral
O módulo `src/testServerUpdate.js` implementa o comando `acr updateTestServer`. Ele automatiza o fluxo de atualização e implantação para o ambiente de testes de projetos dockerizados, abrangendo validação/atualização do arquivo de versão (`versao.txt`), criação de commit assistido por IA, mesclagem entre as branches de desenvolvimento (`develop`) e testes (`teste`), envio para o repositório remoto (`push`) e retorno à branch `develop`.

---

## 🛠️ Dependências e Importações

### Dependências Nativas Node.js
- `fs`: Leitura e escrita síncrona do arquivo de versão `versao.txt`.
- `path`: Resolução e junção de caminhos para pastas Docker e arquivos de versão.
- `os`: Caractere de fim de linha nativo do SO (`os.EOL`).

### Dependências Externas
- `chalk`: Saídas estilizadas no console.
- `inquirer`: Prompts interativos de confirmação e validação de versão.

### Módulos Internos Importados
- [`src/gitUtils.js`](file:///d:/GitHub/ai_commit_review/src/gitUtils.js): `getCurrentBranch`, `mergeBranch`, `switchBranch`, `pushChanges`.
- [`src/createCommit.js`](file:///d:/GitHub/ai_commit_review/src/createCommit.js): `createCommit`.

---

## 🔄 Fluxos de Execução

### 1. Checagem Docker e Atualização de Versão (`dockerCheck`)
1. Pergunta ao usuário se o projeto é dockerizado (`Is the project dockerized?`). Se não for, encerra o processo com `process.exit(0)`.
2. Localiza pastas Docker no projeto (`getDockerFolders`):
   - Verifica a existência da pasta `./docker`.
   - Se não existir na raiz, varre os diretórios de primeiro nível (ignorando `node_modules` e `.git`) buscando subpastas denominadas `docker`.
   - Se nenhuma pasta Docker for encontrada, encerra o processo com `process.exit(0)`.
3. Para cada pasta Docker localizada:
   - Procura o arquivo `versao.txt`.
   - Exibe a versão atual contida no arquivo.
   - Pergunta se o usuário precisa atualizar a versão antes do commit.
   - Se sim, valida a entrada com o formato de regex `/^\d{4}\.\d{2}\.\d{3}$/` (`yyyy.nn.nnn`) e grava a nova versão no arquivo `versao.txt`.

### 2. Criação do Commit (`createCommit`)
- Executa o fluxo completo do módulo `createCommit.js` para realizar o staging e a mensagem de commit assistida por IA.

### 3. Integração e Merge de Branches (`mergeToTest`)
- Obtém a branch atual via `getCurrentBranch()`.
- Se a branch atual for `'test'`, exibe mensagem e encerra a etapa de merge.
- Se a branch atual for `'develop'`, executa `mergeBranch('develop', 'teste')`.
- Para outras branches, executa `mergeBranch(currentBranch, 'develop')`, em seguida `mergeBranch('develop', 'teste')` e alterna para a branch `'teste'`.

### 4. Finalização (`pushChanges` e Troca para Develop)
- Executa `pushChanges()` (`git push`).
- Alterna novamente para a branch `'develop'` via `switchBranch('develop')`.

---

## 🔄 Funções Exportadas

### `updateServerToTest()`
- **Descrição**: Função assíncrona principal que executa a sequência: `dockerCheck` ➔ `createCommit` ➔ `mergeToTest` ➔ `pushChanges` ➔ `switchBranch('develop')`.
