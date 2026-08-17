# 📄 Documentação do Módulo: `src/prompts.js`

## 📌 Visão Geral
O módulo `src/prompts.js` isola e centraliza a construção de instruções e templates de prompts estruturados para a IA para análise de código e mensagens de commit.

---

## 🛠️ Dependências
- `src/models.js`: `PromptType`, `SupportedLanguages`

---

## 🔄 Funções Exportadas
- `generateLanguageInstruction(langcode)`: Retorna instrução de idioma para a IA.
- `generatePrompt(files, promptType, config)`: Constrói o prompt formatado em Markdown para `ANALYZE` ou `CREATE`.
