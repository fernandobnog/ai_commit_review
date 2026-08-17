# 📄 Documentação do Arquivo: `package.json`

## 📌 Visão Geral
O arquivo [`package.json`](file:///d:/GitHub/ai_commit_review/package.json) é o manifesto principal do projeto Node.js `ai-commit-review`. Ele estabelece as metainformações do pacote, define o tipo de módulo (ESM), especifica o ponto de entrada da aplicação empacotada (`dist/bundle.cjs`), registra o alias do executável CLI (`acr`), declara os scripts de automação de build e publicação, e lista todas as dependências de execução e desenvolvimento.

---

## ⚙️ Metadados do Pacote

| Propriedade | Valor Explícito | Descrição Técnica |
| :--- | :--- | :--- |
| `name` | `"ai-commit-review"` | Nome do pacote no ecossistema Node.js / NPM. |
| `version` | `"1.2.89"` | Versão semântica atual do pacote. |
| `type` | `"module"` | Define o padrão nativo de módulos da aplicação como ES Modules (ESM). |
| `description` | `"AI-powered commit and code analysis from the local Git repository"` | Descrição resumida da funcionalidade do projeto. |
| `main` | `"dist/bundle.cjs"` | Arquivo principal de distribuição do módulo. |
| `bin` | `{"acr": "dist/bundle.cjs"}` | Associa o comando de linha de comando `acr` ao bundle gerado em `dist/bundle.cjs`. |
| `author` | `"Fernando Nogueira <fernando.bnog@gmail.com>"` | Autor e responsável pelo pacote. |
| `license` | `"ISC"` | Licença de uso e distribuição do software. |
| `keywords` | `["git", "openai", "commit", "code-review", "cli"]` | Tags de categorização para busca no registro NPM. |

---

## 📜 Scripts de Execução (`scripts`)

| Script | Comando Executado | Finalidade Técnica Explícita |
| :--- | :--- | :--- |
| `start` | `node -r dotenv/config cli.js` | Executa o arquivo [`cli.js`](file:///d:/GitHub/ai_commit_review/cli.js) injetando o pré-carregamento de variáveis de ambiente via `dotenv/config`. |
| `test` | `node --test "tests/*.test.js"` | Executa toda a suíte de testes de forma nativa e cross-platform. |
| `test:coverage` | `node --experimental-test-coverage --test --test-concurrency=1 "tests/*.test.js"` | Executa os testes gerando o relatório de cobertura de código nativo do Node.js. |
| `publish-npm` | `powershell -File ./publish-npm.ps1` | Aciona a execução do script PowerShell [`publish-npm.ps1`](file:///d:/GitHub/ai_commit_review/publish-npm.ps1) para automação de publicação. |
| `build` | `webpack --mode production` | Executa o empacotador Webpack no modo de produção utilizando [`webpack.config.js`](file:///d:/GitHub/ai_commit_review/webpack.config.js). |

---

## 📦 Dependências de Execução (`dependencies`)

| Pacote | Versão | Uso no Projeto |
| :--- | :--- | :--- |
| `chalk` | `^5.4.1` | Formatação de textos e cores no terminal. |
| `commander` | `^13.0.0` | Parsing de argumentos e comandos da CLI. |
| `dotenv` | `^16.4.7` | Carregamento de variáveis de ambiente a partir de arquivos `.env`. |
| `fs-extra` | `^11.3.0` | Métodos estendidos para manipulação do sistema de arquivos. |
| `inquirer` | `^12.3.2` | Menus e prompts interativos de entrada no terminal. |
| `nodemailer` | `^6.9.16` | Envio de e-mails para relatórios e notificações. |
| `openai` | `^4.104.0` | SDK oficial da OpenAI para chamadas à API de modelos de linguagem. |
| `uuid` | `^11.0.5` | Geração de identificadores únicos universais (UUIDs). |

---

## 🛠️ Dependências de Desenvolvimento (`devDependencies`)

| Pacote | Versão | Uso no Projeto |
| :--- | :--- | :--- |
| `dotenv-webpack` | `^8.1.0` | Plugin para inclusão de variáveis do `.env` durante o bundling do Webpack. |
| `webpack` | `^5.97.1` | Bundler para empacotar o código em um arquivo final `.cjs`. |
| `webpack-cli` | `^6.0.1` | Interface de linha de comando para execução do Webpack. |
