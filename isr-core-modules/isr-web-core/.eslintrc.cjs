/**
 * isr-web-core — bottom of the dependency graph.
 * Must NOT depend on any domain or shell module.
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
            group: ['isr-gis-web', 'isr-video-web', 'isr-intelligence-web', 'isr-search-web'],
            message:
              'isr-web-core is the bottom of the dependency graph; it MUST NOT import any domain module.',
          },
        ],
      },
    ],
  },
  ignorePatterns: ['node_modules', 'dist', 'build', 'coverage'],
};
