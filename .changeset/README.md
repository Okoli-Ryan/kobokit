# Changesets

A changeset is a small note saying which packages changed and how (patch, minor or major).

- Add one with `pnpm changeset` in every pull request that changes a published package.
- Do not edit `package.json` versions or `CHANGELOG.md` by hand; `pnpm version-packages` does it.
- Apps and the shared config packages are `private: true`, so they are never versioned or published.
  `pnpm check:release` fails if that ever stops being true.
