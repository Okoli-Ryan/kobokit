# Coding rules

Every line here must be explainable in an interview. Where possible, ESLint enforces these rules
(wired up in `packages/eslint-config`), so they fail `pnpm lint` instead of drifting.

## Size

- A file has at most 150 lines (`max-lines`).
- A function has at most 30 lines (`max-lines-per-function`).
- Cyclomatic complexity is at most 8 (`complexity`).
- A file does one thing. If its name needs "and", split it.

## Style

- Named exports only; no default exports (except where a framework requires them).
- No `any`. Use `unknown` and narrow it.
- Prefer small pure functions over classes. Side effects (I/O, time, randomness) go at the edges.
- Name things for what they mean in the domain (`narration`, `balance`), not how they are stored.
- Comments explain why, not what.

## React

- Components stay small and render only. Logic moves into hooks or plain helper functions.
- One component per file.

## Data and safety

- Never commit real personal or customer data. All fixtures are synthetic.
- Never state facts about banks, laws or companies unless sourced. If unsure, leave a `TODO`.
- Money is never a floating-point number. (Details arrive with `statement-math`.)

## Process

- Tests land in the same commit as the code.
- One commit per step, with a message that says why.
- Every decision gets a line in `docs/DECISIONS.md`; every new concept gets an entry in
  `docs/LEARNING.md`.
