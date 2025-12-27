import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  {
    ignores: [
      '**/coverage/**', 
      '**/dist/**',
      '**/node_modules/**',
      '**/migrations/**',
      '**/generated/**',      // prisma sql migrations
      '**/*.d.ts',            // type definitions
    ],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    languageOptions: { 
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,      // backend mode by default
        ...globals.es2021,
        },
      },
     parserOptions: {
      project: true,
      tsconfigRootDir: __dirname,
     },
     rules: {
       '@typescript-eslint/no-explicit-any': 'error',
       '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
       'eqeqeq': ['error', 'always'],
       'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
       'prefer-const': 'error',
     },
  },
   ...tseslint.configs.recommended,
  {
    files: ['srcs/nginx/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.browser,
      }
    }
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: {
        project: false, // No tsconfig for config JS
      },
    },
    rules: {
        // add standard rules if needed
    }
  },
  eslintConfigPrettier,
];
