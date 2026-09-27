// Test entry point for the AIDE CLI (`aide.toml` → `[python] test_command`).
//
// `aide test` / `aide merge` spawn the configured command without a shell, so a
// bare `npm test` fails on Windows (npm is `npm.cmd` there). `node` is a real
// executable on every platform, and this script runs `npm test` through a shell.
//
// The CLI also appends pytest-only flags (`--continue-on-collection-errors`,
// `--junitxml=...`) that vitest rejects, so any arguments are deliberately
// dropped rather than forwarded.
import { spawnSync } from "node:child_process";

const result = spawnSync("npm test", { stdio: "inherit", shell: true });
process.exit(result.status ?? 1);
