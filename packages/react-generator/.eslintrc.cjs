/**
 * Minimal ESLint config for tests to lint generated JSX without errors.
 */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  // No rules enabled by default; this is only to ensure parsing succeeds.
  rules: {},
};
