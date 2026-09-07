# `policy/` — central CI/CD governance

Everything in this folder is owned by **Platform / AppSec** and is protected by
`CODEOWNERS`. Application repositories consume these files at pipeline runtime
(via sparse-checkout in the reusable workflows); they cannot edit, disable, or
lower anything here.

| File | `kind` | What it holds | Can it block a merge / deploy? |
|------|--------|---------------|-------------------------------|
| `pipeline-policy.yml` | `PipelinePolicy` | Mandatory gate switches — which scans run, `block` vs `warn`, required tools, coverage floor, waiver rules. | **Yes** |
| `pipeline-defaults.yml` | `PipelineDefaults` | Shared **non-secret** defaults. `common:` = identical everywhere (registry, runner, job limits, the single SonarQube + Veracode instances). `environments:` = per-target (`nonprod` / `prod`) endpoints for Vault, Artifactory, Prisma. | No |
| `deploy-defaults.yml` | `DeployDefaults` | Shared **non-secret** CD defaults. `common:` = OIDC deploy-role naming pattern. `environments:` = per-env (`dev` / `uat` / `prod`) AWS account, region, default strategy, soak time. Consumed by the `preflight-deploy` action. Per-app resource names live in `<app>-config/deploy/<env>.yml` (`infra:`), not here. | No |
| `schema/pipeline-{policy,defaults}.schema.json` | — | JSON Schema for the two `pipeline-*` files above, enforced by the `Validate CI policy` workflow on every PR touching `policy/`. | — |
| `schema/config.schema.json` | — | JSON Schema for the **per-app** `ci-config/config.yml`. Not an instance in this repo — the `preflight-config` action validates each app's config against it at pipeline runtime. Requires `apiVersion` (`ci/v1`), `metadata` (`name` + `language`), and `test.command`; rejects unknown keys. | — |
| `schema/deploy-config.schema.json` | — | JSON Schema for the **per-app** `deploy/<env>.yml` in each `<app>-config` repo. The `preflight-deploy` action validates it at deploy time. Requires `apiVersion` (`cd/v1`), `service` (`name` + `target`), `environment.name`, and `release.strategy`; rejects unknown keys. | — |
| `schema/deploy-defaults.schema.json` | — | JSON Schema for `deploy-defaults.yml`. | — |

## Rules

- **No secrets** in either file. Endpoints and Vault role names are fine;
  tokens/keys stay in GitHub secrets or Vault.
- Environment-scoped values: the workflow resolves `nonprod` for CI and
  lower-env deploys, `prod` for production promotion —
  `com ".environments.${ENV}.vault.addr"`. Only add a service under
  `environments:` if it genuinely differs by target; one-instance services
  (SonarQube, Veracode) live in `common:`.
- Both files carry `apiVersion: pipeline.aba-enterprise/v1` + a `kind`. Bump the
  version only for a breaking schema change, and ship both versions during
  rollout.
- Swapping a scan tool is a one-line change in `pipeline-policy.yml` (`tool:` +
  its `with:` block). App `config.yml` files never change — their keys are named
  by function (`scan.sast`, `scan.image`), not by product.
- The only way past a gate is a signed, time-boxed waiver — see `exceptions` in
  `pipeline-policy.yml`.

## Consumers

- `.github/workflows/ci-template.yml` → `load-ci-config` job sparse-checks-out
  this folder and parses both files (`pol()` / `com()` / `envd()` yq helpers).
  Its `environment` input (default `nonprod`) selects the `environments.*`
  block; every resolved endpoint is exposed as a job output
  (`vault_addr`, `artifactory_maven_repo`, `sonarqube_url`, …).
- Consumers should pin a **tag or SHA** of this repo, never `@main`, so a policy
  change is a deliberate, reviewable rollout.

## Validate locally

```bash
pipx install check-jsonschema
check-jsonschema --schemafile policy/schema/pipeline-policy.schema.json   policy/pipeline-policy.yml
check-jsonschema --schemafile policy/schema/pipeline-defaults.schema.json policy/pipeline-defaults.yml
```
