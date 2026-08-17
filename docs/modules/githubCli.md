# 📄 Documentação do Módulo: `src/githubCli.js`

## 📌 Visão Geral
O módulo `src/githubCli.js` é a interface de integração segura com a ferramenta GitHub CLI (`gh`), prevenindo vulnerabilidades de injeção de comandos via repasse de argumentos em array imutável (`execFileSync`).

---

## 🛠️ Dependências
- `child_process.execFileSync`
- `chalk`

---

## 🔄 Funções Exportadas
- `createPullRequest({ base, head, title, body, reviewer })`: Executa `gh pr create` de forma totalmente parametrizada e imune a command injection.
