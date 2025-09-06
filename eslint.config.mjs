// @ts-check
import { cfgFlags, lsStackEslintCfg } from '@ls-stack/eslint-cfg';

const { OFF } = cfgFlags;

export default lsStackEslintCfg({
  tsconfigRootDir: import.meta.dirname,
  rules: {
    '@typescript-eslint/no-explicit-any': OFF,
    '@typescript-eslint/no-unsafe-assignment': OFF,
    '@typescript-eslint/no-non-null-assertion': OFF,
    '@typescript-eslint/consistent-type-assertions': OFF,
  },
  extends: [
    {
      files: ['test/**/*.test.{ts,tsx}'],
      rules: {
        '@ls-stack/prefer-named-functions': OFF,
        '@ls-stack/require-description': OFF,
        'unicorn/no-array-for-each': OFF,
      },
    },
  ],
});
