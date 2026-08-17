# 🗄️ Padrões de Persistência, Schemas e Evolução de Configuração (`MIGRATIONS_AND_DB.md`)

Este documento estabelece a arquitetura de persistência de dados, o gerenciamento de esquemas JSON, as políticas de compatibilidade e o ciclo de vida do repositório **`ai-commit-review`**.

---

## 🛠️ 1. Stack e Ferramentas de Persistência

> [!NOTE]
> O `ai-commit-review` é uma ferramenta de linha de comando (CLI) utilitária e descentralizada. **O sistema não utiliza um banco de dados relacional (como PostgreSQL, MySQL) nem NoSQL (como MongoDB)**, prescindindo de ORMs (como Prisma, TypeORM, Drizzle) ou ferramentas tradicionais de migração de SQL (como Flyway, Knex, Alembic).
> 
> A camada de persistência é baseada em **Arquivos de Documentos JSON Locais (Flat-File JSON Storage)** gerenciados nativamente por `fs-extra` e pelo módulo nativo `fs` do Node.js.

### Tabela da Camada de Persistência

| Componente de Persistência | Tecnologia / Biblioteca | Localização no Disco Host | Escopo e Finalidade de Negócio |
| :--- | :--- | :--- | :--- |
| **Configuração do Usuário** | `fs-extra` (JSON Sync I/O) | `~/.ai-commit-review/.config.json` *(ou `%APPDATA%\ai-commit-review\.config.json` no Windows)* | Armazenamento seguro e persistente de chaves de API, modelos LLM ativos e idioma. |
| **Cache de Contexto de Diffs** | `fs` (Native Node.js I/O) | `.cache/context.json` *(no diretório raiz do repositório)* | Cache local de resumos de diffs indexados por hash MD5 para redução de custos com a API OpenAI. |
| **Arquivos Temporários (Buffers)** | `fs` + `os.tmpdir()` | `%TEMP%\commit_message.txt` / `%TEMP%\{file}_conflict.txt` | Arquivos temporários de ciclo de vida efêmero para edição interativa de mensagens e resolução de conflito. |

---

## 📐 2. Convenções Canônicas e Design de Schemas JSON

