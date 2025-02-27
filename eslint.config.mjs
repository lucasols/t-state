// @ts-check
import { cfgFlags, lsStackEslintCfg } from '@ls-stack/eslint-cfg'

const { OFF } = cfgFlags

export default lsStackEslintCfg({
  tsconfigRootDir: import.meta.dirname,
  rules: {
    '@typescript-eslint/no-explicit-any': OFF,
    '@typescript-eslint/no-unsafe-assignment': OFF,
  },
})
