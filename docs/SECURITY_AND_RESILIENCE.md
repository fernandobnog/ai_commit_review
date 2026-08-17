# 🛡️ Segurança, Resiliência e Gestão de Riscos (`SecOps`)

Este documento apresenta a análise profunda de segurança, resiliência operacional e conformidade OWASP para a aplicação `ai-commit-review`.

---

## 🔒 1. Checklist OWASP do Sistema

Abaixo estão listados os vetores de vulnerabilidade identificados na auditoria estática e os controles mandatórios para mitigação.

| Categoria OWASP | Status | Vulnerabilidade Identificada | Impacto | Diretriz Mandatória de Correção |
| :--- | :---: | :--- | :--- | :--- |
| **A03: Injection (Command Injection)** | 🔴 **CRÍTICO** | Uso de `execSync` com interpolação de strings em `gitUtils.js` (`gh pr create`, `git checkout`, `editor`). | Execução remota/local de comandos arbitrários no sistema operacional caso o título do PR, branch ou variável `EDITOR` contenham `;`, `$(...)` ou `\` \`. | **Proibir interpolação de strings no shell**. Substituir `execSync(string)` por `execFileSync(binario, [args...])` passando argumentos como array. |
| **A02: Cryptographic Failures** | 🔴 **CRÍTICO** | Vector de Inicialização (IV) fixo zerado (`Buffer.alloc(16, 0)`) e salt fixo `'sal'` em `crypto.js`. | Cifragem determinística em AES-256-CBC. O mesmo texto resulta na mesma cifra, fragilizando a proteção das chaves e permitindo ataques de dicionário/rainbow table. | Utilizar `crypto.randomBytes(16)` para cada cifragem e concatenar o IV ao resultado (`iv:ciphertext`). Usar salt dinâmico ou aleatório derivado. |
| **A07: Identification Failures** | 🟡 **MÉDIO** | Armazenamento de `OPENAI_API_KEY` em texto claro no arquivo de configuração local `~/.config.json`. | Vazamento da chave de API caso o sistema de arquivos do usuário seja comprometido ou lido por outro processo sem privilégios. | Cifrar a `OPENAI_API_KEY` no disco utilizando o módulo `crypto.js` antes de persistir no `.config.json`. |
| **A09: Security Logging Failures** | 🟡 **MÉDIO** | Exceções de rede ou autenticação da OpenAI podem imprimir a chave de API ou stack traces brutas no console. | Exposição indevida de PII ou credenciais em logs de terminal/CI/CD. | Sanitizar e mascarar todas as mensagens de erro antes de exibi-las no console (ex: `sk-****`). |
| **A05: Security Misconfiguration** | 🟢 **BAIXO** | Chamada síncrona `npm outdated -g` na inicialização do CLI sem timeout definido. | Bloqueio de execução da ferramenta (DoS de usabilidade) se a rede do usuário estiver lenta ou o registro do npm offline. | Adicionar timeout e fallback assíncrono não bloqueante para a verificação de atualizações. |

---

## 🔑 2. Proteção de Dados Sensíveis e Mascaramento em Logs

Para garantir que nenhuma credencial ou informação de identificação pessoal (PII) seja exposta em mensagens de erro, logs ou artefatos gerados:

1. **Mascaramento de API Keys**:
   - Qualquer string no formato `sk-[a-zA-Z0-9]{32,}` detectada em exceções deve ser mascarada como `sk-***[REDACTED]***` antes de ser exibida no terminal.
2. **Sanitização de Diffs**:
   - Diffs enviados para a API OpenAI não devem conter senhas ou tokens presentes em arquivos `.env` commitados por engano. O `contextManager.js` deve aplicar regex de exclusão para padrões de chaves privadas (`BEGIN PRIVATE KEY`), tokens e senhas.
3. **Credenciais SMTP**:
   - Remover valores fixos de fallback de e-mail e garantir que senhas SMTP nunca sejam exibidas em exceções de envio do `nodemailer`.

---

## 🔄 3. Idempotência, Concorrência e Transacionalidade

A execução de fluxos que alteram o estado do repositório Git (como `createCommit.js`, `testServerUpdate.js` e `productionServerUpdate.js`) deve garantir idempotência e recuperação de falhas:

### 3.1 Transacionalidade de Operações Git
- **Mecanismo de Rollback**: Se uma operação falhar no meio do processo (ex: erro no `git pull` ou na geração da IA após o `git stash`), a aplicação deve executar um **reversão explícita** para restaurar o estado original da árvore de trabalho (`working tree`) e da branch anterior.
- **Isolamento de Stash**: Operações de `git stash` devem usar mensagens identificadoras exclusivas (ex: `git stash save "acr-temp-stash-<timestamp>"`) para evitar desempilhar alterações não relacionadas do desenvolvedor durante o `stash pop`.

### 3.2 Arquivos Temporários Seguros
- **Evitar Colisão de Nomes**: Arquivos temporários criados em `os.tmpdir()` (`commit_message.txt`, `${file}_conflict.txt`) devem utilizar sufixos aleatórios únicos (ex: `commit_message_${uuidv4()}.txt`) para permitir execuções simultâneas em ambientes multi-processo.
- **Limpeza Garantida (`Garbage Collection`)**: A exclusão de arquivos temporários deve ser encapsulada em blocos `try...finally` para assegurar o expurgo dos arquivos do disco mesmo em caso de encerramento inesperado.

---

## 🗄️ 4. Concorrência e Segurança no Arquivo de Configuração Local

Embora o sistema não utilize um banco de dados relacional tradicional, a persistência de configurações é realizada via arquivo JSON local (`~/.ai-commit-review/.config.json`):

1. **Escrita Atômica (`Atomic Write`)**:
   - A escrita do arquivo de configuração via `fs.writeJsonSync` deve ser atualizada para um padrão de escrita atômica (gravar em arquivo temporário `.config.json.tmp` e renomear com `fs.renameSync`), prevenindo corrupção do JSON caso a aplicação seja interrompida no meio da gravação.
2. **Permissões de Arquivo de Configuração (POSIX)**:
   - Em sistemas Unix/macOS, o arquivo `.config.json` deve ser gravado com permissões restritas de leitura/escrita apenas para o proprietário (`mode: 0o600`), impedindo leitura por outros usuários do sistema.
