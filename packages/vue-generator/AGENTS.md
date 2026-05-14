# TinyEngine vue-generator — Package Instructions

## Scope

This file applies to `packages/vue-generator/**`.

- These rules extend the repo-wide rules in the root `AGENTS.md`.
- Keep package-specific generator details here instead of growing the root file.

## Package Goal

`@opentiny/tiny-engine-dsl-vue` converts TinyEngine DSL schema JSON plus components map JSON into Vue single-file components.

This package is responsible for code generation output. Runtime behavior, designer-side execution, and app-level integration fixes should stay in their owning packages unless the generated SFC output is wrong.

## Key Paths

- `src/generator/vue/sfc/genSetupSFC.js`
- `src/generator/vue/sfc/generateAttribute.js`
- `src/generator/vue/sfc/generateTemplate.js`
- `src/generator/vue/sfc/generateScript.js`
- `src/generator/vue/sfc/generateStyle.js`
- `src/utils/formatCode.js`
- `test/testcases/sfc/`
- `test/testcases/element-plus-case/`
- `test/testcases/generator/`

## Architecture Rules

### Core pipeline

1. Input: schema JSON plus components map JSON
2. `CodeGenerator` hook pipeline: `transformStart` -> `transform` -> `transformEnd`
3. `genSetupSFC` orchestrates template, attribute, script, and style generation
4. Output: a complete `.vue` SFC

### Default attribute hook order

The default hook chain registered in `genSetupSFC.js` executes in this order:

1. `handleSlotParams`
2. `handleJsxModelValueUpdate`
3. `handleConditionAttrHook`
4. `handleLoopAttrHook`
5. `handleSlotBindAttrHook`
6. `handleAttrKeyHook`
7. `handlePrimitiveAttributeHook`
8. `handleExpressionAttrHook`
9. `handleJSFunctionAttrHook`
10. `handleI18nAttrHook`
11. `handleTinyIconPropsHook`
12. `handleObjBindAttrHook`
13. `handleEventAttrHook`

`handleBindUtilsHooks` still exists in `generateAttribute.js`, but it is not part of the default hook chain.

Do not reorder or change the default hook chain without approval.

### Global hooks

`genSetupSFC.js` exposes shared `globalHooks` helpers:

- `addState(key, value)`
- `addImport(fromPath, config)`
- `addMethods(key, value)`
- `addStatement(statement)`
- `setScriptConfig(config)`

These helpers mutate shared script-generation state. When debugging generated `<script>` output, imports, methods, or script config, inspect `genSetupSFC.js` and the downstream script generation path before adding new hooks.

### Quote-handling rules

- Primitive string attributes containing `"` may be emitted as `&quot;` or as a `v-bind` string literal, depending on whether the content also contains `'`.
- JSX slot mode is a separate path; do not assume primitive attribute escaping rules apply there unchanged.
- Quote behavior is sensitive to Prettier reformatting. Validate final formatted output, not only intermediate strings.
- When debugging quote output, inspect `generateAttribute.js` first and verify the formatted `.vue` result rather than raw intermediate strings.

## Fixture and Snapshot Workflow

- SFC cases live under `test/testcases/sfc/<caseName>/`.
- Follow the nearest existing fixture style. Valid schema names include `schema.json`, `page.schema.json`, `block.schema.json`, and `blocks.schema.json`.
- Components maps may be `components-map.json` or `componentsMap.json`.
- Expected outputs live in `expected/*.vue` and are compared with `toMatchFileSnapshot()` after `formatCode(res, 'vue')`.
- Test entry files typically follow `test/testcases/sfc/<caseName>/<caseName>.test.js`.

When generator output intentionally changes:

1. Update or add the smallest focused testcase that exposes the behavior.
2. Keep new fixtures minimal and isolate a single behavior whenever possible.
3. Regenerate or inspect the formatted output for that testcase.
4. Update only the affected `expected/*.vue` files.
5. Rerun the targeted testcase and then the full `test:unit` suite.

Do not bulk-rename fixture files just to normalize naming.

## Verification

Use the narrowest command that proves the change, then broaden as needed.

- Single testcase:
  `pnpm --filter @opentiny/tiny-engine-dsl-vue test:unit -- --run test/testcases/sfc/<case>/<case>.test.js`
- Full unit suite:
  `pnpm --filter @opentiny/tiny-engine-dsl-vue test:unit`
- Full coverage harness:
  `pnpm --filter @opentiny/tiny-engine-dsl-vue test`
- Build plus integration-style check:
  `pnpm --filter @opentiny/tiny-engine-dsl-vue test:latest`

Run the full `test:unit` suite before handoff if a change touches shared attribute generation, hook registration, script/style/template generation, or output formatting.

Use `test` or `test:latest` when the change affects broad generator behavior, package build output, or integration between generation and package build steps.

## Ask First

- Changing the default hook chain in `genSetupSFC.js`
- Editing `src/constant/index.js`
- Changing package build tooling or package scripts
- Changing shared quote-generation behavior across multiple attribute paths
- Changing quote-generation behavior before adding a focused testcase that proves the intended output

## Never

- Update `expected/*.vue` without validating the formatted generator output first
- Bypass `formatCode(res, 'vue')` when comparing expected SFC output
- Assume one fixture naming convention is canonical across the whole package
- Treat a snapshot diff by itself as proof that generated behavior is correct
