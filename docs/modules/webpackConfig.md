# 📄 Documentação do Arquivo: `webpack.config.js`

## 📌 Visão Geral
O arquivo [`webpack.config.js`](file:///d:/GitHub/ai_commit_review/webpack.config.js) especifica a configuração de empacotamento do projeto via Webpack para compilar o código ES Modules (ESM) da aplicação em um único bundle executável CommonJS (`dist/bundle.cjs`). A configuração define o ambiente alvo como Node.js, adiciona a Shebang `#!/usr/bin/env node` no topo do arquivo gerado e resolve dinamicamente o arquivo de variáveis de ambiente (`.env` ou `.env.develop`).

---

## 🛠️ Importações e Dependências

### Dependências Nativas Node.js
- `path`: Resolução e junção de caminhos no sistema de arquivos.
- `url`: Função `fileURLToPath` para converter `import.meta.url` no caminho absoluto do arquivo em contexto ES Modules.
- `fs`: Verificação síncrona de existência de arquivos (`fs.existsSync`).

### Dependências Externas
- `webpack`: Módulo principal do Webpack (utilizado para `webpack.BannerPlugin`).
- `dotenv-webpack`: Plugin para injeção de variáveis de ambiente no processo de build.

---

## ⚙️ Lógica de Resolução de Ambiente (`envPath`)

O arquivo calcula o caminho do arquivo de variáveis de ambiente através da verificação:
```javascript
const envPath = fs.existsSync(path.resolve(__dirname, '.env'))
  ? path.resolve(__dirname, '.env')
  : path.resolve(__dirname, '.env.develop');
```
1. Verifica se o arquivo `.env` existe na raiz do projeto.
2. Se existir, define `envPath` para o caminho absoluto de `.env`.
3. Se não existir, define `envPath` como o caminho absoluto de `.env.develop`.

---

## 📦 Objeto de Configuração Exportado (`export default`)

| Chave | Valor Explícito | Descrição Técnica |
| :--- | :--- | :--- |
| `entry` | `'./cli.js'` | Ponto de entrada relativo da aplicação para o bundling. |
| `output.path` | `path.resolve(__dirname, 'dist')` | Diretório de destino para os arquivos compilados (`/dist`). |
| `output.filename` | `'bundle.cjs'` | Nome do arquivo de saída gerado. A extensão `.cjs` força o Node.js a tratá-lo como CommonJS. |
| `output.libraryTarget` | `'commonjs2'` | Formato de exportação do módulo compilado. |
| `target` | `'node'` | Define o ambiente de execução alvo como Node.js (preserva módulos nativos). |

---

## 🔌 Plugins Configurados (`plugins`)

### 1. `webpack.BannerPlugin`
Configurado para injetar a Shebang no início do bundle gerado:
- **`banner`**: `'#!/usr/bin/env node'`
- **`raw`**: `true` (insere a string diretamente sem envolver em comentários JS)
- **`entryOnly`**: `true` (aplica a Shebang exclusivamente ao chunk de entrada)

### 2. `Dotenv` (`dotenv-webpack`)
Configurado com `path: envPath` para ler e embutir as variáveis de ambiente resolvidas dinamicamente (`.env` ou `.env.develop`) durante a compilação.
