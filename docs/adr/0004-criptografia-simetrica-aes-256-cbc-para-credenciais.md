# [ADR-0004] Criptografia Simétrica AES-256-CBC para Proteção de Credenciais

* **Status:** Aceito
* **Data / Versão:** Histórico / Inicial
* **Decisores / Contexto:** `src/crypto.js`, `src/configManager.js`

---

## 1. Contexto e Declaração do Problema
O sistema precisa lidar com dados sensíveis, especificamente a chave de API da OpenAI (`OPENAI_API_KEY`) para clientes corporativos NTAPP ou quando criptografada no terminal via `acr crypto`.
Salvar chaves corporativas ou tokens em texto claro em arquivos compartilhados ou versionados representa um risco grave de segurança da informação.

---

## 2. Decisão Arquitetural Adotada
Decidiu-se utilizar o algoritmo de criptografia simétrica **AES-256-CBC (`aes-256-cbc`)** nativo do módulo `crypto` do Node.js, encapsulado em [`src/crypto.js`](file:///d:/GitHub/ai_commit_review/src/crypto.js).

### Detalhes de Implementação:
- Derivação de chave via `crypto.scryptSync(password, salt, 32)` baseada na variável de ambiente `PASSWORD_CRYPTO_KEY`.
- Aplicação de cifragem dupla (`criptografar` chama `criptografarsimples` 2 vezes seguidas).
- Exportação de utilitários `decriptografar` e comando interativo CLI `criptografarcli`.

---

## 3. Consequências e Trade-offs

* **Impactos Positivos (Ganhos):**
  - **Proteção contra Leitura Direta**: Credenciais em repouso no `.config.json` ou variáveis de ambiente padrão NTAPP são mantidas cifradas.
  - **Zero Dependências Externas**: Utiliza a biblioteca nativa `crypto` do Node.js sem pacotes npm de terceiros.
* **Impactos Negativos / Débitos Aceitos (Trade-offs):**
  - **Débit de Segurança Identificado em Auditoria (IV & Salt Fixo)**: O código utiliza um IV zerado estático (`Buffer.alloc(16, 0)`) e salt fixo `'sal'`. Conforme documentado em `docs/SECURITY_AND_RESILIENCE.md`, isso torna a cifragem determinística (débito aceito a ser corrigido em versão futura para IV aleatório).
* **Diretrizes para Agentes de IA:**
  - NUNCA armazene chaves de API corporativas NTAPP em texto claro em arquivos de código ou documentação pública.
  - Certifique-se de que `PASSWORD_CRYPTO_KEY` esteja presente no ambiente ao testar funções de cifragem.
