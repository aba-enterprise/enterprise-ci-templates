# `preflight-config` action

Merges the per-app `ci-config/config.yml` with the central
`policy/pipeline-policy.yml` (gates) and `policy/pipeline-defaults.yml`
(non-secret defaults), validates every document against its JSON Schema
(`policy/schema/{config,pipeline-policy,pipeline-defaults}.schema.json`), and
exposes the resolved values as typed step outputs.

The app config is schema-checked here because nothing else can — it lives in the
application repo, out of reach of this repo's `policy-validate.yml`.

Replaces the inline `yq`/bash block in the reusable pipeline workflows — the
runner no longer needs `yq`, the logic is unit-tested, and the policy is
schema-checked on every run.

## Usage

```yaml
- uses: actions/checkout@v4
- id: parse
  uses: aba-enterprise/enterprise-ci-templates/actions/preflight-config@v1
  with:
    config-path: ci-config/config.yml   # optional (default)
    environment: nonprod                # optional (nonprod | prod)

# then:  ${{ steps.parse.outputs.vault_addr }} , ${{ steps.parse.outputs.coverage_min }} , ...
```

The action reads the policy files from **its own bundled copy** (same repo, two
directories up), so the workflow does not need a second `actions/checkout` of
the templates repo. `policy-path` / `defaults-path` inputs override that for
local testing. See [`action.yml`](action.yml) for the full output list.

## Layout

| File | Role |
|------|------|
| `src/resolve.ts` | Pure resolution logic (no I/O). All gate/default rules. |
| `src/resolve.test.ts` | Unit tests for the above. |
| `src/config-schema.test.ts` | Contract tests for `policy/schema/config.schema.json`. |
| `src/load.ts` | Path resolution; re-exports `readYaml`/`validate` from `@pipeline/shared`. |
| `src/index.ts` | `@actions/core` glue: inputs → resolve → `setOutput` + job summary. |
| `dist/` | `ncc` bundle — **committed**, executed by `runs.main`. |

Build from the workspace root: `cd actions && npm run all`.
