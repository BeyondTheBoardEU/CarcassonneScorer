# Implementation Report — Item 001
- Agent: aide-implementer
- Status: complete
- Date: 2026-06-14

## Summary

Created the npm-workspaces TypeScript monorepo scaffold. The workspace root (`package.json`, `tsconfig.base.json`, `vitest.config.ts`, `eslint.config.js`, `.prettierrc`, `.prettierignore`, `.gitignore`) and `packages/core` (`package.json`, `tsconfig.json`, `src/index.ts`, `test/smoke.test.ts`) were all created from scratch. The `core` tsconfig sets `lib: ["ES2022"]` with no `"DOM"` and the package declares no `@types/node`, enforcing the platform-independence boundary at the compiler level. `npm run lint && npm run build && npm test` all exit 0. The negative boundary check confirmed that referencing `document` produces TS2584 and `process` produces TS2580 — both are tsc errors; the temporary code was removed before handoff.

## Files changed

- `package.json` — workspace root; workspaces config + scripts: test (vitest run), build (tsc --noEmit on core), lint (eslint + prettier --check), format (prettier --write)
- `tsconfig.base.json` — shared strict TypeScript options (ES2022 target/module, bundler moduleResolution, strict, noUncheckedIndexedAccess, noImplicitOverride)
- `tsconfig.json` — root tsconfig including vitest.config.ts for ESLint project awareness; lib includes DOM so config files may use it
- `vitest.config.ts` — Vitest config with `environment: "node"` and glob covering `packages/*/test/**/*.test.ts`
- `eslint.config.js` — ESLint flat config with @typescript-eslint plugin/parser pointing at root tsconfig.json; ignores dist/node_modules/coverage
- `.prettierrc` — Prettier config (semi, double-quotes, trailing commas, printWidth 100)
- `.prettierignore` — excludes node_modules/, dist/, coverage/, *.md, .specify/
- `.gitignore` — excludes node_modules/, dist/, coverage/, *.tsbuildinfo, .env
- `packages/core/package.json` — name: @carcassonne/core; type: module; no runtime deps; no @types/node; exports src/index.ts
- `packages/core/tsconfig.json` — extends ../../tsconfig.base.json; lib: ["ES2022"] only (no "DOM"); includes src + test
- `packages/core/src/index.ts` — core entry: exports CORE_READY (const true) and coreVersion() returning "0.0.0"
- `packages/core/test/smoke.test.ts` — smoke test importing CORE_READY and coreVersion from ../src/index.js

## Tests added/updated

- `packages/core/test/smoke.test.ts` — two Vitest tests: (1) CORE_READY === true, (2) coreVersion() returns a non-empty string. Both pass.

## How to verify

```
npm install
npm run lint && npm run build && npm test
```

All three exit 0. To verify the platform boundary manually:
```
# Add to packages/core/src/index.ts: export const x = document.title;
npx tsc -p packages/core/tsconfig.json --noEmit
# => error TS2584: Cannot find name 'document'. Try changing lib to include 'dom'.
# Then add: export const y = process.env;
# => error TS2580: Cannot find name 'process'. Try npm i --save-dev @types/node.
# Remove the temporary lines; rerun npm run build (clean).
```

## Decisions (for doc-updater)

- Node version: Node 17.4.0 is installed (not 20 LTS as spec recommends). All tooling installs and runs correctly despite engine warnings; the scaffold is compatible with Node 18+ when the machine is upgraded. The spec requirement is advisory; no functional gap exists for this scaffold item.
- ESLint project configuration: a root `tsconfig.json` was added (with lib: ["ES2022", "DOM"]) so ESLint's `@typescript-eslint/parser` can resolve all TS files including `vitest.config.ts`. The core's own `tsconfig.json` (lib: ["ES2022"] only) remains the build/boundary-enforcement config.
- `moduleResolution: "bundler"` chosen in tsconfig.base.json for forward-compatibility with Vite/Vitest and the planned web app package; core test imports use `.js` extension (standard ESM interop with Vitest).
- Prettier is set to ignore `.specify/` since that directory contains IDE/tooling YAML and JSON not owned by this project.
- `npm run build` uses `--noEmit` (typecheck only) per spec intent; actual compiled output to `dist/` is deferred to when the package is published or consumed by `packages/app`.

## Blockers

None.
