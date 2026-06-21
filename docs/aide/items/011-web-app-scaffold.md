# Item 011 — Web app scaffold over the core

> **Stage:** 2 — Manual scorepad MVP (base game)
> **Queue:** [queue-002.md](../queue/queue-002.md) · **Status source of truth:** [progress.md](../progress.md)
> **Created:** 2026-06-20

---

## Description

Add the **web application** to the monorepo as a new workspace package `packages/web`, built with **React + Vite + TypeScript**, wired into the existing toolchain (npm workspaces, the root `lint`/`build`/`test` scripts, ESLint flat config, Prettier, Vitest). The app imports and renders something trivial from **`@carcassonne/core`** to prove the dependency wiring and the platform boundary (UI depends on core, never the reverse). Establish the **component test runner** (Vitest + React Testing Library + jsdom) and add a single **smoke test** that mounts the app shell and asserts it renders.

This is the foundation every other Stage 2 UI item (013–020) builds on. The hard part is not React — it is slotting a DOM/JSX app into a repo whose gate currently builds/tests only a no-DOM core, **without breaking that gate or the core's platform boundary**. Get the integration seams right here so later items are thin.

**Decided technology (from the queue checkpoint):** React 18 + Vite 5 + TypeScript; **Vitest + @testing-library/react + jsdom** for component tests; **Playwright** for end-to-end is introduced in **Item 020** (it may be listed as a dev dependency now but the e2e suite itself is out of scope here).

### Scope boundary

- **Scaffold only.** No game setup, scoreboard, score entry, log, persistence, or state store — those are Items 012–019. This item delivers a runnable, tested empty-ish app shell that consumes the core.
- **No scoring/tally logic.** The app may *display* a value from the core to prove wiring, but implements no scorepad behaviour.
- **Preserve the core boundary.** Do **not** add `"DOM"` to `packages/core`'s `lib`, and do not make `core` depend on `web`. The DOM lives only in `packages/web`.
- **PWA/offline is Stage 3.** No service worker, manifest, or offline handling here.

## Design decisions (decided here)

- **Location & workspace.** New package `packages/web` (matches the root `workspaces: ["packages/*"]` glob). `name: "@carcassonne/web"`, `private: true`, `type: "module"`. It declares a dependency on `@carcassonne/core` (workspace) and renders a value from it (e.g. `coreVersion()` / `CORE_READY`) so the wiring is provably exercised.
- **Vite + React.** `@vitejs/plugin-react`, a `packages/web/vite.config.ts`, an `index.html` entry, and `src/main.tsx` + `src/App.tsx`. A `dev` script serves the app; a `build` script (`vite build`, or `tsc --noEmit && vite build`) produces a production build and type-checks the web sources.
- **Separate web tsconfig with DOM.** `packages/web/tsconfig.json` extends `tsconfig.base.json` but sets `lib: ["ES2022", "DOM", "DOM.Iterable"]`, `jsx: "react-jsx"`, and includes `src`/`test`. The **core tsconfig is untouched** (stays `lib: ["ES2022"]`). This keeps the no-DOM boundary enforced where it matters and DOM available only in the web package.
- **Root gate must cover web.** The checker runs `npm run lint && npm run build && npm test` at the root. Update those root scripts so all three now also exercise `packages/web`, **without breaking core**:
  - `build` — currently `tsc -p packages/core/tsconfig.json --noEmit`. Extend so the web package is also type-checked/built (e.g. add `tsc -p packages/web/tsconfig.json --noEmit && vite build` for web, or a composite). Both core and web must be covered by `npm run build`.
  - `test` — core tests run in `environment: "node"`; web component tests need `jsdom` and `.tsx`. Use **Vitest projects/workspace** (e.g. a root `vitest.workspace.ts`) so core keeps node-env (`packages/*/test/**/*.test.ts`) and web runs jsdom for `packages/web/**/*.test.{ts,tsx}`. Root `npm test` runs **both** suites; all existing core tests stay green.
  - `lint` — ESLint flat config currently matches `**/*.ts`/`**/*.js`. Extend it to also lint `**/*.tsx` with the React ecosystem rules (e.g. `eslint-plugin-react-hooks`, `react-refresh` as appropriate) and ensure Prettier formats `.tsx`. Keep the existing core rules intact.
- **Dependencies.** Add the needed dev/runtime deps to the appropriate `package.json` (root or `packages/web`): `react`, `react-dom`, `@vitejs/plugin-react`, `vite`, `@testing-library/react`, `@testing-library/jest-dom` (optional), `jsdom`, React eslint plugin(s), and `@types/react`/`@types/react-dom`. Installation requires network access — if the environment cannot install packages, that is an **environment blocker** to surface, not something to work around.
- **App shell.** A minimal `App` component (a title/heading and a small element proving the core import) that later items replace/extend. No business logic.

