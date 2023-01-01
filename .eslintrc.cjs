const OFF = 0;
const WARN = 1;
const ERROR = 2;

module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    createDefaultProgram: true,
    ecmaVersion: 8,
    ecmaFeatures: {
      jsx: true,
    },
    useJSXTextNode: true,
    sourceType: 'module',
  },
  env: {
    browser: true,
  },
  plugins: ['@typescript-eslint'],

  rules: {
    'no-warning-comments': [WARN, { terms: ['FIX:'] }],
    'no-constant-binary-expression': ERROR,
    'object-shorthand': ERROR,
    'no-useless-rename': ERROR,
    'no-param-reassign': ERROR,

    'no-prototype-builtins': OFF,
    'no-undef': OFF,

    /* typescript */
    '@typescript-eslint/no-explicit-any': OFF,
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'typeLike',
        format: ['PascalCase'],
      },
    ],
    '@typescript-eslint/no-throw-literal': ERROR,
    '@typescript-eslint/no-unused-expressions': ERROR,
    '@typescript-eslint/no-unused-vars': [ERROR, { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-shadow': [ERROR, { ignoreOnInitialization: true }],
    '@typescript-eslint/no-non-null-assertion': OFF,

    /* jest */
    'jest/expect-expect': [ERROR, { assertFunctionNames: ['expect*'] }],
    'jest/no-deprecated-functions': OFF,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:jest/recommended',
    'plugin:jest/style',
  ],
};
