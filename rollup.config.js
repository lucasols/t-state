// @ts-check
import typescript from 'rollup-plugin-typescript2';
import replace from '@rollup/plugin-replace';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import del from 'rollup-plugin-delete';
import autoExternal from 'rollup-plugin-auto-external';
import react from 'react';
// TODO: remove if is not used

export default [
  {
    input: 'src/index.ts',
    plugins: [
      autoExternal(),
      del({ targets: 'dist/*' }),
      nodeResolve(),
      commonjs({
        namedExports: {
          react: Object.keys(react),
        },
      }),
      replace({ __DEV__: 'false' }),
      typescript(),
      // terser({
      //   mangle: false,
      //   compress: {
      //     passes: 5,
      //   },
      // }),
    ],
    output: [
      {
        file: 'dist/index.js',
        format: 'cjs',
      },
      {
        file: 'dist/index.mjs',
        format: 'esm',
      },
    ],
  },
];