## Acceptance criteria

- [x] `packages/web` exists as a workspace package (`@carcassonne/web`, private, ESM) depending on `@carcassonne/core`, with React + Vite + TypeScript configured (`vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`).
- [x] The app **renders a value imported from `@carcassonne/core`** (e.g. `coreVersion()` or `CORE_READY`), proving the UI→core wiring and that core is consumed (not duplicated).
- [x] `npm run dev` (root or `-w @carcassonne/web`) starts the Vite dev server; a production `build` succeeds and type-checks the web sources.
- [x] A component smoke test (`@testing-library/react` + jsdom) mounts the app shell and asserts it renders (e.g. finds the heading / the core value).
- [x] The root gate **`npm run lint && npm run build && npm test` exits 0** and now covers **both** packages: lint lints `.ts`/`.tsx` (with React rules) and Prettier-checks them; build type-checks/builds core **and** web; test runs the web component test(s) under jsdom **and** all existing core tests under node.
- [x] **Core boundary intact:** `packages/core/tsconfig.json` still has `lib: ["ES2022"]` (no DOM), core does not import web, and all Items 001–010 core suites still pass unchanged.
- [x] Framework + test-tooling choices and the integration seams (workspace test config, web tsconfig, extended lint/build) are documented in the spec's Decisions on completion.

> Maps to the Stage 2 deliverable "Thin UI layer over the Stage 1 core" (the scaffold half) and is the precursor for every other Stage 2 item. It does not by itself satisfy a Stage 2 *acceptance criterion* (those require setup/scoreboard/entry/log/persistence).

## Implementation steps

1. Read the root config (`package.json`, `tsconfig.base.json`, `vitest.config.ts`, `eslint.config.js`) and `packages/core/{package.json,tsconfig.json}` to mirror conventions.
2. Create `packages/web/` : `package.json` (deps + `dev`/`build`/`test` scripts), `tsconfig.json` (DOM lib + `react-jsx`), `vite.config.ts` (`@vitejs/plugin-react`), `index.html`, `src/main.tsx`, `src/App.tsx` (renders a core value).
3. Wire the test runner: add a `vitest.workspace.ts` (or projects config) so core stays node-env and web uses jsdom; configure `@testing-library/react` (+ a jsdom setup file if needed). Add `packages/web/test/App.test.tsx` smoke test.
4. Extend root scripts: `build` to also type-check/build web; ensure `test` runs both projects; extend `eslint.config.js` for `.tsx` + React rules and confirm Prettier covers `.tsx`.
5. Install dependencies (`npm install`). If install fails for lack of network, stop and report an environment blocker.
6. Run `npm run lint && npm run build && npm test` from the root until green; confirm `npm run dev` serves the app.

## Testing strategy

- **Component (Vitest + @testing-library/react + jsdom)** in `packages/web/test/App.test.tsx`:
  - Render `<App />`; assert the shell renders (heading present) and the value imported from `@carcassonne/core` appears — proving the wiring.
- **Regression:** all existing core suites (Items 001–010) continue to pass under the node project; `npm test` runs both projects in one command.
- **Manual:** `npm run dev` serves the app and it loads without console errors; `npm run build` produces a build.
- **Local CI gate** (what `aide-checker` runs): `npm run lint && npm run build && npm test` from the repo root.

## Dependencies

- **Upstream:** Item 001 (monorepo scaffold, root scripts, Vitest/ESLint/Prettier), `@carcassonne/core` public entry (Items 001–010).
- **Downstream:** Item 012 (session model — may live in core/shared), Items 013–019 (all UI built in `packages/web`), Item 020 (Playwright e2e runs against this app). Establishes the build/test/lint seams every later Stage 2 item relies on.

## Testing Prerequisites

**Required Services**
- None. Local web tooling only.

**Environment Configuration**
- Node.js (18+/20 LTS) and npm on PATH. **Network access is required once** to `npm install` the new React/Vite/testing dependencies. No env vars, secrets, or external services. Dev server uses a local port (Vite default 5173) — only relevant for manual `npm run dev`, not for the test gate.

