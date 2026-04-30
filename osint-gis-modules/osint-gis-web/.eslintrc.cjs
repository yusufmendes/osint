/* eslint-env node */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  env: { browser: true, node: true, es2022: true },
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [{
        group: ['osint-video-web', 'osint-search-web', 'osint-mvp-web-shell'],
        message: 'Visualization domain modules MUST NOT import sibling visualization modules.',
      }],
    }],
  },
};
