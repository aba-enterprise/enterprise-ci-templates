# `actions/` — TypeScript GitHub Actions (npm workspace)

One npm workspace holds every custom action plus the shared library. Tooling
(`typescript`, `ncc`, `jest`, `eslint`, types) is declared **once** at the root
and hoisted; each action carries only its own runtime deps, its `action.yml`,
`src/`, and a committed `dist/`.

```
actions/
├── package.json            # workspaces: ["shared", "pipeline-config", …]
├── package-lock.json       # single lockfile
├── tsconfig.base.json      # every action's tsconfig extends this
├── .eslintrc.json          # cascades to all workspaces
├── jest.config.js          # discovers */src/**/*.test.ts
├── shared/                 # @aba/shared — YAML load + JSON Schema validation
└── pipeline-config/        # first action
```

## Develop

```bash
cd actions
npm ci
npm run all          # lint + test + build (all workspaces)
```

`npm run build` runs `ncc` in each action and refreshes its `dist/`. CI
(`.github/workflows/actions-ci.yml`) fails if a committed `dist/` is stale.

## Add another action

1. `mkdir actions/<name>` with:
   - `action.yml` (`runs: using: node20`, `main: dist/index.js`)
   - `package.json` — name `@aba/<name>-action`, deps it needs, `"@aba/shared": "*"`,
     scripts `build` (`ncc build src/index.ts -o dist …`) and `typecheck`
   - `tsconfig.json` — `{ "extends": "../tsconfig.base.json", … }`
   - `src/index.ts`, `src/*.test.ts`
2. Add `"<name>"` to `workspaces` in `actions/package.json`.
3. `npm install` (relinks), `npm run all`, commit `dist/`.

No new tooling config — steps 1–3 are the whole cost.

## Release

Tag `vX.Y.Z`, move the floating `vN`. Consumers pin
`aba-enterprise/enterprise-ci-templates/actions/<name>@vN`.
