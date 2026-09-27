# Item 001 — Project scaffold with platform-independent core

> **Stage:** 1 — Foundation (tile catalog + scoring engine core)
> **Queue:** [queue-001.md](../queue/queue-001.md) · **Status source of truth:** [progress.md](../progress.md)
> **Created:** 2026-06-14

---

## Description

Set up the repository structure with a strict separation between a platform-independent **core** module (no UI, no DOM, no Node-only APIs) and the rest of the project. Establish the language/toolchain, the test runner, linting/formatting, and a build/test script that runs the core suite in isolation. Add a single trivial "smoke" test that imports the core and asserts it loads.

This item builds **no product features** — it establishes the architectural spine that every later item depends on (vision principle 6: scoring/board logic is platform-independent; principle 2: a single catalog drives everything; principle 1: spec-first). Getting the core/UI boundary enforced *by tooling* now is what keeps scoring, validation, and recognition from ever leaking platform dependencies later.

## Committed tech choices (deferred by vision §5; decided here)

These are foundational and bind later items. Recorded here and in **Decisions & Trade-offs**.

- **Language:** TypeScript (strict mode).
- **Runtime/toolchain:** Node.js 20 LTS or newer, npm.
- **Repo layout:** npm **workspaces** monorepo. This item creates `packages/core` only; `packages/app` (the web app, Stage 2+) is reserved but **not** built here.
- **Test runner:** Vitest.
- **Lint/format:** ESLint (flat config) + Prettier.
- **Platform-independence enforced structurally:** the `core` package's `tsconfig` sets `lib` to ECMAScript only (no `"DOM"`) and the package has **no `@types/node`** dependency — so DOM globals (`window`, `document`) and Node globals (`process`, `fs`, `require`) fail to typecheck inside the core. The boundary is compiler-enforced, not just convention.

## Target structure (end state of this item)

```
Carcassonne_scorer/
  package.json              # workspace root; scripts: test, build, lint, format
  tsconfig.base.json        # shared compiler options (strict)
  vitest.config.ts          # or vitest.workspace.ts
  eslint.config.js          # flat config
  .prettierrc / .prettierignore
  .gitignore
  packages/
    core/
      package.json          # name "@carcassonne/core", no runtime deps, no @types/node
      tsconfig.json         # extends base; lib = ES only, NO "DOM"
      src/
        index.ts            # core entry point (re-exports public API)
      test/
        smoke.test.ts       # imports the core entry and asserts it loads
```

(Exact file names may vary with idiomatic tooling defaults; the structure and the enforced boundary are what matter.)

## Acceptance criteria

- [x] Repo has a workspace root and a `packages/core` package, cleanly separated from any UI/app code.
- [x] The `core` package has **zero UI/platform dependencies**: its `tsconfig` `lib` excludes `"DOM"`, it declares no `@types/node`, and it has no runtime dependencies.
- [x] `npm test` runs the core test suite in isolation and passes, including a smoke test that imports the core entry (`@carcassonne/core`) and asserts it loads.
- [x] `npm run build` (typecheck/compile of the core) succeeds with strict TypeScript and zero errors.
- [x] `npm run lint` passes (ESLint + Prettier configured and clean).
- [x] A negative check demonstrates the boundary works: referencing a DOM global (e.g. `document`) or a Node global (e.g. `process`) inside `core/src` causes a typecheck failure. (Demonstrated via a commented example or a documented `tsc` check — not committed as failing code.)

> Maps to Stage 1 acceptance: "Core module has zero UI/platform dependencies and runs in isolation."

## Assumptions

- None recorded. Specified and delivered before the aide-loop migration (2026-09-27); decisions taken during implementation are under Decisions & Trade-offs below and in the legacy run record `../runs/001/`.

## Implementation steps

