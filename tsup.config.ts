import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/main.ts'],
  clean: true,
  format: ['cjs', 'esm'],
  // @ls-stack/utils ships ESM-only, inline it to keep the CJS build working
  noExternal: ['@ls-stack/utils'],
  esbuildOptions(options) {
    options.mangleProps = /[^_]_$/;
  },
});
