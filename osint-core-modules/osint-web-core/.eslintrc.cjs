/* eslint-env node */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  env: { browser: true, node: true, es2022: true },
  rules: {
    // osint-web-core is the lowest layer: it must not import any osint-*-web package.
    'no-restricted-imports': ['error', {
      patterns: [{
        group: [
          'osint-mvp-web-shell',
          'osint-gis-web',
          'osint-video-web',
          'osint-search-web',
          'osint-intelligence-web',
        ],
        message: 'osint-web-core is the base layer: importing any osint-*-web package is forbidden.',
      }],
    }],
  },
};
