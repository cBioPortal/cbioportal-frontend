import typescript from 'rollup-plugin-typescript2';
import commonjs from '@rollup/plugin-commonjs';
import externals from 'rollup-plugin-node-externals';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import sourcemaps from 'rollup-plugin-sourcemaps';

// Two entries: the light `index` (types and helpers the host imports
// statically) and the heavy `viewer` (the React viewer the host loads
// lazily). Modules are preserved one file per source module so the host
// bundler can tree-shake the light entry and keep the dynamic
// `import('openseadragon')` as its own async chunk.
export default {
    input: {
        index: 'src/index.ts',
        viewer: 'src/viewer.ts',
    },
    preserveModules: true,
    output: [
        {
            dir: 'dist',
            format: 'cjs',
            exports: 'named',
            sourcemap: true,
            entryFileNames: '[name].js',
        },
        {
            dir: 'dist/es',
            format: 'es',
            exports: 'named',
            sourcemap: true,
            entryFileNames: '[name].js',
        },
    ],
    plugins: [
        externals(),
        typescript({
            clean: true,
        }),
        json(),
        commonjs(),
        resolve(),
        sourcemaps(),
    ],
    watch: {
        chokidar: {
            usePolling: true,
        },
    },
};
