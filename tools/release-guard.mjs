/**
 * Packages that must never reach npm. A path prefix matches every workspace under it.
 * Add a prefix here when you add a new kind of internal package.
 */
export const NEVER_PUBLISH = ['apps/', 'packages/tsconfig', 'packages/eslint-config'];

/**
 * @typedef {{ name: string, path: string, private?: boolean }} Workspace
 * `path` is relative to the repo root, with forward slashes.
 */

const isUnder = (/** @type {Workspace} */ workspace, /** @type {string} */ prefix) =>
  workspace.path === prefix.replace(/\/$/, '') || workspace.path.startsWith(prefix);

/**
 * @param {Workspace[]} workspaces
 * @returns {string[]} human-readable problems; empty means the guard passes
 */
export function findReleaseProblems(workspaces) {
  const problems = [];
  for (const prefix of NEVER_PUBLISH) {
    const matches = workspaces.filter((workspace) => isUnder(workspace, prefix));
    if (matches.length === 0) {
      problems.push(`Guard prefix "${prefix}" matches no workspace; update NEVER_PUBLISH.`);
    }
    for (const workspace of matches.filter((match) => !match.private)) {
      problems.push(`${workspace.name} (${workspace.path}) must be "private": true.`);
    }
  }
  return problems;
}
