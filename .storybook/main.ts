import type { StorybookConfig } from '@storybook/react-webpack5';
import path from 'path';

// Shared Sass resources that mirror the rspack.config.js sass-resources-loader setup.
// LoadingIndicator and most other components use $brand-primary and other bootstrap/global
// variables that are only available if these are injected into every SCSS compilation.
const sassResources = [
    path.resolve(
        __dirname,
        '../node_modules/bootstrap-sass/assets/stylesheets/bootstrap/_variables.scss'
    ),
    path.resolve(
        __dirname,
        '../node_modules/bootstrap-sass/assets/stylesheets/bootstrap/_mixins'
    ),
    path.resolve(__dirname, '../src/globalStyles/variables.scss'),
];

const config: StorybookConfig = {
    stories: ['../src/**/*.stories.@(ts|tsx)'],

    addons: [
        '@storybook/addon-essentials',
        // Use SWC instead of Babel for faster builds. Decorator options are
        // applied directly in webpackFinal below because the addon's
        // swcLoaderOptions merging is unreliable across patch versions.
        '@storybook/addon-webpack5-compiler-swc',
    ],

    framework: {
        name: '@storybook/react-webpack5',
        options: {},
    },

    webpackFinal: async config => {
        // Patch the SWC loader rule installed by addon-webpack5-compiler-swc to
        // enable legacy TypeScript decorators. MobX @observer/@observable/@computed
        // require `legacyDecorator: true`; without it SWC throws "Expression expected"
        // on every decorated class. We also set react.runtime to 'classic' because
        // the project is on React 16 which doesn't have the automatic JSX runtime.
        if (config.module?.rules) {
            config.module.rules = config.module.rules.map(rule => {
                if (!rule || typeof rule !== 'object') return rule;
                const r = rule as any;
                const uses: any[] = Array.isArray(r.use)
                    ? r.use
                    : r.use
                    ? [r.use]
                    : [];
                const swcIndex = uses.findIndex(
                    (u: any) =>
                        typeof u === 'object' &&
                        typeof u?.loader === 'string' &&
                        u.loader.includes('swc-loader')
                );
                if (swcIndex === -1) return rule;
                const patchedUses = [...uses];
                patchedUses[swcIndex] = {
                    loader: uses[swcIndex].loader,
                    options: {
                        jsc: {
                            parser: {
                                syntax: 'typescript',
                                tsx: true,
                                decorators: true,
                            },
                            transform: {
                                legacyDecorator: true,
                                decoratorMetadata: false,
                                react: { runtime: 'classic' },
                            },
                        },
                    },
                };
                return { ...r, use: patchedUses };
            });
        }

        // Add src/ as a module root so that repo-style imports like
        // 'shared/components/Foo' resolve to 'src/shared/components/Foo',
        // matching the tsconfig `"*": ["src/*"]` path mapping.
        config.resolve!.modules = [
            path.resolve(__dirname, '../src'),
            'node_modules',
        ];

        // SCSS modules: mirror the rspack chain so $brand-primary and other
        // global variables are available in every .module.scss file.
        config.module!.rules!.push({
            test: /\.module\.scss$/,
            use: [
                'style-loader',
                {
                    loader: 'css-loader',
                    options: {
                        modules: {
                            localIdentName: '[name]__[local]--[hash:base64:5]',
                        },
                        importLoaders: 2,
                    },
                },
                'sass-loader',
                {
                    loader: 'sass-resources-loader',
                    options: { resources: sassResources },
                },
            ],
        });

        // Plain (non-module) SCSS
        config.module!.rules!.push({
            test: /\.scss$/,
            exclude: /\.module\.scss$/,
            use: [
                'style-loader',
                'css-loader',
                'sass-loader',
                {
                    loader: 'sass-resources-loader',
                    options: { resources: sassResources },
                },
            ],
        });

        return config;
    },
};

export default config;
