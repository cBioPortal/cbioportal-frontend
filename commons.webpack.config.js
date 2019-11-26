var MiniCssExtractPlugin = require('mini-css-extract-plugin');
var WebpackFailPlugin = require('webpack-fail-plugin');
var ProgressBarPlugin = require('progress-bar-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var nodeExternals = require('webpack-node-externals');
var GeneratePackageJsonPlugin =require('generate-package-json-webpack-plugin');
var TerserPlugin = require('terser-webpack-plugin');

var commit = 'unknown';
var version = '0.0.24';

const NODE_ENV = process.env.NODE_ENV || 'development';

const dotenv = require('dotenv');

const webpack = require('webpack');
const path = require('path');

const join = path.join;
const resolve = path.resolve;

const isDev = NODE_ENV === 'development';
const isTest = NODE_ENV === 'test';

const root = resolve(__dirname);
const src = join(root, 'src');
const common = join(src, 'common');
const publicLib = join(src, 'public-lib');
const modules = join(root, 'node_modules');

const fontPath = 'lib/[hash].[ext]';
const imgPath = 'lib/images/[hash].[ext]';

var sassResourcesLoader =  {
    loader:'sass-resources-loader',
    options: {
        resources:[
            path.resolve(__dirname, 'node_modules/bootstrap-sass/assets/stylesheets/bootstrap/_variables.scss'),
            path.resolve(__dirname, 'node_modules/bootstrap-sass/assets/stylesheets/bootstrap/_mixins'),
            // './src/globalStyles/variables.scss'
        ]
    }
};

var basePackageValues = {
    name: "cbioportal-frontend-commons",
    version: version,
    main: "./cbioportal-frontend-commons.js",
    module: "./cbioportal-frontend-commons.js",
    typings: "./index.d.ts",
    peerDependencies: {
        "mobx": "^3.0.0 || ^4.0.0 || ^5.0.0",
        "mobx-react": "^4.0.0 || ^5.0.0",
        "react": "^15.0.0 || ^16.0.0",
        "react-dom": "^15.0.0 || ^16.0.0"
    }
};

var config = {

    entry: [
        `babel-polyfill`,
        `${path.join(src, 'public-lib/index.tsx')}`
    ],

    output: {
        filename: 'cbioportal-frontend-commons.js',
        path:  path.resolve(__dirname, 'commons-dist'),

        // The name of the global variable which the library's
        // require() function will be assigned to
        library: 'cbioportal-frontend-commons',
        libraryTarget: 'commonjs-module'
    },

    optimization: {
        minimizer: [
            new TerserPlugin({
                parallel: !process.env.NO_PARALLEL,
                sourceMap: true
            })
        ]
    },

    externals: [
        nodeExternals()
    ],

    resolve: {
        'extensions': [
            '.js',
            '.jsx',
            '.json',
            '.ts',
            '.tsx'
        ],

        // alias: {
        //     css: join(src, 'styles'),
        //     containers: join(src, 'containers'),
        //     components: join(src, 'components'),
        //     utils: join(src, 'utils'),
        //     styles: join(src, 'styles'),
        //     pages: join(src, 'pages'),
        //     shared: join(src, 'shared'),
        //     appConfig: path.join(__dirname + '/src', 'config', ((process.env.NODE_ENV === 'test')? 'test.' : '') + 'config')
        // }

    },

    resolveLoader: {
        modules: [
            path.resolve(__dirname, 'loaders'),
            path.join(process.cwd(), 'node_modules')
        ]
    },

    plugins: [
        new webpack.DefinePlugin({
            'VERSION': version,
            'COMMIT': commit,
            // 'ENV_CBIOPORTAL_URL': isDev && process.env.CBIOPORTAL_URL? JSON.stringify(cleanAndValidateUrl(process.env.CBIOPORTAL_URL)) : '"replace_me_env_cbioportal_url"',
            // 'ENV_GENOME_NEXUS_URL': isDev && process.env.GENOME_NEXUS_URL? JSON.stringify(cleanAndValidateUrl(process.env.GENOME_NEXUS_URL)) : '"replace_me_env_genome_nexus_url"'
        }),
        new GeneratePackageJsonPlugin(basePackageValues, __dirname + "/package.json"),
        // new HtmlWebpackPlugin({cache: false, template: 'my-index.ejs'}),
        WebpackFailPlugin,
        new ProgressBarPlugin(),
        // new webpack.DllReferencePlugin({
        //     context: '.',
        //     manifest: require('./common-dist/common-manifest.json')
        // }),
        new CopyWebpackPlugin([
            // {from: './common-dist', to: 'reactapp'},
            // {from: './src/rootImages', to: 'images'},
            // {from: './src/pages/resultsView/network', to: 'reactapp/network'},
            // {from: './src/globalStyles/prefixed-bootstrap.min.css', to: 'reactapp/prefixed-bootstrap.min.css'},
            // {from: './src/shared/legacy/igv.min.js', to: 'reactapp/igv.min.js'},
            // {from: './src/shared/legacy/igv.css', to: 'reactapp/igv.css'},
            // {from: './src/globalStyles/prefixed-bootstrap.min.css.map', to: 'reactapp/prefixed-bootstrap.min.css.map'}
        ]) // destination is relative to dist directory
    ],

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [
                    {
                        loader: "babel-loader",
                        options: {
                            "presets": ["@babel/preset-env", "@babel/preset-react"],
                            // "cacheDirectory": babelCacheFolder
                        }
                    },
                    {
                        loader: "ts-loader",
                        options: {
                            //transpileOnly: (isDev || isTest)
                            configFile: 'tsconfig-commons.json'
                        }
                    }
                ],
                exclude: /node_modules/
            },
            {
                test: /\.(js|jsx|babel)$/,
                use: [{
                    loader: "babel-loader",
                    options: {
                        "presets": ["@babel/preset-env", "@babel/preset-react"]
                    }
                }],
                exclude: /node_modules/
            },
            {
                test: /\.otf(\?\S*)?$/,
                use: [{
                    loader: `url-loader`,
                    options: {
                        name: fontPath,
                        limit: 10000
                    }
                }]
            },
            {
                test: /\.eot(\?\S*)?$/,
                use: [{
                    loader: `url-loader`,
                    options: {
                        name: fontPath,
                        limit: 10000
                    }
                }],
            },
            {
                test: /\.svg(\?\S*)?$/,
                use: [
                    {
                        loader: `url-loader`,
                        options: {
                            name: fontPath,
                            mimetype: 'image/svg+xml',
                            limit: 10000
                        }
                    }
                ],
            },
            {
                test: /\.ttf(\?\S*)?$/,
                use: [{
                    loader: `url-loader`,
                    options: {
                        name: fontPath,
                        mimetype: 'application/octet-stream',
                        limit: 10000
                    }
                }],
            },
            {
                test: /\.woff2?(\?\S*)?$/,
                use: [{
                    loader: `url-loader`,
                    options: {
                        name: fontPath,
                        mimetype: 'application/font-woff',
                        limit: 10000
                    }
                }],
            },
            {
                test: /\.(jpe?g|png|gif)$/,
                use: [{
                    loader: `url-loader`,
                    options: {
                        name: imgPath,
                        limit: 10000
                    }
                }],
            },
            {
                test: /\.swf$/,
                use: [
                    {
                        loader: `file-loader`,
                        options: {
                            name: imgPath
                        }
                    }
                ],
            },
            {
                test: /\.pdf$/,
                use: [
                    {
                        loader: `url-loader`,
                        options: {
                            name: imgPath,
                            limit: 1
                        }
                    }
                ],
            },
            {
                test: /\.js$/,
                enforce: "pre",
                use: [{
                    loader: "source-map-loader",
                }]
            },
            {
                test: require.resolve("3dmol"),
                // 3Dmol expects "this" to be the global context
                use: "imports-loader?this=>window"
            }
        ],

        noParse: [/jspdf/],
    }
};


