# 📄 Documentação do Módulo: `src/helpers.js`

## 📌 Visão Geral
O módulo `src/helpers.js` é responsável por formatar e fornecer a mensagem de ajuda personalizada da CLI `ai-commit-review`. A função `showHelp` constrói o texto em Markdown/ANSI estilizado com `chalk` para ser exibido ao usuário via `commander` (`program.helpInformation = showHelp`).

---

## 🛠️ Dependências e Importações

### Dependências Externas
- `chalk`: Estilização e formatação de saídas coloridas no console (negrito, ciano, amarelo).

---

## 🔄 Funções Exportadas

### `showHelp()`
- **Descrição**: Gera a string completa de ajuda da ferramenta CLI.
- **Seções da Mensagem de Ajuda**:
  1. **Usage**: Sintaxe de comando base (`acr [commands]`).
  2. **Description**: Visão geral do propósito da ferramenta.
  3. **Required Variables**: Lista variáveis de configuração (`OPENAI_API_KEY`, `OPENAI_API_MODEL`, `OPENAI_RESPONSE_LANGUAGE`).
  4. **Commands**: Lista subcomandos principais (`analyze`, `create`, `set_config <key=value>`, `help`).
  5. **Examples**: Exemplos de uso prático dos subcomandos.
  6. **Tips**: Recomendações de segurança e otimização do uso de tokens da API.
- **Retorno**: `string` formatada com caracteres ANSI para exibição direta no terminal.
