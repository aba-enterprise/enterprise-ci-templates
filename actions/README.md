# `actions/` — TypeScript GitHub Actions (npm workspace)

One npm workspace holds every custom action plus the shared library. Tooling
(`typescript`, `ncc`, `jest`, `eslint`, types) is declared **once** at the root
and hoisted; each action carries only its own runtime deps, its `action.yml`,
`src/`, and a committed `dist/`.

```
actions/
├── package.json            # workspace list + build chain (--workspaces)
├── package-lock.json       # single lockfile
├── tsconfig.base.json      # every action's tsconfig extends this
├── tsconfig.json           # typecheck project — globs every action's src/
├── .eslintrc.json          # cascades to all workspaces
├── jest.config.js          # testMatch glob — every workspace's src/*.test.ts
├── shared/                 # @pipeline/shared — YAML load + JSON Schema validation
└── preflight-config/        # action: resolve per-app config against central policy
    ├── action.yml          # runs: using node24, main dist/index.js
    ├── package.json        # @pipeline/preflight-config-action — ncc build script
    ├── tsconfig.json       # extends ../tsconfig.base.json
    ├── src/                # index.ts (core glue) + logic + *.test.ts
    ├── test/fixtures/      # sample inputs for the CI smoke job
    └── dist/               # ncc bundle — COMMITTED, executed by runs.main
```

## Develop

```bash
cd actions
npm ci
npm run all          # lint + typecheck + test + build (all workspaces)
```

Individual scripts: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

`npm run build` runs `ncc` in each action and refreshes its `dist/`. CI
(`.github/workflows/actions-ci.yml`) fails if a committed `dist/` is stale, so
**always `npm run build` and commit `dist/`** after touching an action's `src/`.

## Add another TypeScript action

TypeScript actions are **Node actions** (`runs: using: node24`), not composite
actions — a composite action cannot execute TS. To add one called `my-action`:

### 1. Create the folder

```
actions/my-action/
├── action.yml
├── package.json
├── tsconfig.json
├── README.md
├── src/
│   ├── index.ts          # @actions/core glue: getInput → logic → setOutput
│   ├── <logic>.ts        # pure logic, no I/O — keeps tests simple
│   └── <logic>.test.ts   # jest unit tests
└── test/
    └── fixtures/          # optional — sample input files for the smoke job
```

`dist/` is **generated** by step 4, not hand-created.

**`action.yml`**

```yaml
name: "My action"
description: "What it does."
inputs:
  some-input:
    description: "..."
    required: false
    default: "."
outputs:
  result:
    description: "..."
runs:
  using: node24
  main: dist/index.js
```

**`package.json`** (copy `preflight-config/package.json`)

```json
{
  "name": "@pipeline/my-action-action",
  "version": "1.0.0",
  "private": true,
  "main": "dist/index.js",
  "scripts": {
    "build": "ncc build src/index.ts -o dist --source-map --license licenses.txt",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@actions/core": "^1.11.1",
    "@pipeline/shared": "*"
  }
}
```

**`tsconfig.json`** (identical to `preflight-config/tsconfig.json`)

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": { "outDir": "lib", "rootDir": "src", "declaration": false },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "lib", "**/*.test.ts"]
}
```

### 2. Register it in the workspace list

| File | Edit |
|------|------|
| `actions/package.json` | add `"my-action"` to `workspaces` |

That's it. The `build` script (`npm run build --workspaces --if-present`),
`tsconfig.json` (`include: ["*/src"]`) and `jest.config.js`
(`testMatch: ["<rootDir>/*/src/**/*.test.ts"]`) all discover the new workspace
automatically.

(If the action imports `@pipeline/shared`, also add it under `paths` in
`actions/tsconfig.json` only if you need editor resolution — the build resolves
it via the workspace symlink.)

### 3. Add a smoke job in `.github/workflows/actions-ci.yml`

Mirror the existing `smoke` job: `uses: ./actions/my-action` with test inputs,
then assert `steps.<id>.outputs.*`. This is the only end-to-end check an action
gets — unit tests cover the logic, the smoke job proves the bundle runs.

### 4. Build, verify, commit

```bash
cd actions
npm install          # relinks the new workspace
npm run all          # lint + typecheck + test + build
git add my-action/ actions/package.json actions/tsconfig.json actions/jest.config.js
git add .github/workflows/actions-ci.yml
```

The commit **must** include `my-action/dist/` — `actions-ci` rebuilds and fails
the PR if it is missing or stale.

## Add a composite action

A composite action is pure YAML — no workspace entry, no `dist/`, no jest. Add
`actions/my-composite/action.yml` with `runs: using: composite`, an optional
`README.md`, and a smoke job in `actions-ci.yml` (its only automated test). The
lint / build / dist-freshness steps pass it over automatically.

## Testing

- **Unit tests** live at `<action>/src/**/*.test.ts` — discovered by
  `jest.config.js` `testMatch`. Put resolution / parsing logic in a pure module
  and test that; keep `index.ts` a thin `@actions/core` shell.
- **`<action>/test/fixtures/`** holds sample input files fed to the action in the
  CI `smoke` job — not jest.
- No coverage gate in CI, but `lint`, `test`, `build`, dist-freshness, and
  `smoke` must all pass.

## Release

Tag `vX.Y.Z`, move the floating `vN`. Consumers pin
`aba-enterprise/enterprise-ci-templates/actions/<name>@vN`.
