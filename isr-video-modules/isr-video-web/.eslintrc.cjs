/**
 * isr-video-web — visualization domain. May import isr-web-core and
 * isr-intelligence-web. MUST NOT import any sibling visualization module.
 */
module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } },
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  settings: { react: { version: 'detect' } },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'off',
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['isr-gis-web', 'isr-search-web'],
            message:
              'Domain modules MUST NOT import sibling visualization modules. Only isr-web-core and isr-intelligence-web are allowed across the boundary.',
          },
        ],
      },
    ],
  },
  ignorePatterns: ['node_modules', 'dist', 'build', 'coverage'],
};
