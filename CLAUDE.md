# Carcassonne scorer

Scorekeeper companion for the physical board game Carcassonne. Scope and principles: `docs/aide/vision.md`; status: `docs/aide/progress.md` (the only status source).

## Project

- TypeScript npm-workspaces monorepo: `packages/core` (platform-independent catalog, board model, scoring, session model — no DOM/UI) and `packages/web` (React 18 + Vite UI, thin over the core; no scoring/tally arithmetic in the UI).
- Tests: Vitest (core on `node`, web on `jsdom` + Testing Library), co-located under `packages/*/test/`.
- Gate: `npm run lint`, `npm run build`, `npm test` (each its own command). Dev server: `npm run dev`.

## Process

Work is driven by the AIDE loop (aide-loop): `/aide-run-item`, `/aide-run-queue`, `/aide-run-roadmap`. `git.mode = "auto-merge"` — remote `origin` (GitHub, `BeyondTheBoardEU/CarcassonneScorer`); claim branches are pushed and `aide merge` lands validated items on `main` and pushes. Never force-push. `docs/aide/runs/` is a legacy archive from the pre-aide-loop pipeline.

@.aide/AGENT-CONTEXT.md
