# 📄 Documentação do Módulo: `src/config.js`

## 📌 Visão Geral
O módulo `src/config.js` é responsável por resolver o caminho físico de armazenamento de configurações no sistema operacional do usuário (Windows, macOS ou Linux/Unix), garantir a existência do diretório de configuração e fornecer operações síncronas de I/O para leitura (`loadConfig`), escrita (`saveConfig`) e exclusão (`deleteConfigFile`) do arquivo `.config.json`.

---

## 🛠️ Dependências e Importações

### Dependências Nativas Node.js
- `path`: Resolução e junção de caminhos do sistema de arquivos.
- `os`: Obtenção de informações do sistema operacional (`os.homedir()`).

### Dependências Externas
- `fs-extra`: Operações de sistema de arquivos estendidas (`ensureDirSync`, `existsSync`, `removeSync`, `readJsonSync`, `writeJsonSync`).

---

## ⚙️ Determinação do Caminho de Configuração (`getConfigDirectory`)

O diretório base de configuração é determinado dinamicamente com base na plataforma (`process.platform`):

| Plataforma (`process.platform`) | Caminho do Diretório |
| :--- | :--- |
| **Windows** (`win32`) | `%APPDATA%\ai-commit-review` ou `~/AppData/Roaming/ai-commit-review` |
| **macOS** (`darwin`) | `~/Library/Application Support/ai-commit-review` |
| **Linux / Unix** (outros) | `$XDG_CONFIG_HOME/ai-commit-review` ou `~/.config/ai-commit-review` |

### Efeito Colateral na Importação
Ao carregar o módulo, o diretório é criado automaticamente via `fs.ensureDirSync(configDirectory)`. O caminho completo do arquivo de configuração é exposto na constante `configFilePath` (`<configDirectory>/.config.json`).

---

## 🔄 Funções Exportadas

### `loadConfig()`
- **Descrição**: Carrega o conteúdo do arquivo `.config.json`.
- **Retorno**: `Object` contendo as configurações lidas do JSON. Retorna `{}` se o arquivo não existir ou se ocorrer um erro na leitura.

### `saveConfig(config)`
- **Parâmetros**: `config` (`Object`) - Objeto de configuração a ser gravado.
- **Descrição**: Grava o objeto `config` no arquivo `.config.json` formatado com 2 espaços de recuo (`{ spaces: 2 }`).

### `deleteConfigFile()`
- **Descrição**: Remove o arquivo `.config.json` do disco se ele existir.
- **Retorno**: `boolean` (`true` se excluído com sucesso; `false` se o arquivo não existir ou se ocorrer falha).

### `configFilePath`
- **Descrição**: Constante exportada contendo o caminho absoluto completo até o arquivo `.config.json`.
