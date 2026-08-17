# 📄 Documentação do Módulo: `src/crypto.js`

## 📌 Visão Geral
O módulo `src/crypto.js` implementa funcionalidades de criptografia e descriptografia de texto baseadas no algoritmo `aes-256-cbc`. É utilizado internamente para descriptografar chaves de API armazenadas e expõe uma interface de linha de comando (`criptografarcli`) para que desenvolvedores criptografem ou descriptografem textos manualmente.

---

## 🛠️ Dependências e Importações

### Dependências Nativas Node.js
- `crypto`: Módulo nativo de criptografia (`createCipheriv`, `createDecipheriv`, `scryptSync`).

### Dependências Externas
- `inquirer`: Interface de terminal interativa.

---

## 🔑 Derivação de Chave e Parâmetros Criptográficos

- **Algoritmo**: `aes-256-cbc`
- **Vetor de Inicialização (IV)**: `Buffer.alloc(16, 0)` (buffer zerado de 16 bytes).
- **Variável de Ambiente Exigida**: `PASSWORD_CRYPTO_KEY`
- **Derivação de Chave (`obterChave`)**:
  - Obtém a senha de `process.env.PASSWORD_CRYPTO_KEY`. Se ausente, lança `Error("PASSWORD_CRYPTO_KEY environment variable is not defined.")`.
  - Deriva uma chave de 32 bytes via `crypto.scryptSync(password, 'sal', 32)` usando o salt fixo `'sal'`.
  - Mantém a chave derivada em cache em memória na variável `chave`.

---

## 🔁 Mecanismo de Dupla Camada (2 Passos)

O módulo aplica **duas rodadas consecutivas** de cifragem/decifragem:

1. `criptografar(texto)`: Executa um loop de 2 iterações chamando `criptografarsimples(texto)` (UTF-8 ➔ Hex).
2. `decriptografar(texto)`: Executa um loop de 2 iterações chamando `decriptografarsimples(texto)` (Hex ➔ UTF-8).

---

## 🔄 Funções Exportadas

### `decriptografar(texto)`
- **Parâmetros**: `texto` (`string`) - Texto criptografado em formato Hex.
- **Descrição**: Aplica duas rodadas de descriptografia AES-256-CBC.
- **Retorno**: `string` descriptografada em UTF-8.

### `criptografarcli()`
- **Descrição**: Interface interativa de terminal para criptografia/descriptografia via `inquirer`.
- **Opções do Prompt**:
  - `Encrypt`: Solicita o texto e exibe o resultado da criptografia em 2 rodadas.
  - `Decrypt`: Solicita o texto Hex e exibe o resultado da descriptografia (tratando exceções caso a string seja inválida).
