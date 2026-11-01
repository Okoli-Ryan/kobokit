/**
 * @typedef {{ name: string, path: string }} Workspace
 * `path` is relative to the repo root, with forward slashes; the root workspace has an empty path.
 */

/**
 * Every workspace must appear in the README's package table, written as `path` in backticks.
 *
 * @param {Workspace[]} workspaces
 * @param {string} readmeText
 * @returns {string[]} human-readable problems; empty means the README lists everything
 */
export function findUndocumentedWorkspaces(workspaces, readmeText) {
  return workspaces
    .filter((workspace) => workspace.path !== '')
    .filter((workspace) => !readmeText.includes(`\`${workspace.path}\``))
    .map((workspace) => `${workspace.name} is missing from the README: add \`${workspace.path}\`.`);
}
