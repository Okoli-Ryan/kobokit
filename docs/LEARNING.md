# Learning log

One entry per new concept. Template:

## Concept name

- **Analogy:**
- **Minimal example:**
- **Gotchas:**
- **Interview questions:**

---

## Turborepo task pipeline and cache

- **Analogy:** A kitchen with a recipe board. The board says "plating needs sauce, sauce needs
  stock". Turbo reads the board (`dependsOn`), runs independent steps in parallel, and if you
  made the exact same stock yesterday with the same ingredients, it takes it from the fridge
  (the cache) instead of cooking again.
- **Minimal example:** `turbo.json`

  ```json
  { "tasks": { "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] } } }
  ```

  `^build` means "build my workspace dependencies first". `outputs` tells Turbo which files to
  save and restore.

- **How the cache works:** for each task Turbo hashes the inputs (the package's files, its
  dependencies' hashes, the task config, the lockfile, declared env vars). Same hash means it
  replays the saved logs and restores `outputs`. Different hash means it runs the task.
- **Gotchas:** forget `outputs` and a cache hit restores nothing, so the build "passes" but
  `dist` is missing. Env vars that change behaviour must be declared, or the cache ignores them.
  Tasks must be deterministic; a task reading the clock or network defeats caching.
- **Interview questions:** What does `^` mean in `dependsOn`? What goes into the cache key? How
  would you share cache between CI and laptops? (Remote Cache.) Why can a cache hit be wrong?

## Why workspaces beat separate repos here

- **Analogy:** One house with several rooms sharing plumbing, versus several flats each with
  their own boiler. If you change the pipe layout, in the house you fix it once and test the
  whole house.
- **Minimal example:** `pnpm-workspace.yaml` lists `apps/*` and `packages/*`. A package depends
  on a sibling with `"@kobokit/statement-math": "workspace:*"`; pnpm links the local folder
  instead of downloading from npm.
- **Gotchas:** every package still needs its own correct `package.json` (`exports`, `files`),
  because that is what npm users get. The workspace link can hide a bad `exports` map, which is
  why `typecheck` and `test` build dependencies first. Versions are no longer implicit, so
  you need a release tool (Changesets).
- **Interview questions:** When would you split into separate repos? (Different owners, release
  cadence, or access control.) What does `workspace:*` become when published? What is phantom
  dependency, and how does pnpm prevent it?

## pnpm catalogs

- **Analogy:** A shared price list on the shop wall. Each product tag says "price: see list", so
  changing the list changes every tag.
- **Minimal example:** `pnpm-workspace.yaml` has `catalog: { typescript: ~6.0.3 }`; a package
  writes `"typescript": "catalog:"`.
- **Gotchas:** `catalog:` is replaced with the real version when a package is published, so
  consumers never see it. An upgrade now touches every package at once, so Turbo's cache misses
  everywhere. A bad pin affects the whole repo.
- **Interview questions:** Catalog versus `overrides`? (Catalogs are explicit per dependency;
  overrides force a version everywhere, including transitive dependencies.) How does it help
  keep one TypeScript version?

## Strict TypeScript options worth defending

- **Analogy:** Smoke alarms. `strict` is the standard alarm; `noUncheckedIndexedAccess` is the one
  in the cupboard you forgot, which fires when you assume the shelf is not empty.
- **Minimal example:**

  ```ts
  const amounts: number[] = [];
  const first = amounts[0]; // number | undefined with noUncheckedIndexedAccess
  first.toFixed(2); // error: possibly undefined
  ```

- **Gotchas:** `verbatimModuleSyntax` forces `import type` for types, so the compiler never has
  to guess what to erase. `moduleResolution: Bundler` lets imports omit file extensions, which is
  fine because tsdown bundles, but wrong for code run directly by Node.
- **Interview questions:** What does `strict` turn on? Why is `noUncheckedIndexedAccess` not in
  `strict`? What is the difference between `Bundler` and `NodeNext` resolution?

## ESLint flat config, and testing your lint rules

- **Analogy:** A building code and an inspector. The config is the code; the test feeds the
  inspector a deliberately bad blueprint and checks it gets rejected.
- **Minimal example:**

  ```ts
  const [result] = await new ESLint({
    overrideConfigFile: true,
    overrideConfig: baseConfig,
  }).lintText('export const x: any = 1;', { filePath });
  expect(result.messages.map((m) => m.ruleId)).toContain('@typescript-eslint/no-explicit-any');
  ```

- **Gotchas:** Flat config is an array; later entries override earlier ones, and `files` globs
  scope a block. A rule that is silently off (a typo in the name, a wrong glob) looks identical
  to a rule that passes, which is why the negative tests matter. Plugins declare which ESLint and
  TypeScript versions they support; ignoring that is how this step hit two version problems.
- **Interview questions:** How is flat config different from `.eslintrc`? Why `max-lines` and
  `complexity` rather than review comments? What is the cost of type-aware linting?

## What tsdown produces, and why both ESM and CJS

- **Analogy:** A printing press making one book in two editions: a modern paperback (ESM,
  `import`) and an older hardback (CJS, `require`), plus an index card (`.d.ts`) that tells
  readers' editors what is inside without opening the book.
- **Minimal example:** `tsdown.config.ts`

  ```ts
  export default defineConfig({ entry: ['src/index.ts'], format: ['esm', 'cjs'], dts: true });
  ```

  Output for each library: `dist/index.mjs` (ESM), `dist/index.cjs` (CJS), `dist/index.d.mts` and
  `dist/index.d.cts` (types for each), plus source maps.

- **Why both:** a consumer's tool decides the format, not you. Older Node tooling and Jest setups
  still `require()`; modern apps `import`. Recent Node versions can `require()` ESM in many
  cases, which weakens the case for CJS over time, but shipping both is still the safe default for
  a public library.
- **Gotchas:** if the same package is loaded once as ESM and once as CJS, you get two copies, so
  module-level state (a cache, a singleton, `instanceof`) can disagree. This is the dual-package
  hazard; keep libraries stateless. tsdown writes the bundle and the declarations in separate
  steps, so a green JavaScript build says nothing about the types: run `check-package` too.
- **Interview questions:** What does tsdown do that `tsc` does not? What is the dual-package hazard?
  Why does a `.d.cts` file exist? When would you drop CJS?

## The `exports` map

- **Analogy:** A building with named doors. Each door (`import`, `require`) leads to one room,
  and anything without a door is walled off, so nobody can reach into `dist/internal.js`.
- **Minimal example:**

  ```json
  "exports": {
    ".": {
      "import": { "types": "./dist/index.d.mts", "default": "./dist/index.mjs" },
      "require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" }
    }
  }
  ```

- **Gotchas:** inside each condition, `types` must come before `default`, because the first
  matching condition wins. `main`, `module` and `types` at the top level exist only for old
  resolvers that ignore `exports`. `module` is a bundler convention, not part of Node. Always
  test the published shape (`publint`, `attw`), because the workspace link hides mistakes.
- **Interview questions:** What happens to a deep import not listed in `exports`? What does a
  condition's order mean? Why can types resolve while the runtime import fails, or the reverse?

## pnpm's build-script allowlist

- **Analogy:** A building's visitor policy. Packages arriving with an "install script" are
  stopped at reception until someone approves them.
- **Gotchas:** install scripts run arbitrary code on your machine during `pnpm install`, which is
  a classic supply-chain attack route, so pnpm 11 denies them by default. Verify the build and
  tests still work before granting access; here esbuild did not need its script.
- **Interview questions:** Why are install scripts risky? What does `allowBuilds` record, and why
  commit it?

## Testing React with Jest and React Testing Library

- **Analogy:** A mystery shopper. RTL does not inspect the shop's wiring (component state); it
  walks in, looks for "the button labelled Pay" the way a customer would, and reports whether it
  can find it.
- **Minimal example:**

  ```tsx
  render(<PdfSourceViewer documentTitle="Sample statement" />);
  expect(screen.getByRole('region', { name: 'Sample statement' })).toBeInTheDocument();
  ```

- **Gotchas:** query by role and accessible name, not by class or test id, so tests also check
  accessibility. `jsdom` simulates the DOM but has no layout, so widths and positions are
  always zero. `@swc/jest` removes types without checking them, so a green test says nothing
  about types; `tsc` does that. While wiring this up I lost a backslash in a transform regex;
  the pattern still matched by accident, and only the lint rule `no-useless-escape` caught it.
- **Interview questions:** Why `getByRole` over `getByTestId`? What does jsdom not do? Why keep
  type checking separate from the test transform? What does `render` clean up between tests?

## Peer dependencies

- **Analogy:** A plug adapter. It does not bring its own mains socket; it expects the wall to
  have one, and two sockets in one wall would be a hazard.
- **Minimal example:** `"peerDependencies": { "react": "^19.0.0" }`, with React also in
  `devDependencies` so the library's own tests can run.
- **Gotchas:** if the library bundled its own React, hooks would break ("invalid hook call"),
  because the app and the library would hold two Reacts. A peer range promises compatibility
  you must have tested. Bundlers must leave the peer external, which we checked in the built
  output (`react/jsx-runtime` is imported, not inlined).
- **Interview questions:** Dependency versus peer dependency? Why is React usually a peer? What
  breaks if a peer range is wider than what you tested?

## TanStack Start and file-based routing

- **Analogy:** A hotel where the room numbers are painted on doors by the building itself. You
  put a file in `src/routes/` and the framework works out the door (URL) and updates the
  directory (the route tree) for you.
- **Minimal example:** `src/routes/index.tsx`

  ```tsx
  export const Route = createFileRoute('/')({ component: HomePage });
  ```

  The Vite plugin `tanstackStart()` reads `src/routes/` and writes `src/routeTree.gen.ts`, which
  `getRouter()` imports.

- **Gotchas:** the React Vite plugin must come after the Start plugin. `routeTree.gen.ts`
  appears only after the first `dev` or `build`, so we commit it (it marks itself as generated;
  lint and Prettier skip it). Start runs your code on the server and in the browser;
  `verbatimModuleSyntax` can leak server code into the client bundle, so apps turn it off.
- **Interview questions:** What does the router plugin generate, and why commit it? How does
  server-side rendering differ from a single-page app? Why does plugin order matter in Vite?

## Testing a Node server without fixed ports

- **Analogy:** Asking the hotel for any free room instead of insisting on room 301, so two guests
  never fight over it.
- **Minimal example:** `server.listen(0, () => { const { port } = server.address() as AddressInfo; })`
- **Gotchas:** close the server in `afterEach`, or the test process hangs. Port 0 asks the
  operating system for a free port. Keeping the HTTP wiring in `createApiServer()` and the
  `listen` call in `main.ts` lets tests start the server without side effects at import time.
- **Interview questions:** Why separate creating a server from listening? What would a flaky
  port conflict in CI look like?

## How Changesets turns a change note into a version bump

- **Analogy:** Order slips in a restaurant. Each pull request clips a slip to the rail ("statement-math:
  minor, added a function"). At release time the head chef collects every slip, prints one
  combined ticket (the changelog), and raises the menu's version number once.
- **Minimal example:** a note is a markdown file in `.changeset/`

  ```md
  ---
  '@kobokit/statement-math': minor
  ---

  Add exact subtraction.
  ```

  `pnpm version-packages` reads all notes, picks the highest bump per package (major beats
  minor beats patch), updates `package.json`, writes `CHANGELOG.md`, and deletes the used notes.
  `pnpm release` then builds and runs `changeset publish`.

- **What I saw here:** two notes produced `statement-math` 0.0.0 to 0.1.0 and `narration-parser`
  0.0.0 to 0.0.1. Packages without a note stayed put, and the changelog came from the note text.
- **Gotchas:** a note naming a private package (an app) is skipped and also left behind, so it
  never gets cleaned up. Changesets only knows what people write down, so a CI check that a
  pull request carries a note is worth adding (see decision 75). Before 1.0, a minor bump from 0.0.0 gives 0.1.0.
  When a package changes, packages that depend on it get a patch bump
  (`updateInternalDependencies`). `workspace:*` is rewritten to a real version at publish.
- **Interview questions:** How does Changesets choose the bump when two notes touch one
  package? How does it differ from semantic-release? What stops an app from being published?
  (`private: true`, plus our guard.) What happens to dependents of a bumped package?

## Turborepo caching in GitHub Actions

- **Analogy:** A shared fridge across kitchen shifts. Each shift (CI run) starts with an empty
  kitchen, so we carry the previous shift's leftovers in a cool box (`actions/cache`) and only
  cook what changed.
- **Minimal example:**

  ```yaml
  - uses: actions/cache@<sha> # v6.1.0
    with:
      path: .turbo/cache
      key: turbo-${{ runner.os }}-${{ github.sha }}
      restore-keys: |
        turbo-${{ runner.os }}-
  ```

  The exact key never matches (each commit is new), so `restore-keys` loads the newest earlier
  entry by prefix. Turbo then checks each task's own hash and skips what has not changed.

- **Gotchas:** the cache holds task outputs, not a verdict about your code, so a stale cache can
  never make a changed package pass. Cache entries are evicted by GitHub after a while. The
  cache only helps if tasks declare their `outputs` correctly.
- **Interview questions:** Why a unique key plus `restore-keys`? Local cache versus Remote Cache?
  What would break if `outputs` were wrong?

## Pinning actions to commit SHAs

- **Analogy:** Ordering a book by its ISBN instead of "the latest edition". The title can be
  reprinted with different pages; the ISBN cannot.
- **Minimal example:** `uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1`
- **Gotchas:** a tag like `v7` is a pointer the maintainer (or an attacker with their access)
  can move, so a workflow can start running different code with no change in your repo. Pinning
  a SHA freezes it, but pins go stale, so Dependabot opens update pull requests. For an annotated
  tag, resolve the commit SHA, not the tag object's SHA. Keep the version in a comment.
- **Interview questions:** Why does pinning matter more for a job that can publish? What does
  Dependabot do about stale pins? Which actions need pinning most?

## Trusted Publishing and least-privilege job permissions

- **Analogy:** A hotel key card that opens one door for one night, issued at check-in, versus a
  master key left in a drawer. An `NPM_TOKEN` secret is the master key; OIDC trusted publishing
  is the card.
- **Minimal example:**

  ```yaml
  permissions: {} # nothing by default
  jobs:
    publish:
      permissions:
        contents: write
        id-token: write # lets this job prove who it is to npm
  ```

- **Gotchas:** only the publish job gets `id-token: write`, so the install and build jobs cannot
  mint publishing credentials even if a dependency is compromised. npm must be configured to
  trust the repository and workflow for each package; that lives on npmjs.com, not in this repo.
  The version pull request needs the repository setting "Allow GitHub Actions to create and
  approve pull requests". Workflows triggered by `pull_request_target` run with write access and
  must never run untrusted code.
- **Interview questions:** What does OIDC replace? Why split pack and publish into separate jobs?
  What is the blast radius of a leaked `NPM_TOKEN` compared with trusted publishing?

## Secret scanning

- **Analogy:** A metal detector at the door, plus a sweep of the whole building history, since
  a key dropped last year is still a key.
- **Gotchas:** secrets live in git history, so the scan checks out every commit
  (`fetch-depth: 0`). Deleting a leaked secret in a later commit does not help; rotate it. A
  scanner finds patterns, so it cannot prove a repo is clean. `.env` is ignored by git and
  `.env.example` holds only empty values.
- **Interview questions:** Why scan history, not only the latest commit? What do you do after a
  key is committed? What are false positives and how do you suppress them?

## What the first real CI run found that local checks could not

- **Analogy:** A dress rehearsal in the real theatre. Everything worked in the rehearsal room (my
  Windows machine, then a Linux container), but the stage had one trapdoor nobody had seen.
- **What happened:** the CI job passed every step on GitHub's runners. Two things failed.
  1. The gitleaks action scans only `firstPushedCommit^..lastPushedCommit`. On a first push that
     first commit is the root, which has no parent, so git errored and gitleaks scanned 0 bytes.
     It also never rescans older history. Fix: run the gitleaks CLI over the whole history.
  2. With no changesets, the release workflow selected publish mode and tried to publish every
     package whose version is not on npm, including `0.0.0` placeholders. It failed with E404 only
     because the packages do not exist yet.
- **Gotchas:** a green check that scanned nothing is worse than a red one; read what a tool
  actually did, not just its colour. A tool's description ("scans your history") can be broader
  than its behaviour. A publish pipeline needs a safe default when there is nothing to release.
  Pin tool downloads by checksum, and note that Dependabot cannot update those pins.
- **Interview questions:** How would you know a secret scanner really scanned something? Why does
  `^` on a root commit fail? What should a release workflow do when there are no changesets?
  Why test a pipeline on the real runner as well as locally?
