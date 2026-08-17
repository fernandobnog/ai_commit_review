# 🤖 Claude Directives & Guidelines for `ai-commit-review`

Before inspecting, refactoring, or writing any code in this repository, you MUST consult and enforce the project's strict governance rules.

## 📋 Mandatory References
- **Rules & Governance Matrix**: [`AGENTS.md`](file:///d:/GitHub/ai_commit_review/AGENTS.md)
- **System Architecture**: [`docs/ARCHITECTURE.md`](file:///d:/GitHub/ai_commit_review/docs/ARCHITECTURE.md)
- **Testing Strategy**: [`docs/TESTING_STRATEGY.md`](file:///d:/GitHub/ai_commit_review/docs/TESTING_STRATEGY.md)
- **Security & Resilience**: [`docs/SECURITY_AND_RESILIENCE.md`](file:///d:/GitHub/ai_commit_review/docs/SECURITY_AND_RESILIENCE.md)
- **Dead Code & Duplication**: [`docs/DEAD_CODE_AND_DUPLICATION.md`](file:///d:/GitHub/ai_commit_review/docs/DEAD_CODE_AND_DUPLICATION.md)

## 🎯 Code Quality, Docs & Security Checklist
- [ ] Concurrently update `docs/modules/<module>.md` for any changes in logic, parameters, or contracts.
- [ ] No orphaned code without documentation updates.
- [ ] Update `docs/MAP_INDEX.md` when adding new module folders.
- [ ] Functions must be <= 30 lines.
- [ ] Files must be <= 250 lines.
- [ ] Cyclomatic complexity must be <= 5.
- [ ] Inputs must be validated and sanitized before passing to `git` / shell calls.
- [ ] No un-sanitized string interpolation in shell calls (`execSync`); use `execFileSync` with argument arrays.
- [ ] No hardcoded secrets or API keys.
- [ ] Exception handling must be centralized in `cli.js`; do not call `process.exit()` in utility modules.
- [ ] Write mandatory AAA tests for any new use case or utility.
- [ ] Follow Golden Files patterns ([`src/models.js`](file:///d:/GitHub/ai_commit_review/src/models.js), [`src/config.js`](file:///d:/GitHub/ai_commit_review/src/config.js), [`src/contextManager.js`](file:///d:/GitHub/ai_commit_review/src/contextManager.js), [`src/crypto.js`](file:///d:/GitHub/ai_commit_review/src/crypto.js)).
