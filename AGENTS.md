# 🤖 AGENTS.md: Matriz Definitiva de Governança e Regras Rígidas para IAs e Desenvolvedores

Este documento estabelece as **diretrizes compulsórias** de arquitetura, qualidade de código, segurança, testes e governança para qualquer alteração ou novo desenvolvimento efetuado por agentes de Inteligência Artificial ou desenvolvedores no repositório `ai-commit-review`.

## Política de Manutenção Contínua de Documentação (Regra Mandatória)

Ao criar, refatorar, adicionar parâmetros ou alterar comportamentos de negócio em qualquer arquivo:
1. **Identificação do Módulo:** Localize o arquivo correspondente em `docs/modules/<modulo>.md`.
2. **Atualização Concomitante:** Atualize imediatamente a seção de "Regras de Negócio", "Contratos/DTOs" ou "Dependências" desse módulo no mesmo commit/resposta.
3. **Proibição de Código Órfão de Documentação:** Nenhuma nova rota, use case ou regra de cálculo é considerada concluída sem a sua respectiva atualização em `docs/modules/`.
4. **Atualização do Índice:** Se uma nova pasta de módulo for criada, adicione-a imediatamente em `docs/MAP_INDEX.md`.

---

## 📏 1. Limites Físicos e Métricas Rígidas de Clean Code

Toda modificação de código deve respeitar rigorosamente os seguintes teto-limites:

1. **Limite por Função**: **Maximum 30 linhas** por função/método.
   - Se uma função ultrapassar 30 linhas, ela deve ser obrigatoriamente decomposta em sub-funções utilitárias de responsabilidade única.
2. **Limite por Arquivo**: **Maximum 250 linhas** por arquivo de módulo (`.js`).
   - Se um arquivo ultrapassar 250 linhas, ele deve ser refatorado e dividido em submódulos coesos.
3. **Complexidade Ciclomática**: **Maximum 5** por bloco ou função.
   - Reduza aninhamentos profundos de condicionais (`if/else`), substituindo-os por Guard Clauses, retornos antecipados ou mapeamentos por objetos/Lookup Tables.

---

## 🏕️ 2. Regra do Escoteiro (Boy Scout Rule)

1. **Deixe o Código Mais Limpo do que Encontrou**:
   - Ao tocar em qualquer arquivo para adicionar uma funcionalidade ou corrigir um bug, inspecione se o arquivo atende às métricas de limite de linhas (≤ 250 linhas) e funções (≤ 30 linhas).
2. **Refatoração Prévia Obrigatória**:
   - É **proibido** adicionar novo código a um arquivo que já esteja violando os limites físicos sem antes refatorar e modularizar as funções legadas.

---

## 🛡️ 3. Regras Mandatórias de Segurança

1. **Execução Segura de Comandos (Prevenção contra Command Injection)**:
   - **Proibido**: Interpolação direta de variáveis em strings de comandos de shell (ex: `execSync(\`git checkout ${branch}\`)` ou `execSync(\`gh pr create --title "${title}"\`)`).
   - **Obrigatório**: Utilizar `execFileSync` / `execFile` passando parâmetros em um array de argumentos imutáveis ou aplicar sanitização rigorosa via regex antes de repassar valores a comandos de sistema.
2. **Sanitização de Entradas de Usuário**:
   - Todas as entradas coletadas via `inquirer` ou argumentos CLI devem ser validadas e higienizadas contra caracteres especiais de shell antes de qualquer processamento.
3. **Gerenciamento de Segredos e Credenciais**:
   - **Proibido**: Hardcode de senhas, tokens de API ou chaves privadas no código-fonte ou em arquivos versionados.
   - **Obrigatório**: Segredos devem ser consumidos via variáveis de ambiente seguras ou armazenados cifrados no arquivo `.config.json` via módulo `crypto.js`.
4. **Tratamento Centralizado de Exceções**:
   - Nenhuma função utilitária secundária deve invocar `process.exit()` diretamente.
   - As exceções devem ser relançadas (`throw error`) para tratamento centralizado no ponto de entrada (`cli.js`), garantindo que mensagens de erro amigáveis sejam exibidas sem vazar *stack traces* brutas para o usuário final.

---

## 🧪 4. Padrão Obrigatório para Testes Automatizados

1. **Padrão Mandatório de Criação**:
   - **É proibido criar qualquer novo Use Case, Service ou Utility sem o respectivo teste unitário e de integração**.
2. **Estrutura AAA (Arrange, Act, Assert)**:
   - Todo teste unitário ou de integração deve seguir explicitamente a divisão AAA:
     - **Arrange**: Preparação de mocks, stubs e dados de entrada.
     - **Act**: Execução do método sob teste.
     - **Assert**: Validação das asserções e efeitos colaterais.
3. **Isolamento de Efeitos Colaterais**:
   - Comandos Git, operações no sistema de arquivos e requisições HTTP (API OpenAI/Nodemailer) devem ser 100% mockados durante a execução de testes unitários.
4. **Consulta à Estratégia de Testes**:
   - Consulte obrigatoriamente [`docs/TESTING_STRATEGY.md`](file:///d:/GitHub/ai_commit_review/docs/TESTING_STRATEGY.md) para verificar a matriz de testes do módulo antes de submeter alterações.
5. **Proibição de Mudança de State/Branch/Commit**:
   - Ao executar testes automatizados, é **estritamente proibido** realizar trocas de commit, `git checkout`, `git switch` ou alterar a branch atual no repositório de trabalho.

---

## 🏆 5. Golden Files (Padrões Canônicos a Serem Imitados)

Ao criar novos módulos ou refatorar o código existente, utilize os arquivos abaixo como **referência canônica de estilo, coesão e responsabilidade**:

1. [`src/models.js`](file:///d:/GitHub/ai_commit_review/src/models.js):
   - **Motivo**: Definição limpa de enums e estruturas de dados constantes, sem efeitos colaterais e com tamanho reduzido (< 50 linhas).
2. [`src/config.js`](file:///d:/GitHub/ai_commit_review/src/config.js):
   - **Motivo**: Manipulação encapsulada de arquivos JSON com tratamento seguro de exceção e fallbacks bem definidos.
3. [`src/contextManager.js`](file:///d:/GitHub/ai_commit_review/src/contextManager.js):
   - **Motivo**: Módulo desacoplado de responsabilidade única focado no cálculo de tamanho de contexto e truncamento de diffs.
4. [`src/crypto.js`](file:///d:/GitHub/ai_commit_review/src/crypto.js):
   - **Motivo**: Funções puras de criptografia com assinatura clara, entrada/saída determinística e sem dependências ocultas.
