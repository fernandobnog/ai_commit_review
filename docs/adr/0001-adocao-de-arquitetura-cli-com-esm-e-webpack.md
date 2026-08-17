# [ADR-0001] Adoção de Arquitetura CLI baseada em ES Modules e Webpack Bundle

* **Status:** Aceito
* **Data / Versão:** Histórico / Inicial (Versão 1.x)
* **Decisores / Contexto:** Arquitetura do Core, `cli.js`, `package.json`, `webpack.config.js`

---

## 1. Contexto e Declaração do Problema
O projeto `ai-commit-review` precisa ser distribuído como uma ferramenta de linha de comando (CLI) executável globalmente via npm (`npx acr` ou `acr`).
As principais restrições eram:
1. Permitir que o código-fonte principal em `src/` utilize a sintaxe moderna **ES Modules (ESM)** com `import`/`export`.
2. Garantir compatibilidade imediata de execução no ambiente Node.js em diferentes sistemas operacionais (Windows, macOS, Linux) sem depender de transpilação em tempo de execução no cliente.
3. Minimizar o tamanho da instalação global e simplificar o executável binário exposto na chave `"bin"` do `package.json`.

---

## 2. Decisão Arquitetural Adotada
Decidiu-se adotar o padrão **ES Modules (`"type": "module"`)** no ambiente de desenvolvimento do código-fonte (`src/`), utilizando o **Webpack 5** com `target: "node"` para compilar todo o grafo de dependências da aplicação em um **único bundle CommonJS** (`dist/bundle.cjs`).

### Detalhes de Implementação:
- `cli.js` é o ponto de entrada de desenvolvimento.
- `webpack.config.js` empacota a aplicação apontando a entrada para `cli.js` e a saída para `dist/bundle.cjs`.
- `package.json` define `"main": "dist/bundle.cjs"` e `"bin": { "acr": "dist/bundle.cjs" }`.
- O wrapper `src/acr-wrapper.js` fornece um script executável com a flag `#!/usr/bin/env node` desabilitando avisos com `--no-warnings`.

---

## 3. Consequências e Trade-offs

* **Impactos Positivos (Ganhos):**
  - **Distribuição Simplificada**: O pacote final enviado ao npm requer apenas o arquivo `dist/bundle.cjs`, resultando em inicialização rápida sem resolução de múltiplos módulos em tempo de execução.
  - **DX Moderna**: Permite o uso de recursos modernos de JavaScript/ESM no desenvolvimento de `src/`.
* **Impactos Negativos / Débitos Aceitos (Trade-offs):**
  - **Necessidade de Build Step**: Toda alteração no código-fonte em `src/` exige a execução do comando `npm run build` para atualização do bundle em `dist/bundle.cjs` antes da publicação ou teste distribuído.
* **Diretrizes para Agentes de IA:**
  - **NUNCA** altere a chave `"bin"` no `package.json` para apontar diretamente para arquivos não compilados em `src/`.
  - Sempre execute `npm run build` para validar se alterações nos arquivos fontes em `src/` não quebram o empacotamento com o Webpack.
