# [ADR-0002] Persistência Descentralizada Baseada em Arquivos JSON Locais

* **Status:** Aceito
* **Data / Versão:** Histórico / Inicial
* **Decisores / Contexto:** Camada de Persistência, `src/config.js`, `src/configManager.js`, `src/contextManager.js`

---

## 1. Contexto e Declaração do Problema
O `ai-commit-review` é uma ferramenta CLI desenhada para rodar de forma autônoma na máquina de cada desenvolvedor.
A aplicação precisava armazenar:
1. Preferências de usuário (modelo OpenAI ativo, chave de API, idioma da resposta, URL base).
2. Cache de resumos de diffs para evitar requisições repetidas e caras à API da OpenAI.

Instalar ou exigir um banco de dados relacional (ex: PostgreSQL/SQLite) ou um serviço de cache externo (ex: Redis) traria complexidade excessiva de instalação, portas em conflito e dependências adicionais de infraestrutura para uma CLI utilitária.

---

## 2. Decisão Arquitetural Adotada
Adotou-se o modelo de **Persistência Descentralizada em Arquivos de Documentos JSON (Flat-File JSON Storage)**.

### Detalhes de Implementação:
- **Configurações Globais**: Armazenadas no diretório home do usuário do SO em `~/.ai-commit-review/.config.json` via `fs-extra` (`src/config.js`).
- **Cache Local de Contexto**: Armazenado em `.cache/context.json` no diretório raiz do repositório local (`src/contextManager.js`).
- As leituras e escritas são realizadas de forma síncrona com manipulação defensiva de exceções (`try...catch`) para garantir fallbacks padrão.

---

## 3. Consequências e Trade-offs

* **Impactos Positivos (Ganhos):**
  - **Zero Infraestrutura Externa**: O usuário não precisa rodar containers Docker, instalar bancos de dados ou rodar migrations de banco.
  - **Portabilidade Total**: A aplicação funciona instantaneamente após o `npm install`.
  - **Isolamento de Cache**: O cache de contexto fica escopado ao repositório Git local através da pasta `.cache`.
* **Impactos Negativos / Débitos Aceitos (Trade-offs):**
  - **Ausência de Transações Relacionais Complexas**: Não há suporte nativo para ACID ou locks de banco de dados concorrentes.
  - **Risco de Corrupção por Encerramento Abrupto**: Caso o processo Node seja interrompido no exato instante da gravação, o arquivo JSON pode ser corrompido (mitigado por tratamento defensivo no `loadConfig()`).
* **Diretrizes para Agentes de IA:**
  - **NUNCA** introduza dependências de ORMs ou bancos de dados relacionais (Prisma, TypeORM, Postgres) para a gestão de configurações locais da CLI.
  - Mantenha a validação de chaves via enum `ConfigKeys` em `src/models.js`.