1. Initialize the workspace root `package.json` with `"workspaces": ["packages/*"]` and scripts: `test` (vitest run), `build` (tsc build), `lint` (eslint), `format` (prettier).
2. Add `tsconfig.base.json` with strict options (`strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `module`/`moduleResolution` for bundler/node, `target` ES2022).
3. Create `packages/core/package.json` (`@carcassonne/core`, `type: module`, `main`/`exports` → built or source entry), with **no** runtime deps and **no** `@types/node`.
4. Create `packages/core/tsconfig.json` extending the base, with `lib: ["ES2022"]` (no `"DOM"`).
5. Add `packages/core/src/index.ts` exporting a trivial public symbol (e.g. `export const CORE_READY = true;` or a `coreVersion()` returning the package version) — just enough for the smoke test to import.
6. Add `packages/core/test/smoke.test.ts`: import from the package entry and assert the exported symbol is present/truthy.
7. Configure Vitest (root `vitest.config.ts` / workspace) with the `node` environment for `core` (no jsdom).
8. Configure ESLint flat config + Prettier; add `.gitignore` (`node_modules`, `dist`, coverage).
9. Run `npm install`, then `npm run lint && npm run build && npm test` until all pass.
10. Verify the negative boundary check (step in acceptance criteria): temporarily reference `document`/`process` in core and confirm `tsc` errors; remove it. Document the result.

## Testing strategy

- **Unit/smoke:** Vitest. One smoke test in `packages/core/test/smoke.test.ts` importing the core entry and asserting it loads. This is the seed of the Stage 1 scoring test suite (items 005–010 add to it).
- **Static enforcement:** the strict `tsc` build *is* a test of the platform-independence boundary; treat a green build with the restricted `lib`/no-node-types config as the primary evidence for the "zero platform deps" criterion.
- **Local CI gate:** `npm run lint && npm run build && npm test` is the single command the checker (`aide-checker`) will run.

## Dependencies

- **Upstream:** none (first item in the project).
- **Downstream:** every subsequent item. Item 002 (board-state model), 003/004 (catalog), 006–010 (engine) all live in `packages/core` and rely on this scaffold and test runner.

## Testing Prerequisites

**Required Services**
- None. This is a local, offline TypeScript scaffold with no external services.

**Environment Configuration**
- Node.js 20 LTS+ and npm available on PATH. No environment variables, secrets, or config files beyond those created by this item. No ports required.

**Manual Validation Checklist**
- [ ] Build succeeds — `npm run build`
- [ ] Tests pass — `npm test` (smoke test green)
- [ ] Services started — N/A (no services)
- [ ] Application runs — N/A (no app in this item)
- [ ] Feature verified — `packages/core` exists with the enforced boundary; `npm run lint` clean
- [ ] Data verified — N/A
- [ ] Health checks pass — N/A

**Expected Outcomes**
- A workspace with `packages/core` containing `src/index.ts` and `test/smoke.test.ts`.
- `npm run lint && npm run build && npm test` exits 0 with the smoke test passing.
- Referencing a DOM/Node global in `core/src` produces a `tsc` error (boundary proven).

## Validation Results
- [ ] Service started: N/A
- [ ] Application started successfully: N/A (no app this item)
- [ ] Database tables verified: N/A
- [ ] Seed data verified: N/A
- [ ] API endpoints verified: N/A
- [ ] Screenshots captured: N/A (no UI)

## Decisions & Trade-offs

**Language, toolchain, and monorepo layout.** TypeScript (strict mode) with npm workspaces was chosen as the monorepo strategy. The workspace root holds shared tooling config while `packages/core` contains only source and tests. This layout directly enforces the platform-independence boundary: `packages/core/package.json` declares no runtime dependencies and no `@types/node`, and `packages/core/tsconfig.json` sets `lib: ["ES2022"]` with no `"DOM"`, making it a compiler error to reference any DOM or Node.js global inside core. There is no trade-off here — this is the design the spec requires.

**Vitest as test runner.** Vitest was selected over Jest for its first-class ESM and TypeScript support and forward-compatibility with the planned Vite-based web app in Stage 2. The core test environment is set to `"node"` (no jsdom) to keep the platform boundary honest. Tests use `.js` extension imports, which is standard ESM interop under Vitest.

**`moduleResolution: "bundler"` in tsconfig.base.json.** The `bundler` resolution mode was chosen over `node16`/`nodenext` for forward-compatibility with Vite and the planned `packages/app` package. This resolution mode requires explicit `.js` extensions on relative imports in test files, which is accepted as a minor ergonomic cost.

**Root `tsconfig.json` added for ESLint.** ESLint's `@typescript-eslint/parser` requires a TypeScript project that includes every file being linted, including `vitest.config.ts` at the root. A root-level `tsconfig.json` was added for this purpose. Its `lib` includes `"DOM"` so config files may use browser-related types; this does not weaken the core boundary because the core's own `tsconfig.json` (which governs build and typecheck) still restricts `lib` to `["ES2022"]` only.

**Node 17.4.0 deviation.** The spec recommends Node.js 20 LTS or newer. The machine running the implementation has Node 17.4.0. All tooling — npm, Vitest, TypeScript, ESLint, Prettier — installed and ran correctly, producing engine warnings but zero functional failures. The scaffold itself is compatible with Node 18+ and will run without warnings once the machine is upgraded. This is treated as an advisory deviation: no functional gap exists for a scaffold-only item, and no code depends on Node 20+ APIs.

**`npm run build` uses `--noEmit` (typecheck only).** Compiling to `dist/` is deferred until `packages/core` is consumed by `packages/app` or published. This keeps the scaffold simple and avoids committing to an output format before it is needed.

**Prettier ignores `.specify/`.** The `.prettierignore` excludes `.specify/` because that directory contains IDE/tooling YAML and JSON not owned by this project. Formatting those files would produce spurious diffs on every Prettier run.

## Completion Reminder

When this item is complete, update [progress.md](../progress.md): Stage 1 → 🚧 (in progress) and tick the Stage 1 deliverable "Project scaffold separating a platform-independent core …" and the acceptance criterion "Core module has zero UI/platform dependencies and runs in isolation." Do **not** tick other Stage 1 items' boxes. Per the AIDE flow, status moves 📋 → 🚧 → ✅ for the scaffold deliverable; the stage as a whole stays 🚧 until items 002–010 land.
