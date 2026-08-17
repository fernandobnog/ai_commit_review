# 📄 Documentação do Arquivo: `README.md`

## 📌 Visão Geral
O arquivo [`README.md`](file:///d:/GitHub/ai_commit_review/README.md) é o guia principal de documentação pública do pacote `ai-commit-review` (intitulado no documento como **AI Commit Report**). Ele fornece aos usuários instruções de instalação global, comandos de configuração de chave e modelo da OpenAI, guias de execução para análise e criação de commits, exemplos práticos, pré-requisitos de sistema e diretrizes de contribuição.

---

## 🗺️ Estrutura do Documento

### 1. Instruções de Instalação (`Installation`)
- **Instalação Global**: `npm install -g ai-commit-review`
- **Atualização**: `npm update -g ai-commit-review`
- **Desinstalação**: `npm uninstall -g ai-commit-review`

### 2. Configurações Iniciais (`Getting Started`)
Documenta a utilização do comando `acr set_config` para alteração de parâmetros salvos no arquivo de configuração do usuário:
- **Chave de API**: `acr set_config OPENAI_API_KEY=sk-...`
- **Modelo de IA**: `acr set_config OPENAI_API_MODEL=gpt-4o-mini`
- **Idioma das Respostas**: `acr set_config OPENAI_RESPONSE_LANGUAGE=en-US`
- **Servidor Local de IA**:
  - `acr set_config OPENAI_API_BASEURL=http://127.0.0.1:1234/v1`
  - `acr set_config OPENAI_API_MODEL=deepseek-r1-distill-llama-8b`
  - `acr set_config OPENAI_API_KEY=local`

### 3. Principais Comandos Documentados (`Usage`)
- **`acr analyze`**: Lista os últimos 5 commits do repositório local e permite a seleção interativa para geração do relatório de code-review.
- **`acr create`**: Dispara o fluxo de staging de alterações, geração de mensagem de commit assistida por IA e envio remoto.
- **`acr help`**: Exibe o menu de ajuda e atalhos disponíveis.

### 4. Requisitos de Sistema (`Dependencies`)
- **Node.js**: Versão 14 ou superior.
- **npm**: Gerenciador de pacotes do Node.js.

### 5. Licenciamento (`License`)
- **Licença do Projeto**: ISC (conforme registrado no [`package.json`](file:///d:/GitHub/ai_commit_review/package.json)).
