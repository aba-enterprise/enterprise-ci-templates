# `preflight-deploy` action

Validates a per-app `deploy/<env>.yml` against
`policy/schema/deploy-config.schema.json`, merges it with the central
`policy/deploy-defaults.yml`, and exposes the resolved release values and AWS
coordinates as typed step outputs for [`cd-template.yml`](../../.github/workflows/cd-template.yml).

Same shape as [`preflight-config`](../preflight-config) — a bundled TypeScript
action, pure resolver + `@actions/core` glue, policy files bundled from this repo
(two directories up), `@pipeline/shared` for YAML load + JSON Schema validation.

## Usage

```yaml
- uses: actions/checkout@v4
- id: cfg
  uses: aba-enterprise/enterprise-ci-templates/actions/preflight-deploy@v1
  with:
    config-path: deploy            # dir of per-env files (default)
    environment: prod              # -> deploy/prod.yml
    version: sha256:abc123         # optional; overrides release.version

# then: ${{ steps.cfg.outputs.deploy_role }}, ${{ steps.cfg.outputs.ssm_prefix }}, ...
```

`validate-only: true` schema-checks the file and exits without emitting outputs —
used by the config repo's PR check.

## What it resolves

| Group | Outputs |
|-------|---------|
| routing | `service_name`, `target`, `environment`, `region`, `account_id`, `deploy_role`, `session_name`, `ssm_prefix` |
| release | `version` (`''` = latest, dev only), `strategy`, `require_approval`, `bake_minutes` |
| runtime | `desired_count`, `cpu`, `memory`, `container_port`, `timeout_seconds`, `runtime_env_json`, `secret_names` |
| scaling / health | `scale_min`, `scale_max`, `scale_target_cpu`, `health_path`, `health_grace_seconds` |
| static site | `s3_source_dir`, `s3_cache_control`, `s3_invalidate_paths` |

Rules enforced by the resolver (beyond the schema):

- `environment` must exist in `deploy-defaults.yml`.
- `release.version` is required unless `environment: dev`.
- `strategy` / `bakeMinutes` fall back to the env's defaults when the file omits them.
- the file's `environment.name` must match the `environment` input.

## Layout

| File | Role |
|------|------|
| `src/resolve.ts` | Pure resolution logic (no I/O). |
| `src/resolve.test.ts` | Unit tests for the above. |
| `src/load.ts` | Path resolution; re-exports `readYaml`/`validate` from `@pipeline/shared`. |
| `src/index.ts` | `@actions/core` glue: inputs → validate → resolve → `setOutput` + job summary. |
| `dist/` | `ncc` bundle — **committed**, executed by `runs.main`. |

Build from the workspace root: `cd actions && npm run all`.
