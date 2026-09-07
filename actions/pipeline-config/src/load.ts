// Path resolution specific to this action. Generic YAML + schema helpers live
// in @pipeline/shared.

import * as path from "path";

export { readYaml, validate } from "@pipeline/shared";

/**
 * The action ships with its own copy of policy/ (same repo). GITHUB_ACTION_PATH
 * points at the dir containing action.yml; the policy folder is two levels up
 * (actions/pipeline-config -> actions -> repo root -> policy).
 */
export function bundledPolicyDir(): string {
  const actionPath =
    process.env.GITHUB_ACTION_PATH ?? path.join(__dirname, "..");
  return path.resolve(actionPath, "..", "..", "policy");
}

export function resolveInWorkspace(p: string): string {
  if (path.isAbsolute(p)) return p;
  const ws = process.env.GITHUB_WORKSPACE ?? process.cwd();
  return path.join(ws, p);
}
