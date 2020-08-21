import typescript from 'rollup-plugin-typescript2';
import commonjs from '@rollup/plugin-commonjs';
// import external from 'rollup-plugin-peer-deps-external';
import autoExternal from 'rollup-plugin-auto-external';
import json from '@rollup/plugin-json';
import postcss from 'rollup-plugin-postcss';
import resolve from '@rollup/plugin-node-resolve';
import sourcemaps from 'rollup-plugin-sourcemaps';
import url from '@rollup/plugin-url';
import postcssUrl from 'postcss-url';
import svgr from '@svgr/rollup';

// common rollup config options for all libraries under packages
export default function getRollupOptions(
    input,
    mainOutput,
    moduleOutput,
    styles
) {
    return {
        input: input,
        output: [
            {
                file: mainOutput,
                format: 'cjs',
                exports: 'named',
                sourcemap: true,
            },
            {
                file: moduleOutput,
                format: 'es',
                exports: 'named',
                sourcemap: true,
            },
        ],
        plugins: [
            autoExternal(),
            postcss({
                autoModules: true,
                extract: styles,
                plugins: [
                    postcssUrl({
                        url: 'inline',
                    }),
                ],
            }),
            url(),
            svgr(),
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
}
