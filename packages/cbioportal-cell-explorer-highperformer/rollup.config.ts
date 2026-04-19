// Custom rollup config (not re-using ../config/rollup.config) so we can pass
// `extensions: ['.ts', '.js']` to the worker-loader plugin — the worker source
// is TypeScript, and the plugin defaults to .js only.
import typescript from 'rollup-plugin-typescript2';
import commonjs from '@rollup/plugin-commonjs';
import externals from 'rollup-plugin-node-externals';
import json from '@rollup/plugin-json';
import postcss from 'rollup-plugin-postcss';
import resolve from '@rollup/plugin-node-resolve';
import sourcemaps from 'rollup-plugin-sourcemaps';
import image from '@rollup/plugin-image';
import postcssUrl from 'postcss-url';
import workerLoader from 'rollup-plugin-web-worker-loader';
import pkg from './package.json';

export default {
    input: 'src/index.ts',
    output: [
        {
            file: pkg.main,
            format: 'cjs',
            exports: 'named',
            sourcemap: true,
        },
        {
            file: pkg.module,
            format: 'es',
            exports: 'named',
            sourcemap: true,
        },
    ],
    plugins: [
        externals({
            // Everything else stays external (consumer resolves from node_modules).
            // zod/tslib are inlined ONLY in the worker — see workerLoader `external`
            // option below, which overrides per-worker. Putting them in this main
            // `exclude` list bloats the main bundle 10x by inlining all of zod there.
        }),
        postcss({
            autoModules: true,
            extract: pkg.styles,
            plugins: [postcssUrl({ url: 'inline' })],
        }),
        image(),
        typescript({ clean: true }),
        json(),
        workerLoader({
            targetPlatform: 'browser',
            inline: true,
            extensions: ['.ts', '.js'],
            preserveSource: false,
            // Skip node-externals in the worker sub-build so zod/tslib get
            // inlined into the worker blob (they cannot resolve as ES imports
            // at worker runtime). They stay externalized in the main bundle.
            skipPlugins: [
                'node-externals',
                'liveServer',
                'serve',
                'livereload',
            ],
        }),
        commonjs(),
        resolve(),
        sourcemaps(),
    ],
    watch: {
        chokidar: { usePolling: true },
    },
};
