# 🤖 GitHub Copilot Instructions for `ai-commit-review`

As an AI assistant helping with this repository, you MUST strictly follow the governance and architectural guidelines established for the project.

## 📌 Primary Mandates

1. **Governance & Guidelines**:
   - Before proposing code edits or new features, review and strictly adhere to [`AGENTS.md`](file:///d:/GitHub/ai_commit_review/AGENTS.md).
   - Review system layout and layered flow in [`docs/ARCHITECTURE.md`](file:///d:/GitHub/ai_commit_review/docs/ARCHITECTURE.md).
   - Review mandatory testing strategy in [`docs/TESTING_STRATEGY.md`](file:///d:/GitHub/ai_commit_review/docs/TESTING_STRATEGY.md).
   - Review security standards in [`docs/SECURITY_AND_RESILIENCE.md`](file:///d:/GitHub/ai_commit_review/docs/SECURITY_AND_RESILIENCE.md).
   - Be aware of dead code and duplication inventory in [`docs/DEAD_CODE_AND_DUPLICATION.md`](file:///d:/GitHub/ai_commit_review/docs/DEAD_CODE_AND_DUPLICATION.md).

2. **Continuous Documentation Maintenance (Docs-as-Code)**:
   - Concurrently update `docs/modules/<module>.md` for any changes in logic, parameters, or DTOs.
   - Prohibit orphaned code without matching documentation.
   - Update `docs/MAP_INDEX.md` when adding new module folders.
   - Mark resolved items in `docs/TECH_DEBT.md` or `docs/DEAD_CODE_AND_DUPLICATION.md`.

3. **Clean Code Constraints**:
   - Keep all functions <= 30 lines.
   - Keep all module files <= 250 lines.
   - Cyclomatic complexity <= 5.
   - Respect the Boy Scout Rule (refactor before adding code to oversized files).

4. **Security Standards**:
   - Never use un-sanitized string interpolation in shell/Git commands (`execSync`). Use array arguments with `execFileSync`.
   - Never hardcode secrets, API keys, or credentials.
   - Do not invoke `process.exit()` inside internal utility functions.

5. **Testing Pattern**:
   - Write tests following the **AAA (Arrange, Act, Assert)** structure.
