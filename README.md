# AI Commit Report

Ferramenta de linha de comando para análise de commits e código impulsionada por IA a partir do repositório Git local.

## Índice

- [Introdução](#introdução)
- [Instalação](#instalação)
  - [Instalação Global](#instalação-global)
- [Começando](#começando)
  - [Configurar a Chave API](#configurar-a-chave-api)
  - [Configurar o Modelo OpenAI](#configurar-o-modelo-openai)
  - [Configurar o Idioma de Resposta](#configurar-o-idioma-de-resposta)
- [Uso](#uso)
  - [Analisar um Commit](#analisar-um-commit)
  - [Exibir Ajuda](#exibir-ajuda)
- [Exemplos](#exemplos)
- [Dependências](#dependências)
- [Contribuindo](#contribuindo)
  - [Como Contribuir](#como-contribuir)
- [Licença](#licença)
- [Notas e Sugestões](#notas-e-sugestões)
- [Dicas Adicionais](#dicas-adicionais)
- [Perguntas Frequentes (FAQs)](#perguntas-frequentes-faqs)

## Introdução

O **AI Commit Report** é uma ferramenta que utiliza a API da OpenAI para analisar as alterações de código em commits Git. Ele fornece insights sobre as mudanças realizadas, verifica as melhores práticas e sugere melhorias, ajudando a manter a qualidade do código e a eficiência do desenvolvimento.

## Instalação

### Instalação Global

Para instalar a ferramenta globalmente no seu sistema, siga os passos abaixo:

1. **Clone o repositório:**

   ```bash
   git clone https://github.com/seu-usuario/ai-commit-report.git
   ```

2. **Navegue para o diretório do projeto:**

   ```bash
   cd ai-commit-report
   ```

3. **Instale as dependências:**

   ```bash
   npm install
   ```

4. **Instale o pacote globalmente:**

   ```bash
   npm install -g .
   ```

   **Nota:** Pode ser necessário ajustar permissões ou usar `sudo` caso encontre erros de permissão. É recomendado configurar seu ambiente para evitar o uso de `sudo` com o npm.

## Começando

Antes de utilizar a ferramenta, é necessário configurar sua chave API da OpenAI, o modelo a ser usado e o idioma de resposta.

### Configurar a Chave API

1. **Usando o comando `set_config`:**

   ```bash
   acr set_config OPENAI_API_KEY=sk-sua-chave
   ```

### Configurar o Modelo OpenAI

1. **Usando o comando `set_config`:**

   ```bash
   acr set_config OPENAI_API_MODEL=gpt-4
   ```

   **Modelos Disponíveis:**

   Atualmente, a integração é apenas com os modelos ChatGPT da OpenAI.

   - `gpt-4o`
   - `gpt-4o-mini`
   - `gpt-4`
   - `gpt-4-turbo`
   - `gpt-3.5-turbo`
   - `o1-preview`
   - `o1-mini`

### Configurar o Idioma de Resposta

1. **Usando o comando `set_config`:**

   ```bash
   acr set_config OPENAI_RESPONSE_LANGUAGE=pt-BR
   ```

   **Idiomas Disponíveis:**

   - `EN_US`: English (US)
   - `EN_GB`: English (UK)
   - `ES`: Spanish
   - `ZH`: Mandarin
   - `HI`: Hindi
   - `AR`: Arabic
   - `FR`: French
   - `RU`: Russian
   - `PT_BR`: Portuguese (Brazil)
   - `PT_PT`: Portuguese (Portugal)

## Variáveis de Configuração

A ferramenta utiliza as seguintes variáveis de configuração:

- `OPENAI_API_KEY`: Sua chave API da OpenAI.
- `OPENAI_API_MODEL`: O modelo da OpenAI a ser utilizado.
- `OPENAI_RESPONSE_LANGUAGE`: O idioma das respostas da análise.

## Uso

A ferramenta oferece comandos básicos para facilitar a análise de commits.

### Analisar um Commit

Para analisar as alterações em um commit específico:

```bash
acr <COMMIT_SHA>
```

Substitua `<COMMIT_SHA>` pelo SHA do commit que você deseja analisar.

### Exibir Ajuda

Para exibir a ajuda e ver todos os comandos disponíveis:

```bash
acr help
```

## Exemplos

- **Analisar um commit específico:**

  ```bash
  acr 123abc
  ```

- **Configurar a chave API da OpenAI:**

  ```bash
  acr set_config OPENAI_API_KEY=sua-chave
  ```

- **Configurar o modelo OpenAI:**

  ```bash
  acr set_config OPENAI_API_MODEL=gpt-4o-mini
  ```

- **Configurar o idioma de resposta:**

  ```bash
  acr set_config OPENAI_RESPONSE_LANGUAGE=pt-BR
  ```

## Dependências

- **Node.js** (versão 14 ou superior)
- **npm**

## Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests no repositório.

### Como Contribuir

1. **Faça um fork do projeto.**
2. **Crie uma nova branch:**

   ```bash
   git checkout -b minha-funcionalidade
   ```

3. **Faça suas modificações.**
4. **Commita suas alterações:**

   ```bash
   git commit -m 'Minha nova funcionalidade'
   ```

5. **Envie para a branch remota:**

   ```bash
   git push origin minha-funcionalidade
   ```

6. **Abra um pull request.**

   Navegue até o seu fork no GitHub e clique no botão "Compare & pull request" para submeter suas alterações para revisão.

## Licença

Este projeto está licenciado sob a Licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## Notas e Sugestões

- **Análise Focada nas Alterações:** A ferramenta analisa apenas as mudanças (diffs) feitas nos commits, tornando a análise mais eficiente e direcionada.
- **Limitações da API:** Esteja atento aos limites de tokens da API da OpenAI. Analisar apenas diffs ajuda a evitar ultrapassar esses limites.
- **Configurações Sensíveis:** Não exponha sua chave API em locais públicos ou em arquivos que serão commitados.
- **Melhorias Futuras:**
  - Implementar testes unitários para garantir a qualidade do código.
  - Adicionar suporte para outros modelos da OpenAI conforme disponíveis.
  - Melhorar o tratamento de erros e as mensagens para o usuário.
- **Suporte:** Se encontrar problemas ou tiver dúvidas, abra uma issue no GitHub.

## Dicas Adicionais

- **Eficiência:** Analisar apenas as alterações torna o processo mais rápido e consome menos recursos da API.
- **Foco nas Alterações:** A análise é mais precisa quando focada nas mudanças recentes, facilitando a identificação de possíveis problemas introduzidos.
- **Segurança:** Assegure-se de que informações sensíveis não estejam incluídas nos diffs ou logs.
- **Atualizações:** Mantenha suas dependências atualizadas para se beneficiar de melhorias e correções de segurança.

## Perguntas Frequentes (FAQs)

**P:** _Posso usar esta ferramenta com outros modelos de IA além do ChatGPT da OpenAI?_

**R:** Atualmente, a ferramenta só suporta integração com os modelos ChatGPT da OpenAI. O suporte para modelos adicionais pode ser adicionado em futuras atualizações.

---

**P:** _O que devo fazer se encontrar um erro durante a instalação?_

**R:** Certifique-se de que você possui as dependências necessárias instaladas e que tem as permissões adequadas. Verifique as mensagens de erro para detalhes específicos e considere abrir uma issue no GitHub se o problema persistir.

**P:** _Como proteger minha chave API ao usar esta ferramenta?_

**R:** Nunca compartilhe sua chave API publicamente. Utilize variáveis de ambiente e evite commitá-las no repositório. Considere usar ferramentas de gerenciamento de segredos para maior segurança.

**P:** _Quais idiomas estão disponíveis para as respostas da análise?_

**R:** As respostas podem ser configuradas nos seguintes idiomas:

- **English (US)** - `en-US`
- **English (UK)** - `en-GB`
- **Spanish** - `es`
- **Mandarin** - `zh`
- **Hindi** - `hi`
- **Arabic** - `ar`
- **French** - `fr`
- **Russian** - `ru`
- **Portuguese (Brazil)** - `pt-BR`
- **Portuguese (Portugal)** - `pt-PT`

---
