import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/main.ts',
    'src/subscribeUtils.ts',
    'src/useCreateStore.ts',
    'src/devTools.ts',
    'src/utils.ts',
    'src/shallowEqual.ts',
  ],
  clean: true,
  format: ['cjs', 'esm'],
  esbuildOptions(options) {
    options.mangleProps = /[^_]_$/;
  },
});
