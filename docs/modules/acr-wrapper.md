# 📄 Documentação do Módulo: `src/acr-wrapper.js`

## 📌 Visão Geral
O arquivo `src/acr-wrapper.js` é um script executável wrapper (contendo o shebang `#!/usr/bin/env node`) projetado para disparar a execução do `cli.js` passando a flag `--no-warnings` do Node.js. Ele garante que avisos do runtime (como depreciações ou alertas de pacotes) sejam suprimidos durante a execução do comando CLI.

---

## 🛠️ Dependências e Importações

### Dependências Nativas Node.js
- `child_process`: Criação de processos filhos (`spawn`).
- `url`: Conversão de URL de import ES para caminho de arquivo (`fileURLToPath`).
- `path`: Resolução do diretório pai (`dirname`).

---

## 🔄 Fluxo de Execução

1. **Resolução de Caminho ES Module**:
   - Calcula `__filename` via `fileURLToPath(import.meta.url)`.
   - Calcula `__dirname` via `dirname(__filename)`.

2. **Geração do Processo Filho (`spawn`)**:
   - Instancia o processo `node` passando as seguintes opções:
     - `--no-warnings`: Silencia avisos do ambiente Node.js.
     - `${__dirname}/cli.js`: Caminho absoluto para o arquivo de entrada `cli.js`.
     - `...process.argv.slice(2)`: Repassa todos os subcomandos e argumentos fornecidos pelo usuário no terminal.
   - Opção `{ stdio: 'inherit' }`: Mantém a comunicação direta e interativa no terminal do usuário.
