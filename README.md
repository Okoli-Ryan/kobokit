# kobokit

[![CI](https://github.com/Okoli-Ryan/kobokit/actions/workflows/ci.yml/badge.svg)](https://github.com/Okoli-Ryan/kobokit/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Credit bureaus cover only a small share of Nigerians, so lenders rely on bank statements to decide
who can borrow. kobokit is a set of open-source tools that make statement analysis open,
explainable and testable: generate realistic synthetic statements, parse transaction narrations, do
the arithmetic exactly, show where on the PDF every number came from, and check a lender's practices
against digital-lending rules.

<!-- TODO: cite a source for the bureau-coverage claim before publishing, and keep it qualitative until then. -->

> **Status: early.** Every package is a placeholder with one export and one test, and nothing is
> published to npm yet. The tooling around them (build, lint, test, CI, release) is the part that
> is finished.

## Packages

| Package                        | Path                           | What it will do                                           | Ships to npm  |
| ------------------------------ | ------------------------------ | --------------------------------------------------------- | ------------- |
| `@kobokit/statement-generator` | `packages/statement-generator` | Generate synthetic bank statements for testing            | Yes           |
| `@kobokit/narration-parser`    | `packages/narration-parser`    | Parse transaction narrations into structured data         | Yes           |
| `@kobokit/statement-math`      | `packages/statement-math`      | Exact arithmetic for statements (no floating-point money) | Yes           |
| `@kobokit/pdf-source-viewer`   | `packages/pdf-source-viewer`   | React viewer that highlights the PDF source of a value    | Yes           |
| `@kobokit/mcp-server`          | `packages/mcp-server`          | MCP server exposing kobokit tools to AI assistants        | Yes           |
| `@kobokit/analyser-api`        | `apps/analyser-api`            | Node API for the full statement analyser                  | No (app)      |
| `@kobokit/analyser-web`        | `apps/analyser-web`            | TanStack Start web app for the statement analyser         | No (app)      |
| `@kobokit/compliance-checker`  | `apps/compliance-checker`      | TanStack Start app that checks digital-lending rules      | No (app)      |
| `@kobokit/tsconfig`            | `packages/tsconfig`            | Shared strict TypeScript presets                          | No (internal) |
| `@kobokit/eslint-config`       | `packages/eslint-config`       | Shared ESLint config, including the size limits           | No (internal) |

Apps and internal packages are `private: true`, and `pnpm check:release` fails if that changes.

## Run it locally

You need Node 24 (see `.nvmrc`) and pnpm 11.18. `engines` allows Node 22.19 or newer, but only 24
is tested.

```bash
npm install -g pnpm@11.18.0
```

```bash
pnpm install
```

Run everything CI runs, in the same order:

```bash
pnpm run verify
```

Or run the pieces:

| Command                                         | What it does                                  |
| ----------------------------------------------- | --------------------------------------------- |
| `pnpm turbo run lint typecheck test build`      | The four core checks across every package     |
| `pnpm check-package`                            | Verify each published package's `exports` map |
| `pnpm format`                                   | Format everything with Prettier               |
| `pnpm --filter @kobokit/analyser-web dev`       | Web app on <http://localhost:3000>            |
| `pnpm --filter @kobokit/compliance-checker dev` | Compliance checker on <http://localhost:3002> |

The API has no dev script yet. Build it, then start it (port 3001, or set `PORT`):

```bash
pnpm --filter @kobokit/analyser-api build
```

```bash
pnpm --filter @kobokit/analyser-api start
```

To use an LLM later, copy `.env.example` to `.env` and fill in `OPENAI_API_KEY` and `OPENAI_MODEL`.
`.env` is git-ignored. Never commit real keys; CI scans history with gitleaks.

## Releasing

Versions are managed with [Changesets](https://github.com/changesets/changesets). In any pull
request that changes a published package, run `pnpm changeset` and describe the change. When it
merges, a "Version Packages" pull request is meant to collect the notes; merging that should publish
to npm through GitHub Actions using npm Trusted Publishing, so no npm token is stored. This flow has run once: verification and packing passed, and
publishing failed because the packages do not exist on npm yet. See
[`docs/DECISIONS.md`](docs/DECISIONS.md) for the setup you must do once on npmjs.com and GitHub.

## Project docs

- [`docs/DECISIONS.md`](docs/DECISIONS.md): every decision, the alternative, and why.
- [`docs/LEARNING.md`](docs/LEARNING.md): the concepts behind the tooling, with analogies and interview questions.
- [`docs/CODING_RULES.md`](docs/CODING_RULES.md): the readability rules ESLint enforces.

## Licence

[MIT](LICENSE) © 2026 Ugochukwu Okoli
