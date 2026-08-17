# 📄 Documentação do Arquivo: `publish-npm.ps1`

## 📌 Visão Geral
O script PowerShell [`publish-npm.ps1`](file:///d:/GitHub/ai_commit_review/publish-npm.ps1) automatiza todo o fluxo de atualização de versão, integração de branches via Git e publicação de novas versões do pacote no registro público do NPM. O fluxo inclui validação de autenticação NPM, controle de conflitos no Git, mesclagem entre a branch de trabalho e a branch `master`, incremento automático de versão patch (`npm version patch`), compilação (`npm run build`), empacotamento (`npm pack`), publicação (`npm publish --access public`) e depreciação automática de versões legadas (`npm deprecate`).

---

## ⚙️ Configurações Iniciais do PowerShell

- **`$ErrorActionPreference = "Stop"`**: Interrompe imediatamente a execução do script caso ocorra qualquer erro em um comando.

---

## 🛠️ Funções Auxiliares Internas

### `Verificar-GitLimpo`
- **Comando**: `git status --porcelain`
- **Comportamento**: Se houver qualquer arquivo modificado ou não rastreado no diretório de trabalho, exibe mensagem no console e encerra a execução com `exit 1`.

### `Verificar-ConflitosMerge`
- **Comando**: `git ls-files -u`
- **Comportamento**: Se houver arquivos não mesclados (conflitos ativos de merge), exibe mensagem de erro no console e encerra a execução com `exit 1`.

---

## 🔄 Fluxo de Execução Passo a Passo

### 1. Pré-validações de Ambiente e Autenticação
1. **Verificação de `package.json`**: Testa a existência de `.\package.json`. Se não encontrado, encerra a execução (`exit 1`).
2. **Verificação de Login NPM**: Executa `npm whoami *>&1 | Out-Null`. Em caso de erro (usuário deslogado), solicita execução de `npm login` e encerra a execução (`exit 1`).
3. **Leitura de Metadados**: Extrai as propriedades `version` (`$versaoAtual`) e `name` (`$nomePacote`) do `package.json`.
4. **Identificação da Branch Git**: Executa `git rev-parse --abbrev-ref HEAD` para armazenar o nome da branch atual (`$branchAtual`).
5. **Consulta de Versão no NPM**: Executa `npm show "$nomePacote" version` para obter a última versão publicada no registro NPM (`$versaoUltima`).

### 2. Validação da Condição de Publicação
O script só prossegue com a publicação se:
- A versão local (`$versaoAtual`) for idêntica à versão no NPM (`$versaoUltima`); **OU**
- Não existir versão anterior publicada no NPM (publicação inicial do pacote).

Caso contrário, exibe mensagem informativa sobre discrepância de versões e encerra o script sem alterações.

### 3. Atualização e Sincronização Local
1. Executa `git pull origin $branchAtual --no-rebase`.
2. Se houver alterações não commitadas na branch atual (`git status --porcelain`), executa:
   - `git add .`
   - `git commit -m "Atualização da versão npm e outras alterações locais"`
   - `git push origin $branchAtual`

### 4. Integração na Branch `master` e Incremento de Versão
1. Alterna para a branch `master` (`git checkout master`) e sincroniza (`git pull origin master --no-rebase`).
2. Realiza o merge da branch de trabalho (`$branchAtual`) na `master`:
   - `git merge --no-ff "$branchAtual" -m "Merge da branch $branchAtual"`
   - Valida conflitos via `Verificar-ConflitosMerge`.
3. Executa `git push origin master`.
4. Valida se o repositório está limpo via `Verificar-GitLimpo`.
5. Se não for a primeira publicação, executa `npm version patch` para incrementar a versão patch e gerar a tag Git correspondente.
6. Atualiza dependências executando `npm install`.
7. Adiciona os arquivos atualizados `package.json` e `package-lock.json` ao staging:
   - Realiza commit com a mensagem: `"Bump version to <novaVersao>"`.
8. Envia os novos commits e tags para o repositório remoto:
   - `git push origin master --tags`

### 5. Sincronização de Retorno para a Branch de Trabalho
1. Alterna de volta para a branch de trabalho (`git checkout "$branchAtual"`).
2. Sincroniza via `git pull origin "$branchAtual" --no-rebase`.
3. Mescla a `master` atualizada de volta na branch de trabalho:
   - `git merge --no-ff master -m "Merge da branch master"`
   - Valida conflitos via `Verificar-ConflitosMerge`.
4. Envia as atualizações para o remoto: `git push origin "$branchAtual"`.

### 6. Build, Empacotamento, Publicação e Depreciação
1. Executa `npm install` na branch de trabalho.
2. Executa a compilação do pacote via `npm run build`.
3. Executa o empacotamento local via `npm pack`.
4. Publica o pacote no NPM com acesso público: `npm publish --access public`.
5. Executa a depreciação de versões anteriores à versão minor atual, utilizando como referência o limite calculado a partir da versão inicial capturada (`$versaoAtual`):
   - `npm deprecate "$nomePacote@<$versaoMajorMinor.0" "Versão obsoleta, use $versaoAtual ou superior"`
