import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/t-state.ts', 'src/subscribeUtils.ts', 'src/useCreateStore.ts'],
  clean: true,
  format: ['cjs', 'esm'],
  esbuildOptions(options) {
    options.mangleProps = /[^_]_$/
  },
})
