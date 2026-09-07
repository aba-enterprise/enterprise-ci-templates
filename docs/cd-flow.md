# CD flow — end to end

How a built artifact reaches an AWS environment. Companion to [`ci-flow.md`](ci-flow.md).

- **Scope:** CD only — assume role, read coordinates, deploy, soak. No build.
- **Entry point:** [`.github/workflows/cd-template.yml`](../.github/workflows/cd-template.yml) (`name: Reusable CD`), called via `workflow_call`.
- **Config resolver:** [`actions/preflight-deploy`](../actions/preflight-deploy).
- **Central policy:** [`policy/deploy-defaults.yml`](../policy/deploy-defaults.yml).

---

## 1. The three repos

| Repo | Owns | Produces |
|------|------|----------|
| `<app>` | CI — build, test, scan | immutable artifact (image digest / zip sha / bundle id) + version |
| `<app>-config` | `deploy/<env>.yml` — what version, which knobs, **and the AWS resource coordinates** (`infra:`); thin caller workflow | a deploy trigger |
| `enterprise-ci-templates` | `cd-template.yml` (logic) + `deploy-defaults.yml` + `preflight-deploy` | — |

The AWS resources and the GitHub-OIDC deploy role are created out of band
(console / Terraform / CloudFormation); their names are copied into
`deploy/<env>.yml`. `cd-template.yml` never builds and never creates resources.

## 2. Input documents

| Document | Owned by | Lives in | Supplies |
|----------|----------|----------|----------|
| `deploy/<env>.yml` | App team | `<app>-config` | `service.target`, `release.version`/`strategy`, runtime + scaling knobs, `infra:` resource names. Never secret values. |
| `deploy-defaults.yml` | Platform / SRE | this repo | Central runner account + default region per env, OIDC role pattern, default strategy + soak. The app's deploy-target account is in `deploy/<env>.yml` `infra.account`. |

## 3. How an app calls CD

`<app>-config/.github/workflows/deploy.yml`:

```yaml
on:
  repository_dispatch: { types: [artifact-published] }   # CI → auto dev
  workflow_dispatch:
    inputs:
      environment: { type: choice, options: [dev, uat, prod] }
      version:     { type: string }
jobs:
  deploy:
    uses: aba-enterprise/enterprise-ci-templates/.github/workflows/cd-template.yml@v1
    with:
      environment: ${{ inputs.environment || 'dev' }}
      version:     ${{ inputs.version || github.event.client_payload.version }}
```

## 4. What `cd-template.yml` does

1. **Preflight_Deploy** — `preflight-deploy` validates `deploy/<env>.yml` against
   `deploy-config.schema.json`, merges `deploy-defaults.yml`, emits typed outputs
   (`deploy_role`, `region`, `version`, `strategy`, `target`, …).
   Fails if `release.version` is empty for any env other than `dev`.
2. **Deploy** — bound to `environment: <env>`, so the GitHub Environment's
   protection rules (required reviewers for uat/prod, wait timer, `main`-only)
   gate it. Then:
   - assume the env's OIDC role (`aws-actions/configure-aws-credentials`, no keys),
   - read resource coordinates straight from `deploy/<env>.yml` `infra:` (via `yq`),
   - run the branch for `target` — `ecs` (update-service or CodeDeploy blue/green),
     `ec2` (CodeDeploy + ASG), `lambda` (publish version + shift alias),
     `s3` (`s3 sync` + CloudFront invalidation),
   - **soak** for `bake_minutes` so a bad deploy fails the run before promotion,
   - commit the resolved `release.version` back into `deploy/<env>.yml` (`[skip ci]`).

## 5. Promotion

Build once in CI. CI dispatches `artifact-published` → **dev** auto-deploys. For
**uat** / **prod**, run `deploy.yml` with the *same* `version` — approval gate,
same image digest / zip sha flows forward. Never rebuild between environments.

## 6. Rollback

| Target | Rollback |
|--------|----------|
| ECS | redeploy the prior task-def revision (or CodeDeploy auto-rollback on alarm) |
| EC2 | CodeDeploy → prior deployment-group revision |
| Lambda | repoint the alias to the previous version |
| S3 | re-sync the prior `/<version>/` prefix to `/live/` + invalidate |
