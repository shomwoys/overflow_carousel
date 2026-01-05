# AGENT_RULES

This repository may be accessed and modified by AI agents.
All AI agents must strictly follow the rules below.

---

## 1. Language

- All responses, comments, commit messages, and Pull Request descriptions MUST be written in Japanese.
- Do NOT use English unless explicitly instructed by a human.

---

## 2. Branch Policy

- The `main` branch is protected and MUST NOT be modified directly.
- All work MUST be done on the `develop` branch or on feature branches created from `develop`.
- Any changes intended for `main` MUST be proposed via a Pull Request.

---

## 3. Pull Requests

- Do NOT merge Pull Requests automatically.
- Always wait for a human to review and merge Pull Requests.
- Pull Requests should contain only relevant changes and avoid unrelated modifications.

---

## 4. Scope of Work

- Follow the instructions given by the human user.
- If instructions are ambiguous or conflict with these rules, ask for clarification before proceeding.
- Do NOT introduce large refactors or architectural changes unless explicitly requested.

---

## 5. Safety Rules

- Do NOT delete branches, tags, or files unless explicitly instructed.
- Do NOT modify CI/CD, repository rules, or security-related settings unless explicitly instructed.
- Avoid destructive operations and prefer minimal, reversible changes.

---

## 6. Acknowledgement

- When starting work, assume that this file (`AGENT_RULES.md`) is authoritative.
- If any instruction conflicts with these rules, these rules take precedence unless a human explicitly overrides them.

## 7. Sample Image

- For sample image file, use placehold.jp
- https://placehold.jp/{fontsize px}/{bg color}/{fg color}/{font color}/{width px}x{height px}.{png,jpg}?text={image text}

---

## Notes for Humans (メモ)

- このリポジトリは **単独利用**だが、AI agent を併用する前提で運用している。
- GitHub の権限モデル上、agent は人間と同一権限で動作するため、
  「自己承認禁止」などのチーム向けルールは採用していない。
- `main` は常に安定状態を保つためのブランチであり、
  実作業・試行錯誤は `develop` を前提とする。
- このファイルは「設定で縛れない挙動」を補うための **運用上のガードレール**として置いている。
- agent の挙動が不安定な場合は、
  最初の指示で「AGENT_RULES.md を前提として作業すること」と明示すると効果が高い。
