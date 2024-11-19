# Relatório de Commit com IA

Ferramenta de linha de comando para analisar commits e código com IA a partir do Git local.

## Sumário

- [Introdução](#introdução)
- [Instalação](#instalação)
  - [Instalação Global](#instalação-global)
- [Configuração](#configuração)
  - [Definir a Chave da API](#definir-a-chave-da-api)
  - [Definir o Modelo da OpenAI](#definir-o-modelo-da-openai)
- [Uso](#uso)
  - [Analisar um Commit](#analisar-um-commit)
  - [Exibir Ajuda](#exibir-ajuda)
- [Exemplos](#exemplos)
- [Contribuição](#contribuição)
  - [Como Contribuir](#como-contribuir)
- [Licença](#licença)
- [Observações e Sugestões](#observações-e-sugestões)
- [Dicas Adicionais](#dicas-adicionais)

## Introdução

O **Relatório de Commit com IA** é uma ferramenta que utiliza a API da OpenAI para analisar as mudanças de código em commits do Git. Ela fornece insights sobre as alterações feitas, verifica boas práticas e sugere melhorias.

## Instalação

### Instalação Global

Para instalar a ferramenta globalmente no seu sistema:

1. **Clone o repositório:**

   ```bash
   git clone https://github.com/seu-usuario/relatorio-ai-commit.git
   ```

2. **Navegue até o diretório do projeto:**

   ```bash
   cd relatorio-ai-commit
   ```

3. **Instale as dependências:**

   ```bash
   npm install
   ```

4. **Instale o pacote globalmente:**

   ```bash
   npm install -g .
   ```

   **Nota:** Pode ser necessário ajustar permissões ou usar `sudo` se encontrar erros de permissão. Recomenda-se configurar seu ambiente para evitar o uso de `sudo` com o npm.

## Configuração

Antes de usar a ferramenta, é necessário configurar sua chave de API da OpenAI e o modelo a ser utilizado.

### Definir a Chave da API

Você pode definir sua chave de API de duas maneiras:

1. **Usando o comando `set_config`:**

   ```bash
   relatoriocommit set_config OPENAI_API_KEY=sk-sua-chave
   ```

2. **Durante a execução:**

   Se a chave não estiver configurada, você será solicitado a inseri-la quando executar o comando de análise.

### Definir o Modelo da OpenAI

Defina o modelo a ser usado:

1. **Usando o comando `set_config`:**

   ```bash
   relatoriocommit set_config OPENAI_API_MODEL=gpt-4o-mini
   ```

2. **Durante a execução:**

   Se o modelo não estiver configurado ou for inválido, você será solicitado a inseri-lo.

**Modelos Disponíveis:**
Atualmente é integrado apenas com o ChatGPT da OpenAi.

- `gpt-4o`
- `gpt-4o-mini`
- `gpt-4`
- `gpt-4-turbo`
- `gpt-3.5-turbo`
- `o1-preview`
- `o1-mini`

## Uso

A ferramenta oferece um comando básico para facilitar a análise de commits.

### Analisar um Commit

Para analisar as mudanças em um commit específico:

```bash
relatoriocommit <SHA_DO_COMMIT>
```

Substitua `<SHA_DO_COMMIT>` pelo SHA do commit que deseja analisar.

### Exibir Ajuda

Para exibir a ajuda e ver todos os comandos disponíveis:

```bash
relatoriocommit help
```

## Exemplos

- **Analisar um commit específico:**

  ```bash
  relatoriocommit 123abc
  ```

- **Definir a chave da API da OpenAI:**

  ```bash
  relatoriocommit set_config OPENAI_API_KEY=sk-sua-chave
  ```

- **Definir o modelo da OpenAI:**

  ```bash
  relatoriocommit set_config OPENAI_API_MODEL=gpt-4o-mini
  ```

## Dependências

- **Node.js** (versão 14 ou superior)
- **npm**

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests no repositório.

### Como Contribuir

1. **Faça um fork do projeto.**
2. **Crie uma nova branch:**

   ```bash
   git checkout -b minha-feature
   ```

3. **Faça suas modificações.**
4. **Commit suas mudanças:**

   ```bash
   git commit -m 'Minha nova feature'
   ```

5. **Envie para o branch remoto:**

   ```bash
   git push origin minha-feature
   ```

6. **Abra um pull request.**

## Licença

Este projeto está licenciado sob a licença MIT.

## Observações e Sugestões

- **Análise Focada nas Mudanças:** A ferramenta agora analisa apenas as mudanças (diffs) feitas nos commits, tornando a análise mais eficiente e focada.

- **Limitações da API:** Fique atento aos limites de tokens da API da OpenAI. Analisar apenas os diffs ajuda a evitar atingir esses limites.

- **Configurações Sensíveis:** Não exponha sua chave de API em lugares públicos ou em arquivos que serão comitados.

- **Melhorias Futuras:**

  - Implementar testes unitários para garantir a qualidade do código.
  - Adicionar suporte a outros modelos da OpenAI conforme eles se tornem disponíveis.
  - Melhorar o tratamento de erros e mensagens ao usuário.

- **Suporte:** Se encontrar problemas ou tiver dúvidas, abra uma issue no GitHub.

## Dicas Adicionais

- **Eficiência:** Analisar apenas as mudanças torna o processo mais rápido e consome menos recursos da API.

- **Foco nas Alterações:** A análise é mais precisa quando focada nas mudanças recentes, facilitando a identificação de potenciais problemas introduzidos.

- **Segurança:** Certifique-se de que informações sensíveis não sejam incluídas nos diffs ou logs.

- **Atualizações:** Mantenha suas dependências atualizadas para aproveitar melhorias e correções de segurança.

---