A validação de integridade dos documentos JSON de configuração é mantida por enums estritos e imutáveis declarados em [`src/models.js`](file:///d:/GitHub/ai_commit_review/src/models.js).

### 2.1 Schema da Configuração Principal (`.config.json`)

O arquivo `.config.json` aceita exclusivamente chaves definidas no enum `ConfigKeys`:

```json
{
  "OPENAI_API_KEY": "string (opcional / cifrada via crypto.js)",
  "OPENAI_API_MODEL": "string (valida contra OpenAIModels)",
  "OPENAI_RESPONSE_LANGUAGE": "string (valida contra SupportedLanguages: pt-BR | en-US)",
  "OPENAI_API_BASEURL": "string (opcional, ex: http://127.0.0.1:1234/v1)"
}
```

#### Enums de Validação de Domínio (`src/models.js`):
1. **Modelos de IA (`OpenAIModels`)**:
   - `GPT_5_NANO`: `"gpt-5-nano"` (128.000 tokens).
   - `OSS_20B_LOCAL`: `"openai/gpt-oss-20b"` (8.000 tokens).
   - `DEEPSEEK_LOCAL`: `"deepseek-local"` (model set em ambiente local).
2. **Idiomas Suportados (`SupportedLanguages`)**:
   - `PT_BR`: `pt-BR` (Português Brasil - Padrão).
   - `EN_US`: `en-US` (Inglês EUA).

---

### 2.2 Schema do Cache de Contexto (`.cache/context.json`)

O arquivo de cache utiliza uma chave hash MD5 única gerada a partir do nome do arquivo e do diff alterado:

```json
{
  "[filename]:[md5(diff)]": {
    "summary": "string (Resumo sumarizado conciso retornado pela IA)",
    "timestamp": 1700000000000
  }
}
```

---

## 🔄 3. Ciclo de Vida e Regras para Evolução de Schema (Regras para IAs)

Como o sistema utiliza arquivos JSON descentralizados na máquina do desenvolvedor, a evolução do formato de configuração deve seguir princípios rigorosos de **Compatibilidade Retroativa (Backward Compatibility)**.

### 3.1 Regras Mandatórias para Adição de Novas Chaves de Configuração
1. **Proibição de Breaking Changes**:
   - Nunca remova ou altere o nome de chaves existentes (`OPENAI_API_KEY`, `OPENAI_API_MODEL`, `OPENAI_RESPONSE_LANGUAGE`, `OPENAI_API_BASEURL`) sem implementar uma estratégia de migração graciosa.
2. **Valores Padrão Automáticos (Defaults)**:
   - Toda nova chave adicionada ao enum `ConfigKeys` em `src/models.js` deve obrigatoriamente possuir uma função de inicialização com fallback no `src/configManager.js` (a exemplo de `setDefaultModel` e `setDefaultLanguage`).
3. **Validação de Tipos no `updateConfigFromString`**:
   - Atualizações via terminal (`acr set_config KEY=VALUE`) devem ser validadas contra os valores do enum antes de gravar no disco. Se o valor for inválido, o comando lança exceção explicativa sem corromper o arquivo.

---

### 3.2 Estratégia de Migração e Reset de Configuração

Quando o esquema de configuração for corrompido ou precisar ser completamente reiniciado:
- **Resolução de Schema Danificado**: O `loadConfig()` em `src/config.js` engloba a leitura em um bloco `try...catch`. Se o arquivo `.config.json` contiver JSON malformatado ou inválido, o sistema captura a exceção, imprime um alerta e retorna um objeto vazio `{}` sem quebrar a CLI.
- **Comando de Redefinição de Estado**: A função `resetConfig()` em `src/configManager.js` expõe o comando `acr resetConfig`, que remove com segurança o arquivo `.config.json` via `deleteConfigFile()` e re-executa a configuração inicial do zero.

---

## 💻 4. Comandos Canônicos de CLI para Persistência

Tabela com os comandos e funções para gerenciar a persistência local:

| Operação de Persistência | Comando / Função CLI | Módulo Responsável | Efeito no Disco Host |
| :--- | :--- | :--- | :--- |
| **Atualizar Chave de Configuração** | `acr set_config KEY=VALUE` | [`src/configManager.js`](file:///d:/GitHub/ai_commit_review/src/configManager.js) | Atualiza e grava a chave especificada em `~/.ai-commit-review/.config.json`. |
| **Resetar Configurações** | `node cli.js resetConfig` | [`src/configManager.js`](file:///d:/GitHub/ai_commit_review/src/configManager.js) | Solicita confirmação e exclui o arquivo `.config.json`. |
| **Limpar Cache de Contexto** | `clearContextCache()` | [`src/contextManager.js`](file:///d:/GitHub/ai_commit_review/src/contextManager.js) | Exclui o arquivo `.cache/context.json`. |
| **Carregar Configuração** | `loadConfig()` | [`src/config.js`](file:///d:/GitHub/ai_commit_review/src/config.js) | Lê e faz o parse síncrono do `.config.json`. |

---

## 🔒 5. Padrão de Atomicidade e Controle de Concorrência

Para prevenir corrupção de arquivos JSON por leituras/escritas simultâneas no ambiente do desenvolvedor:

1. **Operações de E/S Síncronas (`Synchronous File I/O`)**:
   - As leituras e escritas no arquivo `.config.json` utilizam `fs.readJsonSync` e `fs.writeJsonSync` do `fs-extra`, bloqueando eventuais acessos concorrentes dentro da mesma thread do Node.js.
2. **Recomendação de Escrita Atômica (`Atomic File Write`)**:
   - Para garantir resiliência total contra quedas abruptas de energia ou encerramento do processo durante a gravação, a gravação de arquivos JSON deve evoluir para o padrão atômico:
   ```javascript
   // Padrão de Escrita Atômica Recomendado:
   const tempPath = `${configFilePath}.tmp`;
   fs.writeJsonSync(tempPath, config, { spaces: 2 });
   fs.renameSync(tempPath, configFilePath);
   ```
3. **Cache In-Memory Efêmero**:
   - Operações de verificação de chaves (`ensureValidApiKey`) realizam a validação em memória antes de persistir, minimizando operações desnecessárias de I/O em disco.
