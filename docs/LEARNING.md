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
