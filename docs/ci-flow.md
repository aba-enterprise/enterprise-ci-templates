# CI flow — end to end

How a push or pull request in an application repo flows through the reusable CI
pipeline in this repo, what decides each step, and where every value comes from.

- **Scope:** CI only — restore, lint, build, test, scan, publish artifact.
  Deployment lives in a separate per-app repo and is out of scope here.
- **Entry point:** [`.github/workflows/ci-template.yml`](../.github/workflows/ci-template.yml) (`name: Reusable CI`), called via `workflow_call`.
- **Config resolver:** [`actions/pipeline-config`](../actions/pipeline-config) — a bundled TypeScript action.
- **Central policy:** [`policy/pipeline-policy.yml`](../policy/pipeline-policy.yml) (gates) + [`policy/pipeline-defaults.yml`](../policy/pipeline-defaults.yml) (non-secret defaults).

---

## 1. The three input documents

| Document | Owned by | Lives in | Supplies |
|----------|----------|----------|----------|
| `ci-config/config.yml` | App team | App repo | Identifiers & commands only — name, language, build/test commands, project paths, Sonar/SAST keys, image repo. **Never a gate switch.** |
| `pipeline-policy.yml` | Platform / AppSec | This repo | Which scans run and what blocks a merge (`required`, `gate: block\|warn`). App-immutable. |
| `pipeline-defaults.yml` | Platform / AppSec | This repo | Shared non-secret values — registry, runner defaults, job timeouts, and per-environment endpoints (Vault, Artifactory, Prisma, SonarQube, Veracode). |

The app config keys are named by **function** (`scan.codeQuality`, `scan.sast`,
`scan.image`) — not by product — so swapping a tool is a one-line change in
`pipeline-policy.yml` and no app config ever changes.

---

## 2. How an app calls the pipeline

```yaml
# <app-repo>/.github/workflows/ci.yml
on:
  push: { branches: [main] }
  pull_request:

permissions:
  contents: read

jobs:
  ci:
    uses: aba-enterprise/enterprise-ci-templates/.github/workflows/ci-template.yml@main
    with:
      config-path: ci-config/config.yml   # optional (default)
      bootstrap-runner: arc-linux         # k8s/ARC Linux label for helper jobs
      environment: nonprod                # nonprod (CI) | prod (promotion)
```

---

## 3. Job graph

```
                 ┌───────────────────────────┐
   push / PR ───▶│  Preflight                │  runs-on: inputs.bootstrap-runner
                 │  (config, policy &        │  timeout: 5 min
                 │   defaults constants)     │
                 └─────────────┬─────────────┘
                               │  typed outputs (needs.Preflight.outputs.*)
              ┌────────────────┼─────────────────────────────┐
              ▼                ▼                             ▼
      ┌───────────────┐  ┌──────────────┐            ┌──────────────────┐
      │  Build_Test   │  │  security *  │   ...      │  scan stages *   │
      │  restore/lint │  │  secrets,    │            │  Sonar, Veracode,│
      │  /build/test  │  │  dep-review, │            │  Prisma, CodeQL  │
      │               │  │  CodeQL      │            │  (per policy)    │
      └───────────────┘  └──────────────┘            └──────────────────┘

  * currently commented out in ci-template.yml — see §6.
```

Active jobs today: **Preflight** and **Build_Test**. The security and scan
stages are scaffolded (commented) in the template and gated by the Preflight
outputs shown below.

---

## 4. Preflight — the resolve step

Job `Preflight` runs one step: `actions/pipeline-config`.

1. **Load** `ci-config/config.yml` from the app workspace
   (`GITHUB_WORKSPACE` + `config-path`).
2. **Load** `pipeline-policy.yml` and `pipeline-defaults.yml` from the action's
   **own bundled copy** — resolved two dirs up from the action
   (`actions/pipeline-config → actions → repo root → policy/`). No second
   `actions/checkout` of this repo is needed. `policy-path` / `defaults-path`
   inputs override this for local testing.
3. **Validate** all three documents against `policy/schema/*.schema.json` (Ajv,
   draft 2020-12) — `config.schema.json` for the app config,
   `pipeline-policy.schema.json` and `pipeline-defaults.schema.json` for the
   central files. A malformed document fails the job early with a readable
   multi-line error (e.g. `/metadata/language must be equal to one of the
   allowed values`). The app-config schema is the **only** check that file ever
   gets — nothing in this repo can see it, since it lives in the app repo.
