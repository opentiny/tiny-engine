# TinyEngine — Repository Instructions for Coding Agents

## Purpose and Scope

This file is the canonical source of truth for repo-wide agent instructions.

- Applies to the whole repository unless a closer `AGENTS.md` overrides it for a subtree.
- `CLAUDE.md` is a compatibility entrypoint that imports this file. Do not maintain a second independent copy of the same rules.
- Keep this file limited to repo-wide guidance. Package-specific implementation details belong in package-level instruction files.

## Repository Snapshot

- Monorepo: pnpm workspaces + lerna (independent versioning)
- Primary stack: Vue 3, Vite, JavaScript/TypeScript
- Package manager: `pnpm` only for interactive work in this repo
- Designer app: `designer-demo/`
- Local mock backend: `mockServer/`

## Working Model

- Inspect the affected package, its `package.json`, and the nearest instruction file before editing.
- Keep changes scoped. Do not normalize unrelated files or rename fixtures just for consistency.
- Prefer targeted package-level validation over whole-repo commands when possible.
- Treat `pnpm lint` and `pnpm format` as mutating commands, not read-only verification.
- Do not invoke `npm` or `yarn` directly for normal repo work. Existing package scripts may still shell out internally; leave that alone unless the task is specifically about package scripts.

## Common Commands

### Read-mostly commands

```sh
pnpm install
pnpm dev
pnpm build:plugin
pnpm build:alpha
pnpm --filter @opentiny/tiny-engine-dsl-vue test:unit
```

### Mutating commands

```sh
pnpm lint     # ESLint with --fix
pnpm format   # Prettier --write
```

Canonical script definitions live in:

- `package.json`
- `packages/*/package.json`
- `.github/workflows/push-check.yml`
- `.github/workflows/Release.yml`

## Verification Matrix

Run the smallest sufficient verification for the change surface, then expand if the change is broad or risky.

1. Docs-only changes:
   No code verification required unless the docs change commands or workflow descriptions that should be checked against source files.
2. `packages/vue-generator/**`:
   Run the affected testcase or `pnpm --filter @opentiny/tiny-engine-dsl-vue test:unit`.
   If generator behavior changes, run the full `test:unit` suite before handoff and inspect any changed `expected/*.vue` files.
3. Published library packages under `packages/**`:
   Run the package-local `test` script if one exists.
   Run `pnpm build:plugin` when build output or published package behavior may be affected.
4. `designer-demo/**` or shared packages consumed by the demo:
   Run `pnpm build:alpha`.
5. Cross-package build or release-facing changes:
   Run `pnpm build:plugin` and `pnpm build:alpha`.
6. Config, workspace, CI, or release script changes:
   Verify the directly affected command(s) after approval.

## Approval Boundaries

### Always OK

- Read any source file
- Run targeted tests and builds
- Edit implementation files inside existing packages
- Add or update tests that match the scope of the change
- Update docs that reflect current repo behavior

### Ask First

- Changing workspace, lerna, pnpm, ESLint, Prettier, or TypeScript configuration
- Modifying CI workflows, release scripts, or publish flows
- Upgrading major dependencies or changing pinned overrides
- Reordering or adding/removing default vue-generator attribute hooks
- Large-scale edits to generated mappings or vendored patches

When asking first, include:

- what you want to change
- why the current rules or implementation are insufficient
- what verification you would run after approval

### Never

- Use `npm` or `yarn` directly for routine repo commands
- Skip hooks with `--no-verify`
- Hardcode versions for workspace packages
- Edit `patches/` without understanding the upstream issue and the patch purpose
- Rewrite generated expectations or snapshots without validating the new output first

## Task-Specific Expectations

- Bug fix:
  Add or update a regression test when behavior changes.
- Refactor:
  Preserve behavior and prove it with targeted verification.
- Snapshot or generated output change:
  Explain why the output changed and list the affected fixture directories.
- Commit or PR work:
  Only do it if asked. Use Conventional Commits and target `develop` unless the user specifies otherwise.

## Gotchas

- `pnpm install` is enforced by `preinstall`; npm and yarn are rejected for direct repo usage.
- `pnpm lint` writes fixes. Use it deliberately.
- CI relies on `build:plugin` and `build:alpha`, not only lint or unit tests.
- Test directories such as `test/`, `expected/`, and `output/` are not always linted; do not treat lint success as fixture validation.
