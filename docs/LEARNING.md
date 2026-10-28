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
  fine because tsup bundles, but wrong for code run directly by Node.
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
