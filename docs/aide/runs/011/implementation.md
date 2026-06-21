# Implementation Report — Item 011
- Agent: aide-implementer
- Status: complete
- Date: 2026-06-21

## Summary
Added a new workspace package `packages/web` (`@carcassonne/web`, private, ESM) built with React 18.3 + Vite 5.4 + TypeScript, depending on `@carcassonne/core` and rendering `CORE_READY`/`coreVersion()` from it to prove the UI→core wiring. Established the component test runner (Vitest + `@testing-library/react` + jsdom) via a new `vitest.workspace.ts` so core tests keep `environment: "node"` and web `.tsx` tests run under jsdom, both driven by a single root `npm test`. Extended the root `build` script to cover web (`tsc -p packages/web/tsconfig.json --noEmit && vite build`, invoked via the package's own `build` script) without touching core's build. Extended `eslint.config.js` with a `**/*.tsx` block using `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh`, parsed against `packages/web/tsconfig.json`, while leaving the existing `.ts`/`.js` blocks untouched. `packages/core/tsconfig.json` is unmodified (`lib: ["ES2022"]`, no DOM).

## Files changed
- `package.json` — added root `dev` script (`-w @carcassonne/web`), extended `build` to also run the web package's build (`tsc -p packages/web/tsconfig.json --noEmit && vite build`), added `eslint-plugin-react-hooks`/`eslint-plugin-react-refresh` devDependencies. `test` script (`vitest run`) unchanged in text but now picks up `vitest.workspace.ts` automatically (Vitest auto-detects the workspace file at repo root).
- `tsconfig.json` (root, used only for ESLint's `**/*.ts` block `parserOptions.project`) — updated `include` to reference `vitest.workspace.ts` (replacing the deleted `vitest.config.ts`) and added `packages/web/vite.config.ts` so both root-level TS config files type-check/parse cleanly for lint.
- `vitest.config.ts` — deleted; superseded by `vitest.workspace.ts` (Vitest workspace/projects mode).
- `vitest.workspace.ts` (new) — defines two projects: `core` (`environment: "node"`, `packages/core/test/**/*.test.ts`) and `web` (`environment: "jsdom"`, `packages/web/test/**/*.test.{ts,tsx}`, `setupFiles: ["./packages/web/test/setup.ts"]`).
- `eslint.config.js` — added a `**/*.tsx` config block (parser project `./packages/web/tsconfig.json`, `ecmaFeatures.jsx: true`) wiring `eslint-plugin-react-hooks` recommended rules + `eslint-plugin-react-refresh`'s `only-export-components` (warn, `allowConstantExport: true`), plus the same `@typescript-eslint` rules used for `.ts`. The existing `**/*.ts` and `**/*.js` blocks are untouched.
- `packages/web/package.json` (new) — `@carcassonne/web`, `private: true`, `type: "module"`; `dependencies`: `@carcassonne/core` (workspace), `react@^18.3.0`, `react-dom@^18.3.0`; `devDependencies`: `@testing-library/jest-dom`, `@testing-library/react`, `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`, `jsdom`, `vite@^5.4.0`; scripts: `dev` (`vite`), `build` (`tsc -p tsconfig.json --noEmit && vite build`), `test` (`vitest run`, included for parity though the root gate runs both projects via the workspace file).
- `packages/web/tsconfig.json` (new) — extends `../../tsconfig.base.json`; `lib: ["ES2022", "DOM", "DOM.Iterable"]`, `jsx: "react-jsx"`, `noEmit: true`; includes `src`, `test`, `vite.config.ts`. Core's tsconfig is untouched.
- `packages/web/vite.config.ts` (new) — `defineConfig` with `@vitejs/plugin-react`.
- `packages/web/index.html` (new) — Vite entry HTML, `#root` div, `<script type="module" src="/src/main.tsx">`.
- `packages/web/src/main.tsx` (new) — mounts `<App />` into `#root` via `ReactDOM.createRoot` inside `React.StrictMode`.
- `packages/web/src/App.tsx` (new) — minimal shell: `<h1>Carcassonne Scorer</h1>` plus a `data-testid="core-status"` paragraph rendering `CORE_READY` and `coreVersion()` imported from `@carcassonne/core`, proving the dependency wiring. No game/scoring logic.
- `packages/web/src/vite-env.d.ts` (new) — `/// <reference types="vite/client" />` for Vite's `ImportMeta` types.
- `packages/web/test/setup.ts` (new) — `import "@testing-library/jest-dom/vitest";` (jsdom project setup file, registers jest-dom matchers).
- `package-lock.json` — updated by `npm install` for the new dependency tree (React, Vite, Testing Library, jsdom, ESLint React plugins, etc.).

## Tests added/updated
- `packages/web/test/App.test.tsx` (new) — component smoke test under the `web` Vitest project (jsdom): renders `<App />` and asserts (1) the `Carcassonne Scorer` heading is present (`getByRole("heading", ...)`), and (2) the `core-status` test-id element's text contains `"Core ready: yes"` and matches the `coreVersion()` semver pattern — proving both the app shell renders and the core value is wired through.
- No core tests were modified; all 10 existing core suites (Items 001–010) continue to run unchanged under the `core` Vitest project (`environment: "node"`).

## How to verify
- `npm install` (already run; installs the new React/Vite/Testing-Library/jsdom/ESLint-React deps)
- `npm run lint && npm run build && npm test` from the repo root — observed exit 0:
  - `lint`: ESLint (`.ts` + `.tsx` + `.js`) and `prettier --check .` both clean.
  - `build`: `tsc -p packages/core/tsconfig.json --noEmit` (core, unchanged, lib ES2022 no DOM) then `npm run build -w @carcassonne/web` → `tsc -p packages/web/tsconfig.json --noEmit && vite build` (type-checks web with DOM lib, produces `packages/web/dist/`).
  - `test`: Vitest auto-loads `vitest.workspace.ts` → 11 test files, 256 tests passed (10 core suites unchanged + `packages/web/test/App.test.tsx`, 2 tests, under jsdom).
- `npm run dev` (root, delegates to `-w @carcassonne/web` → `vite`) — manually started in background; `curl http://localhost:5173/` returned HTTP 200 and the expected `index.html` (with Vite/React-refresh injection and the `#root` mount point); server was stopped after verification.

## Decisions (for doc-updater)
- **Vitest workspace over a single config.** Replaced the single root `vitest.config.ts` with `vitest.workspace.ts` defining `core` (node env, `packages/core/test/**/*.test.ts`) and `web` (jsdom env, `packages/web/test/**/*.test.{ts,tsx}`) projects. Vitest auto-discovers `vitest.workspace.ts` at the repo root, so the root `test` script (`vitest run`) needed no script-text change — it now runs both projects in one invocation.
- **Web build delegates to the package's own `build` script.** Root `build` became `tsc -p packages/core/tsconfig.json --noEmit && npm run build -w @carcassonne/web`, and `packages/web`'s own `build` script is `tsc -p tsconfig.json --noEmit && vite build`. This avoids double type-checking (no separate `tsc -p packages/web/tsconfig.json --noEmit` at the root level) while still type-checking + building web as part of `npm run build`.
- **Root `tsconfig.json` (lint-only) updated.** This file isn't part of either package's build — it exists only so ESLint's `**/*.ts` block has a `parserOptions.project` that covers root-level `.ts` config files (`eslint.config.js`-adjacent). It needed updating because it referenced the now-deleted `vitest.config.ts`; replaced with `vitest.workspace.ts` and added `packages/web/vite.config.ts` so both lint cleanly under `project` mode.
- **`.tsx` ESLint block parses against `packages/web/tsconfig.json`** (which has the DOM lib + `jsx: "react-jsx"`), kept fully separate from the `.ts` block's `./tsconfig.json` project — preserves the core/web boundary in tooling, not just in source.
- **`@testing-library/jest-dom` included** (spec listed it as optional) and wired via a `packages/web/test/setup.ts` `setupFiles` entry on the `web` Vitest project, registering matchers for future UI tests; the current smoke test itself only needs plain DOM assertions (`textContent`, `getByRole`) but the setup is in place for Items 012+.
- **`App` exports both a named `App` and a `default`** to support either import style cleanly in `main.tsx` and the test file; no behavior difference.
- **Versions actually installed** (resolved by npm from the caret ranges): `react`/`react-dom` 18.3.1, `vite` 5.4.21 — matching the spec's React 18 / Vite 5 decision.
- **Node engine warning noted, not acted on.** `npm install` emitted `EBADENGINE` warnings because the active Node on PATH is v17.4.0 while several new transitive deps (jsdom's `whatwg-url`, `@csstools/*`, etc.) declare `engines.node >= 18`. Install, build, lint, and test all completed successfully despite the warning, so this was not treated as a blocker — flagging it here in case the project later wants to pin/upgrade Node, since the spec's "Testing Prerequisites" section states Node 18+/20 LTS is expected.

## Blockers
None — `npm install` succeeded (registry reachable), and the full gate `npm run lint && npm run build && npm test` exits 0.
