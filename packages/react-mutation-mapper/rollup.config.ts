import typescript from 'rollup-plugin-typescript2';
import commonjs from 'rollup-plugin-commonjs';
// import external from 'rollup-plugin-peer-deps-external';
import autoExternal from 'rollup-plugin-auto-external';
// import postcss from 'rollup-plugin-postcss-modules'
import postcss from 'rollup-plugin-postcss';
import resolve from 'rollup-plugin-node-resolve';
import sourcemaps from 'rollup-plugin-sourcemaps';
import url from 'rollup-plugin-url';
import svgr from '@svgr/rollup';

import pkg from './package.json';

export default {
  input: 'src/index.tsx',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      exports: 'named',
      sourcemap: true
    },
    {
      file: pkg.module,
      format: 'es',
      exports: 'named',
      sourcemap: true
    }
  ],
  plugins: [
    autoExternal(),
    postcss({
      modules: true
    }),
    url(),
    svgr(),
    typescript({
      rollupCommonJSResolveHack: true,
      clean: true
    }),
    commonjs(),
    resolve(),
    sourcemaps()
  ]
}