**Manual Validation Checklist**
- [x] Build succeeds — `npm run build` (covers core + web)
- [x] Tests pass — `npm test` (web smoke test under jsdom + all core suites under node)
- [x] Services started — N/A
- [x] Application runs — `npm run dev` serves the app; loads without console errors
- [x] Feature verified — app renders a value from `@carcassonne/core`; lint passes for `.ts`/`.tsx`
- [x] Data verified — N/A (no data yet)
- [x] Health checks pass — dev server responds at the Vite URL (manual)

**Expected Outcomes**
- A runnable React+Vite web app in `packages/web` consuming `@carcassonne/core`; `npm run lint && npm run build && npm test` exits 0 covering both packages; core boundary and all prior suites intact.

## Validation Results
- [x] Service started: N/A
- [x] Application started successfully: `npm run dev` (manual — `curl http://localhost:5173/` returned HTTP 200 with the expected `index.html`/`#root` markup; server stopped after verification)
- [x] Database tables verified: N/A
- [x] Seed data verified: N/A
- [x] API endpoints verified: N/A
- [ ] Screenshots captured: optional (app shell) — not captured, not required for PASS

## Decisions & Trade-offs

- **Vitest workspace over a single config.** Replaced the single root `vitest.config.ts` with `vitest.workspace.ts` defining a `core` project (`environment: "node"`, `packages/core/test/**/*.test.ts`) and a `web` project (`environment: "jsdom"`, `packages/web/test/**/*.test.{ts,tsx}`). Vitest auto-discovers `vitest.workspace.ts` at the repo root, so the root `test` script (`vitest run`) needed no script-text change — it now runs both projects in one invocation, keeping core tests on node while giving web component tests a DOM.
- **Web build delegates to the package's own `build` script.** Root `build` became `tsc -p packages/core/tsconfig.json --noEmit && npm run build -w @carcassonne/web`, with `packages/web`'s own `build` script as `tsc -p tsconfig.json --noEmit && vite build`. This avoids double type-checking web at the root level while still type-checking and building it as part of `npm run build`, and leaves core's build step completely untouched.
- **Root `tsconfig.json` (lint-only) updated.** This file is not part of either package's build — it exists only so ESLint's `**/*.ts` block has a `parserOptions.project` covering root-level `.ts` config files. It referenced the now-deleted `vitest.config.ts`, so it was updated to reference `vitest.workspace.ts` and `packages/web/vite.config.ts` instead, and its `lib` was widened to include `"DOM"` for lint-parsing purposes only. This is a distinct file from `packages/core/tsconfig.json` (which is unchanged) and does not affect the core package's compiled boundary.
- **`.tsx` ESLint block parses against `packages/web/tsconfig.json`** (DOM lib + `jsx: "react-jsx"`), kept fully separate from the `.ts` block's `./tsconfig.json` project — preserving the core/web boundary in tooling, not just in source. The block wires `eslint-plugin-react-hooks` recommended rules plus `eslint-plugin-react-refresh`'s `only-export-components` (warn, `allowConstantExport: true`).
- **`@testing-library/jest-dom` included**, even though the spec listed it as optional, wired via a `packages/web/test/setup.ts` `setupFiles` entry on the `web` Vitest project. The current smoke test only needs plain DOM assertions (`textContent`, `getByRole`), but the matcher setup is in place for Items 012+.
- **`App` exports both a named `App` and a `default`** to support either import style cleanly in `main.tsx` and the test file; no behavior difference.
- **Versions actually installed:** `react`/`react-dom` 18.3.1, `vite` 5.4.21 — matching the spec's React 18 / Vite 5 decision.
- **Node engine warning noted, not acted on.** `npm install` emitted `EBADENGINE` warnings because the active Node on PATH (v17.4.0) is below several new transitive deps' `engines.node>=18` (jsdom's `whatwg-url`, `@csstools/*`, etc.). Install, build, lint, and test all completed successfully despite the warning, so it was not treated as a blocker — flagged here in case the project later wants to pin/upgrade Node, since this spec's "Testing Prerequisites" state Node 18+/20 LTS is expected.

## Completion Reminder

When complete, update [progress.md](../progress.md): record Item 011 against the Stage 2 deliverable "Thin UI layer over the Stage 1 core" (scaffold established; the deliverable and Stage 2 acceptance criteria complete as Items 012–020 land). **Stage 2 becomes 🚧 In Progress** (it is currently 📋 Planned) — flip Stage 2 to 🚧 in the Overall-progress table and Stage 2 header on this first Stage 2 item. Do **not** tick any Stage 2 acceptance criteria yet (they need the setup/scoreboard/entry/log/persistence items). Stage 1 stays ✅. Update only Item 011's progress. Status flow: 📋 → 🚧 → ✅.