4. **Resolve** ([`src/resolve.ts`](../actions/pipeline-config/src/resolve.ts), pure, unit-tested) — merge rules:
   - `restore_cmd` is chosen by language (`npm ci`, `dotnet restore`,
     `mvn -B dependency:go-offline`, `pip install -r requirements.txt`,
     `nuget restore`) — **workflow-owned**, not app-settable.
   - `codeql_lang` is mapped from the app language.
   - `job_timeout` = `windowsJobTimeoutMinutes` (30) on Windows, else
     `jobTimeoutMinutes` (20).
   - `run_prisma` = `true` only when `build.dockerfilePath` is set **and**
     policy `imageScan.required` is not `false`.
   - Gate helpers: a stage is `required` unless policy says `required: false`;
     a gate `blocks` (`yes`) unless policy says `gate: warn`.
   - Endpoints come from `environments.<environment>` — the `environment`
     input (`nonprod` for CI, `prod` for promotion) selects the block.
     An unknown environment name fails the job.
5. **Emit** ~55 typed step outputs, re-exposed as `Preflight` job outputs, plus
   a job-summary table (environment, language, coverage floor, image scan,
   vault).

### Output groups (`needs.Preflight.outputs.*`)

| Group | Source | Examples |
|-------|--------|----------|
| App identity / build | app config | `name`, `language`, `language_version`, `type`, `working_dir`, `build_cmd`, `test_cmd`, `lint_cmd`, `restore_cmd`, `project_path`, `dockerfile_path`, `job_timeout` |
| Runner selection | app config + defaults | `runner_backend`, `runner_labels`, `runner_os` |
| Scan identifiers | app config | `sonar_project_key`, `sonar_org_key`, `sast_profile`, `image_repository`, `codeql_lang` |
| Gate decisions | **policy** (app-immutable) | `gate_test`, `gate_coverage`, `coverage_min`, `run_sonar(_gate)`, `run_veracode(_gate)`, `run_prisma(_gate)`, `run_dependency`, `run_secret`, `run_codeql` |
| Service endpoints — common | defaults `common.*` | `registry_host`, `registry_namespace`, `sonarqube_url`, `sonarqube_quality_gate`, `veracode_api_base`, `veracode_policy` |
| Service endpoints — per env | defaults `environments.<env>.*` | `vault_addr`, `vault_role`, `artifactory_url`, `artifactory_docker_repo`, `artifactory_maven_repo`, `artifactory_npm_repo`, `prisma_console_url`, `prisma_collection` |

---

## 5. Build_Test — the app runner

`needs: Preflight`. Runs on the app's own runner. Intended `runs-on` (currently
stubbed to `ubuntu-latest`, real form commented in the template):

```yaml
runs-on: >-
  ${{ needs.Preflight.outputs.runner_backend == 'codebuild'
      && format('codebuild-{0}-{1}-{2}', needs.Preflight.outputs.runner_labels, github.run_id, github.run_attempt)
      || needs.Preflight.outputs.runner_labels }}
```

Images are **pre-baked** — no toolchain setup. Every step runs the resolved
command through `PATH` in `needs.Preflight.outputs.working_dir`, and is skipped
when its command output is empty.

| Step | Runs when | Command |
|------|-----------|---------|
| Restore dependencies | `restore_cmd != ''` | `eval "$CMD"` — `restore_cmd` |
| Lint | `lint_cmd != ''` | `eval "$CMD"` — `lint_cmd` |
| Build | `build_cmd != ''` | `eval "$CMD"` — `build_cmd` |
| Test | `test_cmd != ''` | `eval "$CMD"` — `test_cmd` |

Linux steps use `bash`; the parallel Windows set (`powershell` /
`Invoke-Expression`) is gated on `runner_os == 'windows'` and currently
commented. Artifact upload (`actions/upload-artifact`, name
`<name>-build`, retention 7 days) is likewise scaffolded and fires when
`artifact_path != ''`.

---

## 6. Security & scan stages (scaffolded)

Commented in `ci-template.yml`, wired to Preflight outputs. When enabled:

