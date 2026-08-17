# 📄 Documentação do Módulo: `src/productionServerUpdate.js`

## 📌 Visão Geral
O módulo `src/productionServerUpdate.js` implementa a lógica do comando `acr updateProductionServer`. Ele automatiza a preparação e o acionamento do fluxo de implantação para o ambiente de produção, verificando alterações pendentes na branch de testes (`teste`), executando validações interativas de confirmação com o usuário, realizando a mesclagem com a branch `develop`, criando um Pull Request (PR) automático para a branch `master` e enviando as atualizações para o repositório remoto.

---

## 🛠️ Dependências e Importações

### Dependências Externas
- `chalk`: Formatação de mensagens e logs coloridos no terminal.
- `inquirer`: Prompts interativos de entrada de texto (`input`) e confirmação (`confirm`).

### Módulos Internos Importados
- [`src/gitUtils.js`](file:///d:/GitHub/ai_commit_review/src/gitUtils.js): `createPullRequest`, `mergeBranch`, `executeGitCommand`, `pullChanges`, `pushChanges`.

---

## 🔄 Fluxos de Execução

### 1. Troca de Branch e Verificação de Status Local (`updateServerToProduction`)
1. Define as configurações fixas do fluxo:
   - **Branch de Origem (`branchOrigem`)**: `'teste'`
   - **Branch do Pull Request (`branchPR`)**: `'master'`
   - **Branch de Destino (`branchDestino`)**: `'develop'`
   - **Revisor Padrão (`revisor`)**: `'fernandobnog'`
2. Executa `git rev-parse --abbrev-ref HEAD` via `executeGitCommand` para verificar a branch ativa.
3. Se a branch ativa for diferente de `'teste'`, executa `git checkout teste`.
4. Executa `pullChanges()` para atualizar a branch local `'teste'`.
5. Verifica o status do repositório executando `git status --porcelain`:
   - Se houver qualquer saída (alterações não commitadas), exibe mensagem de erro no console e interrompe o processo com `process.exit(1)`.

### 2. Confirmações Interativas do Usuário
1. **Confirmação de Funcionamento**: Solicita confirmação se a branch `'teste'` está funcionando corretamente (`Is the "teste" branch working correctly?`, padrão: `true`).
   - Se a resposta for `false`, lança uma exceção `Error('The "teste" branch is not working correctly. Fix it and try again.')`.
2. **Confirmação de Deploy**: Pergunta se o usuário deseja colocar a branch em produção (`Do you want to put it into production?`, padrão: `true`).
   - Se `false`, exibe mensagem de cancelamento e encerra o processo com `process.exit(0)`.
3. **Confirmação Final (Ação Irreversível)**: Se a confirmação de deploy for `true`, solicita confirmação final (`Are you sure? This action cannot be undone.`, padrão: `false`).
   - Se `false`, exibe mensagem de cancelamento e interrompe o fluxo (retorno simples `return`).

### 3. Integração Git, Pull Request e Atualização Remote
1. Realiza o merge da branch `'teste'` na branch `'develop'` via `mergeBranch('teste', 'develop')`.
2. Invoca `createPullRequest` para criar um Pull Request com a seguinte estrutura:
   - **Origem (`head`)**: `'teste'`
   - **Destino (`base`)**: `'master'`
   - **Título**: `'Merge from teste to master'`
   - **Corpo**: `'Update Production Server: This pull request was automatically created to merge the \'teste\' branch into the master branch.'`
   - **Revisor (`reviewer`)**: `'fernandobnog'`
3. Exibe mensagem informativa recomendando não aprovar o PR sem revisão prévia por parte do Fernando.
4. Verifica se a branch atual é `'develop'` via `git rev-parse --abbrev-ref HEAD`. Se não for, altera para `'develop'` via `git checkout develop`.
5. Executa `pushChanges()` para enviar as alterações para o servidor remoto.

---

## 🔄 Funções Exportadas e Internas

### `updateServerToProduction()` (Exportada)
- **Descrição**: Função principal assíncrona que gerencia todo o ciclo de vida de atualização de produção.
- **Tratamento de Erros**: Envolvida por bloco `try...catch` que captura exceções, imprime mensagem de erro no console via `chalk.red` e relança a exceção (`throw error`).

### `verificaBranch()` (Interna / Não Utilizada)
- **Descrição**: Função assíncrona que exibe um prompt `input` solicitando o nome de uma branch (com padrão `'teste'`) e retorna o nome informado.
- **Nota Técnica**: A função está declarada nas linhas 13–23 do arquivo, porém **não é chamada ou referenciada** em nenhum ponto do fluxo de execução do módulo.