// ENV variables
// const dotEnvVars = dotenv.config();
// const environmentEnv = dotenv.config({
//     path: join(root, 'config', `${NODE_ENV}.config.js`),
//     silent: true
// });
// const envVariables =
//     Object.assign({}, dotEnvVars, environmentEnv);

// const defines =
//     Object.keys(envVariables)
//         .reduce((memo, key) => {
//             const val = JSON.stringify(envVariables[key]);
//             memo[`__${key.toUpperCase()}__`] = val;
//             return memo;
//         }, {
//             __NODE_ENV__: JSON.stringify(NODE_ENV),
//             __DEBUG__: isDev
//         });

config.plugins = [
    // new webpack.DefinePlugin(defines),
    new MiniCssExtractPlugin({
        filename:'styles.css',
        allChunks: true
    }),
    new webpack.ProvidePlugin({
        $: "jquery",
        jQuery: "jquery"
    })
].concat(config.plugins);
// END ENV variables

//config.module.loaders.push.apply(this);

// include jquery when we load boostrap-sass
config.module.rules.push(
    {
        test: /bootstrap-sass[\/\\]assets[\/\\]javascripts[\/\\]/,
        use: [{
            loader:'imports-loader',
            options:{
                'jQuery':'jquery'
            }
        }]
    }
);

config.devtool = 'source-map';
config.output.publicPath = '/';

// css modules for any scss matching test
config.module.rules.push(
    {
        test: /\.module\.scss$/,
        use: [
            {
                loader: MiniCssExtractPlugin.loader,
                options: {
                    fallback: 'style-loader'
                }
            },
            {
                loader: 'css-loader',
                options: {
                    modules:true
                }
            },
            'sass-loader',
            sassResourcesLoader
        ]
    }
);

config.module.rules.push(
    {
        test: /\.scss$/,
        exclude: /\.module\.scss/,
        use: [
            {
                loader: MiniCssExtractPlugin.loader,
                options: {
                    fallback: 'style-loader'
                }
            },
            'css-loader',
            'sass-loader',
            sassResourcesLoader
        ]
    }
);

config.module.rules.push(
    {
        test: /\.css/,
        use: [
            {
                loader: MiniCssExtractPlugin.loader,
                options: {
                    fallback: 'style-loader'
                },
            },
            'css-loader'
        ]
    }
);

//config.entry.push('bootstrap-loader');
// END BOOTSTRAP LOADER

//config.entry.push('font-awesome-webpack');

// Roots
config.resolve.modules = [
    publicLib,
    common,
    modules
];

// end Roots

module.exports = config;
