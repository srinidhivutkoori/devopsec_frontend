// eslint.config.js
// ESLint flat-config for the whiteboard frontend.
// Enforces React Hooks rules, React Refresh constraints, and general code-quality
// rules (no unused vars, no console leaks, eqeqeq, etc.) to keep the codebase
// maintainable and catch common bugs early during CI/CD static-analysis checks.

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // Ignore compiled output and dependency folders
  globalIgnores(['dist', 'node_modules']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      // ESLint built-in recommended rules (catches common JS errors)
      js.configs.recommended,
      // Enforces rules-of-hooks and exhaustive-deps for React Hooks
      reactHooks.configs.flat.recommended,
      // Warns about components that cannot be safely fast-refreshed in Vite
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Unused variables are often leftover code - flag them but allow uppercase
      // constants that may be imported for side-effects or type documentation.
      // Allow uppercase identifiers (component aliases like Icon) and underscore-prefixed
      // variables/args that are intentionally unused (common in catch blocks).
      'no-unused-vars': ['warn', {
        varsIgnorePattern: '^[A-Z_]',
        argsIgnorePattern: '^_|^[A-Z]',
        caughtErrorsIgnorePattern: '^_',
      }],

      // Enforce strict equality to avoid surprising type coercion bugs
      'eqeqeq': ['error', 'always'],

      // Disallow console.log leaking into production builds
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // Catch common React prop-types omissions (structural safety)
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Prevent use of var - prefer const/let for block scoping
      'no-var': 'error',

      // Prefer const when variable is never reassigned
      'prefer-const': ['warn', { destructuring: 'any' }],
    },
  },
])
