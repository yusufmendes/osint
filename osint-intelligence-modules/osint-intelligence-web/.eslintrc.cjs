/* eslint-env node */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  env: { browser: true, node: true, es2022: true },
  rules: {
    // intelligence is the shared data domain: must not import visualization siblings.
    'no-restricted-imports': ['error', {
      patterns: [{
        group: ['osint-gis-web', 'osint-video-web', 'osint-search-web', 'osint-mvp-web-shell'],
        message: 'osint-intelligence-web: importing visualization siblings (gis/video/search) is forbidden.',
      }],
    }],
  },
};
