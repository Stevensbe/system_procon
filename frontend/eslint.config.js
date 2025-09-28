import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

const IGNORES = [
  'dist/**',
  'build/**',
  'coverage/**',
  'node_modules/**',
  'public/**',
  'tests/e2e/**',
  'scripts/**',
  'dev-server-mobile.js',
  'dev-server-*.js'
];

export default [
  {
    ignores: IGNORES,
  },
  {
    files: [
      'src/components/caixa-entrada/**/*.{js,jsx}',
      'src/pages/caixa-entrada/**/*.{js,jsx}',
      'src/services/caixaEntradaService.js'
    ],
    rules: {
      ...js.configs.recommended.rules,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-unused-vars': 'off'
    },
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
  },
];
