# Check Report — Item 001
- Agent: aide-checker
- Verdict: PASS
- Failure class: n/a
- Date: 2026-06-14
- Attempt: 1

## Commands run
- `npm install` → exit 0 / packages up to date (engine warnings for Node 17 vs required 18/20, packages install correctly)
- `npm run lint` → exit 0 / ESLint clean + Prettier clean (all files match code style)
- `npm run build` → exit 0 / tsc --noEmit on packages/core/tsconfig.json, zero errors
- `npm test` → exit 0 / 2 tests passed in packages/core/test/smoke.test.ts

## Acceptance criteria (from the spec)

- [x] Repo has a workspace root and a `packages/core` package, cleanly separated from any UI/app code. — `package.json:6-8` sets `"workspaces": ["packages/*"]`; `packages/core/` contains only `src/` and `test/`; no `packages/app` exists.
- [x] The `core` package has zero UI/platform dependencies: its `tsconfig` `lib` excludes `"DOM"`, it declares no `@types/node`, and it has no runtime dependencies. — `packages/core/tsconfig.json:5` has `"lib": ["ES2022"]` only; `packages/core/package.json` has empty `dependencies` and `devDependencies`; `node_modules/@types/` contains only `estree` and `json-schema` (no `node`).
- [x] `npm test` runs the core test suite in isolation and passes, including a smoke test that imports the core entry (`@carcassonne/core`) and asserts it loads. — exit 0; "2 passed" (tests: CORE_READY === true, coreVersion() returns non-empty string) in `packages/core/test/smoke.test.ts`.
- [x] `npm run build` (typecheck/compile of the core) succeeds with strict TypeScript and zero errors. — exit 0; `tsc -p packages/core/tsconfig.json --noEmit` clean; `tsconfig.base.json` sets `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`.
- [x] `npm run lint` passes (ESLint + Prettier configured and clean). — exit 0; ESLint flat config at `eslint.config.js` with `@typescript-eslint` plugin; Prettier config at `.prettierrc`; "All matched files use Prettier code style!"
- [x] A negative check demonstrates the boundary works: referencing a DOM global or Node global inside `core/src` causes a typecheck failure. — Structurally enforced: `packages/core/tsconfig.json:5` restricts `lib` to `["ES2022"]` (no DOM types); no `@types/node` installed anywhere. `implementation.md` documents the manual check: adding `document` produces TS2584, adding `process` produces TS2580; temporary code was removed before handoff. Spec accepts "documented tsc check — not committed as failing code."

## Required fixes (only if Verdict: FAIL)

N/A
