# 🧹 Inventário de Limpeza: Código Morto e Duplicações (`DRY`)

Este documento consolida a análise estática detalhada realizada sobre a base de código do `ai-commit-review`, identificando elementos em desuso, inconsistências de enums, trechos mortos e violações do princípio **DRY (Don't Repeat Yourself)**.

---

## 💀 1. Métodos, Variáveis e Funções em Desuso (Dead Code)

Os itens listados abaixo foram identificados na auditoria estática como símbolos sem referências ativas no fluxo de execução ou com lógica inoperante devido ao ciclo de vida da CLI.

### 1.1 `verificaBranch()` em `src/productionServerUpdate.js`
- **Localização**: [`src/productionServerUpdate.js:L13-L23`](file:///d:/GitHub/ai_commit_review/src/productionServerUpdate.js#L13-L23)
- **Descrição**: Função utilitária assíncrona declarada no topo do arquivo que solicita ao usuário o nome de uma branch para verificação via `inquirer`.
- **Problema**: A função **não é exportada** e **nunca é chamada** dentro de `updateServerToProduction()`. O valor de branch de teste está `hardcoded` na linha 27 (`const branchOrigem = 'teste';`).
- **Ação Recomendada**: Remover a função `verificaBranch()` para eliminar código morto.

### 1.2 `codigoMap` e Envio de E-mail Desacoplado em `src/validateEmail.js`
- **Localização**: [`src/validateEmail.js:L25-L59`](file:///d:/GitHub/ai_commit_review/src/validateEmail.js#L25-L59)
- **Descrição**: Mapa em memória (`const codigoMap = new Map()`) e funções `enviarEmail` / `validarCodigo`.
- **Problema**: 
  1. A CLI é um processo efêmero de linha de comando que finaliza a execução (`process.exit`) entre comandos. O estado em memória no `codigoMap` é perdido no exato momento em que o processo encerra, tornando a retenção em memória inútil caso a etapa seja dividida.
  2. A constante `EMAIL_CONFIG` depende de `process.env.SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` e `process.env.FROM_EMAIL`, que não são gerenciados pelo `configManager.js` nem documentados no `.env.develop`.
- **Ação Recomendada**: Refatorar o fluxo de validação por e-mail para utilizar persistência temporária baseada no arquivo de configuração criptografado ou em token em disco, e centralizar as credenciais SMTP no `configManager.js`.

### 1.3 `getRepositoryDiff()` em `src/gitUtils.js`
- **Localização**: [`src/gitUtils.js:L320-L330`](file:///d:/GitHub/ai_commit_review/src/gitUtils.js#L320-L330)
- **Descrição**: Função utilitária exportada para obter a diferença completa do repositório (`git diff`).
- **Problema**: Nenhuma parte da aplicação (`cli.js`, `analyzeCommit.js`, `createCommit.js`, etc.) importa ou utiliza `getRepositoryDiff`. Os comandos utilizam `getFileDiff` ou `getStagedFilesDiffs`.
- **Ação Recomendada**: Remover a função em desuso ou conectar a um eventual comando `acr diff`.

### 1.4 `clearContextCache()` em `src/contextManager.js`
- **Localização**: [`src/contextManager.js:L132-L139`](file:///d:/GitHub/ai_commit_review/src/contextManager.js#L132-L139)
- **Descrição**: Função utilitária para excluir o arquivo de cache `.cache/context.json`.
- **Problema**: Exportada pelo módulo, mas sem vínculo com nenhum comando da CLI (`cli.js`).
- **Ação Recomendada**: Expor a funcionalidade na CLI como `acr clear-cache` ou incluí-la no subcomando `resetConfig`.

### 1.5 Modelo de IA Inexistente em `src/models.js` vs `src/configManager.js`
- **Localização**: [`src/configManager.js:L48`](file:///d:/GitHub/ai_commit_review/src/configManager.js#L48) vs [`src/models.js`](file:///d:/GitHub/ai_commit_review/src/models.js)
- **Descrição**: Ao configurar IA local em `setBaseURLOpenAILocal`, o código atribui `config[ConfigKeys.OPENAI_API_MODEL] = OpenAIModels.DEEPSEEK_LOCAL;`.
- **Problema**: O objeto `OpenAIModels` em `src/models.js` declara apenas `GPT_5_NANO` e `OSS_20B_LOCAL`. `OpenAIModels.DEEPSEEK_LOCAL` resulta em `undefined`.
- **Ação Recomendada**: Adicionar `DEEPSEEK_LOCAL: "deepseek-local"` em `OpenAIModels` ou corrigir a referência para `OpenAIModels.OSS_20B_LOCAL`.

### 1.6 Erro de Lógica Condicional em `cli.js`
- **Localização**: [`cli.js:L53`](file:///d:/GitHub/ai_commit_review/cli.js#L53)
- **Descrição**: `if (!process.argv.includes("set_config") || !process.argv.includes("crypto")) { await ensureValidApiKey(); }`
- **Problema**: Usar o operador `||` faz com que o bloco de validação de chave de API execute **sempre**, exceto se o comando contiver simultaneamente as duas palavras na linha de comando.
- **Ação Recomendada**: Substituir `||` por `&&`: `if (!process.argv.includes("set_config") && !process.argv.includes("crypto"))`.

---

## 🔁 2. Código Duplicado e Violações de DRY

### 2.1 Duplicação Massiva entre `createCommit.js` e `commitStaged.js`
- **Localização**: [`src/createCommit.js:L32-L184`](file:///d:/GitHub/ai_commit_review/src/createCommit.js#L32-L184) e [`src/commitStaged.js:L29-L181`](file:///d:/GitHub/ai_commit_review/src/commitStaged.js#L29-L181)
- **Descrição**: ~150 linhas de código idênticas clonadas caractere por caractere entre os dois arquivos:
  - `confirmOrSwitchBranch()`
  - `resolveConflictsManually()`
  - `resolveConflictsAutomatically()`
  - `verifyConflicts()`
  - `readCommitMessage()`
- **Impacto**: Qualquer ajuste de bug no fluxo de resolução de conflitos precisa ser aplicado manualmente em ambos os arquivos, gerando divergências sutis de comportamento.
- **Sugestão de Abstração**: Extrair essas 5 funções para um novo serviço/utilitário compartilhado chamado `src/commitWorkflowHelper.js` ou incorporá-las diretamente em `src/gitUtils.js`.

### 2.2 Manipulação de Arquivo Temporário de Mensagem de Commit
- **Localização**: `createCommit.js` (linhas 260-274) e `commitStaged.js` (linhas 252-266).
- **Descrição**: Bloco de código idêntico que constrói o caminho do arquivo temporário com `path.join(os.tmpdir(), "commit_message.txt")`, grava o conteúdo com `fs.writeFileSync`, abre o editor com `commitChangesWithEditor`, relê com `readCommitMessage` e limpa com `fs.unlinkSync`.
- **Sugestão de Abstração**: Criar uma função utilitária `promptEditCommitMessage(initialMessage)` em um módulo de fluxo compartilhado.

### 2.3 Instanciação Redundante do Cliente SDK OpenAI
- **Localização**: [`src/openaiUtils.js:L145-L149`](file:///d:/GitHub/ai_commit_review/src/openaiUtils.js#L145-L149) e [`src/openaiUtils.js:L238-L242`](file:///d:/GitHub/ai_commit_review/src/openaiUtils.js#L238-L242)
- **Descrição**: Bloco condicional duplicado dentro de `analyzeUpdatedCode` e `summarizeText` para verificar se existe `OPENAI_API_BASEURL` e instanciar `new OpenAI(...)`.
- **Sugestão de Abstração**: Criar uma função privada helper `getOpenAIClient(config)` que encapsula a lógica de fábrica da instância da OpenAI.

### 2.4 Operações de Checkout e Pull de Branch Git
- **Localização**: `src/testServerUpdate.js`, `src/productionServerUpdate.js` e `src/gitUtils.js`.
- **Descrição**: Repetição de chamadas a `executeGitCommand("git rev-parse --abbrev-ref HEAD")` seguida de mensagens no console e `executeGitCommand("git checkout " + branch)`.
- **Sugestão de Abstração**: Reutilizar de forma consistente a função `switchBranch(branch)` de `gitUtils.js`, eliminando chamadas diretas de checkout manual com interpolação de strings.