| Stage | Gate output | Tool | Reusable workflow |
|-------|-------------|------|-------------------|
| Secret scan | `run_secret` | gitleaks | inline (`security` job) |
| Dependency review | `run_dependency` (PR only) | `actions/dependency-review-action` | inline |
| SAST — CodeQL | `run_codeql` + `codeql_lang` | `github/codeql-action` init/autobuild/analyze | inline / [`codeql-template.yml`](../.github/workflows/codeql-template.yml) |
| Code quality | `run_sonar` / `run_sonar_gate` | SonarQube | [`sonarqube-template-m.yml`](../.github/workflows/sonarqube-template-m.yml) |
| SAST — policy | `run_veracode` / `run_veracode_gate` | Veracode | [`veracode-baseline-scan-template.yml`](../.github/workflows/veracode-baseline-scan-template.yml) |
| Image scan | `run_prisma` / `run_prisma_gate` | Prisma Cloud | [`prisma-scan-template.yml`](../.github/workflows/prisma-scan-template.yml) |
| Unit test gate | `gate_test`, `gate_coverage`, `coverage_min` | — | enforced in `Build_Test` |

A stage that resolves to `warn` runs but does not block the merge. The **only**
way past a `block` gate is a signed, time-boxed waiver
(`.ci/waivers/<gate>.yml` in the app repo, approved by `appsec-codeowners`,
max 30 days — see `pipeline-policy.yml` `exceptions`).

---

## 7. Guardrails in this repo

| Workflow | Protects |
|----------|----------|
| [`policy-validate.yml`](../.github/workflows/policy-validate.yml) | `policy/**` — schema-validates both policy files + yamllint on every PR. A bad gate switch can't merge, so it can't ship org-wide. |
| [`actions-ci.yml`](../.github/workflows/actions-ci.yml) | `actions/**` — lint, unit test, build every action, fail if a committed `dist/` is stale, then smoke-test `pipeline-config` against `test/fixtures/config.dotnet.yml`. |

`actions/*/dist/` is committed on purpose — it is what each action's
`runs.main` executes. Rebuild with `cd actions && npm run all`.

### Dependencies / supply chain

The `pipeline-config` action has just two runtime dependencies, both pinned in
[`actions/package-lock.json`](../actions/package-lock.json) and **bundled by
`@vercel/ncc` into the committed `dist/index.js`** — CI runs that fixed, reviewed
blob, never a fresh `npm install`.

| Package | Version | License | Publisher / provenance | Role |
|---------|---------|---------|------------------------|------|
| `ajv` | `8.20.0` (`^8.17.1`) | MIT | [OpenJS Foundation](https://openjsf.org) project (maint. Evgeny Poberezkin); one of the most-depended-on packages on npm | JSON Schema (draft 2020-12) validation of the app config **and** the policy files |
| `js-yaml` | `4.3.2` (`^4.1.0`) | MIT | [`nodeca`](https://github.com/nodeca) org — multiple maintainers; the YAML parser bundled by ESLint and webpack | Parse `config.yml` / policy / defaults |

Ajv's transitive deps (`fast-deep-equal`, `json-schema-traverse`,
`require-from-string`, `uri-js`) are all MIT/BSD and vendored into the same
bundle. `js-yaml`'s only dependency is `argparse@2` (Python-2.0 licence,
`nodeca`, used by its CLI — not the parse path `readYaml` calls). `js-yaml`
follows YAML 1.1, so unquoted
`yes/no/on/off` parse as booleans; the schemas pin every scalar to a
string/enum, so a mistyped value fails validation rather than resolving to the
wrong type.

Everything else in `actions/` is **dev-only** (`typescript`, `eslint`, `jest`,
`ncc`, `@types/*`) — used to lint, test and build, never shipped in `dist/` and
never executed by a pipeline run. `actions-ci.yml` fails the build if a
committed `dist/` no longer matches its source, so a dependency change cannot
reach app pipelines without a reviewed diff of the bundle.

---

## 8. One-line summary

> Push → **Preflight** merges app config + central policy + env defaults into
> ~55 typed outputs → **Build_Test** runs the resolved restore/lint/build/test
> on the app's pre-baked runner → security & scan stages (per policy) gate the
> merge, bypassable only by an audited waiver.
