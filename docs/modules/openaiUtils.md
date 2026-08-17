# 📄 Documentação do Módulo: `src/openaiUtils.js`

## 📌 Visão Geral
O módulo `src/openaiUtils.js` é a camada de integração com a API da OpenAI (ou servidores locais compatíveis como LM Studio/Ollama via `baseURL`). Ele constrói prompts estruturados em inglês para análise de código e geração de mensagens de commit, calcula defensivamente os limites de contexto em tokens (truncando diffs quando necessário) e lida com renovação de chave de API em respostas de erro HTTP 401.

---

## 🛠️ Dependências e Importações

### Dependências Externas
- `chalk`: Formatação de saídas coloridas no terminal.
- `openai`: SDK oficial da OpenAI (`OpenAI`).

### Módulos Internos Importados
- [`src/configManager.js`](file:///d:/GitHub/ai_commit_review/src/configManager.js): `validateConfiguration`, `updateValidApiKey`.
- [`src/models.js`](file:///d:/GitHub/ai_commit_review/src/models.js): `OpenAIModels`, `PromptType`, `SupportedLanguages`, `ModelContextLimits`.

---

## 🏗️ Estrutura de Prompts Gerados (`generatePrompt`)

1. **Instrução de Idioma (`generateLanguageInstruction`)**:
   - Mapeia o código de idioma configurado (ex: `pt-BR`) para o nome legível (ex: `Portuguese (Brazil)`).
   - Adiciona a instrução: `Please respond entirely in <Language Name>.`

2. **Tipo: `PromptType.ANALYZE`**:
   - Instruções em papel de *Senior Code Reviewer*.
   - Estrutura esperada de resposta por arquivo:
     1. **Resumo Detalhado das Modificações**
     2. **Identificação de Erros, Bugs Potenciais e Vulnerabilidades** (com trecho cotado, explicação e impacto)
     3. **Sugestões de Melhoria e Otimização** (refatoração, DRY, performance, testabilidade)
     4. **Recomendações de Boas Práticas e Qualidade de Código** (Clean code, legibilidade, reutilização)
     5. **Considerações Gerais do Commit**

3. **Tipo: `PromptType.CREATE`**:
   - Instruções para geração de commit no padrão:
     - **Título**: Emoji no início (ex: 🚀, ✨, 🐛, 🔧, 📝, ♻️, 🔒, 📈) + Verbo no imperativo + Max 50 caracteres.
     - **Corpo da Mensagem**: Descrição detalhada (o quê), Motivação/Contexto (por quê) e Impacto no projeto.
     - **Restrições**: Fidelidade aos diffs (não inventar), concisão, privacidade.
   - Formato estrito da resposta da IA:
     ```text
     Título
     Mensagem (corpo)
     ```

---

## 🔄 Funções Exportadas

### `analyzeUpdatedCode(files, promptType = PromptType.ANALYZE)`
- **Parâmetros**:
  - `files`: `Array<{ filename: string, diff: string, status: string }>`
  - `promptType`: `PromptType.ANALYZE` ou `PromptType.CREATE`
- **Funcionamento**:
  - Valida a configuração e instancia o cliente `OpenAI` (com `baseURL` customizada se definida).
  - Calcula o tamanho estimado de tokens do prompt (`Math.ceil(prompt.length / 4)`).
  - Reserva `2000` tokens para a resposta da IA.
  - Se o prompt exceder o limite de contexto do modelo, realiza o truncamento proporcional dos diffs dos arquivos para ocupar até 60% do limite permitido e regenera o prompt.
  - Para o modelo `GPT_5_NANO`, injeta os parâmetros adicionais `{ reasoning_effort: "low", verbosity: "low" }`.
- **Tratamento de Erros**: Se a chamada à API retornar erro HTTP 401 (não autorizado), chama `updateValidApiKey()` e re-executa a análise de forma recursiva.

### `getModelContextLimit()`
- **Descrição**: Retorna o limite de tokens de contexto para o modelo ativo na configuração (consultando `ModelContextLimits`).

### `summarizeText(text)`
- **Parâmetros**: `text` (`string`) - Conteúdo a ser resumido.
- **Descrição**: Função auxiliar que utiliza o modelo ativo para gerar um resumo conciso e técnico do texto. Realiza truncamento defensivo antes do envio caso o texto exceda a capacidade do modelo.
