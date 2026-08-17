# 📄 Documentação do Módulo: `src/githubCli.js`

## 📌 Visão Geral
O módulo `src/githubCli.js` é a interface de integração segura com a ferramenta GitHub CLI (`gh`), prevenindo vulnerabilidades de injeção de comandos via repasse de argumentos em array imutável (`execFileSync`).

---

## 🛠️ Dependências
- `child_process.execFileSync`
- `chalk`

---

## 🔄 Funções Exportadas
- `getDeps(deps)`: Fábrica de dependências com fallbacks para `child_process.execSync` e `child_process.execFileSync`.
- `createPullRequest({ base, head, title, body, reviewer }, deps = {})`: Executa `gh pr create` de forma totalmente parametrizada e imune a command injection.

---

## 🧪 Testes e Isolamento de Efeitos Colaterais
- A injeção de dependências (`deps.execSyncFn` e `deps.execFileSyncFn`) é suportada através de `getDeps()` em testes automatizados para evitar execução real de comandos `gh` contra o repositório remoto. Cobertura: **100.00% lines**, **100.00% branches** e **100.00% functions**.
