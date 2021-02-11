var MiniCssExtractPlugin = require('mini-css-extract-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var WebpackFailPlugin = require('webpack-fail-plugin');
var ProgressBarPlugin = require('progress-bar-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
var TerserPlugin = require('terser-webpack-plugin');
var { TypedCssModulesPlugin } = require('typed-css-modules-webpack-plugin');

var commit = '"unknown"';
var version = '"unknown"';
// Don't show COMMIT/VERSION on Heroku (crashes, because no git dir)
if (process.env.PATH.indexOf('heroku') === -1) {
    // show full git version
    var GitRevisionPlugin = require('git-revision-webpack-plugin');
    var gitRevisionPlugin = new GitRevisionPlugin({
        versionCommand: 'describe --always --tags --dirty',
    });
    commit = JSON.stringify(gitRevisionPlugin.commithash());
    version = JSON.stringify(gitRevisionPlugin.version());
}

function cleanAndValidateUrl(url) {
    if (typeof url === 'string') {
        // we need to support legacy configuration values
        console.log(url);
        if (/^http/.test(url) === false) {
            throw 'URLS MUST START WITH PROTOCOL';
        }
        let cleanAndValidateUrl = url.replace(/\/$/, ''); // get rid of trailing slashes
        return cleanAndValidateUrl;
    } else {
        throw `Not a url: ${url}`;
    }
}

const NODE_ENV = process.env.NODE_ENV || 'development';

var jsonFN = require('json-fn');

const dotenv = require('dotenv');

const webpack = require('webpack');
const path = require('path');

const join = path.join;
const resolve = path.resolve;

const isDev = NODE_ENV === 'development';
const isTest = NODE_ENV === 'test';

// devServer config
const devHost = process.env.HOST || 'localhost';
const devPort = process.env.PORT || 3000;

const root = resolve(__dirname);
const src = join(root, 'src');
const modules = join(root, 'node_modules');
const common = join(src, 'common');
const dest = join(root, 'dist');
const css = join(src, 'styles');

const fontPath = 'reactapp/[hash].[ext]';
const imgPath = 'reactapp/images/[hash].[ext]';

const babelCacheFolder = process.env.BABEL_CACHE_FOLDER || false;

// we don't need sourcemaps on circleci
const sourceMap = process.env.DISABLE_SOURCEMAP ? '' : 'source-map';

var routeComponentRegex = /routes\/([^\/]+\/?[^\/]+).js$/;

var sassResourcesLoader = {
    loader: 'sass-resources-loader',
    options: {
        resources: [
            path.resolve(
                __dirname,
                'node_modules/bootstrap-sass/assets/stylesheets/bootstrap/_variables.scss'
            ),
            path.resolve(
                __dirname,
                'node_modules/bootstrap-sass/assets/stylesheets/bootstrap/_mixins'
            ),
            './src/globalStyles/variables.scss',
        ],
    },
};

var config = {
    stats: {
        colors: true,
    },

    entry: [`babel-polyfill`, `${path.join(src, 'appBootstrapper.jsx')}`],
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'reactapp/[name].app.js',
        chunkFilename: 'reactapp/[name].[chunkhash].chunk.js',
        // cssFilename: 'reactapp/app.css',
        // hash: false,
        publicPath: '/',
    },

    optimization: {
        minimizer: [
            new TerserPlugin({
                parallel: !process.env.NO_PARALLEL,
            }),
        ],
    },

    resolve: {
        extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],

        alias: {
            css: join(src, 'styles'),
            containers: join(src, 'containers'),
            components: join(src, 'components'),
            utils: join(src, 'utils'),
            styles: join(src, 'styles'),
            pages: join(src, 'pages'),
            shared: join(src, 'shared'),
            pako: join(
                path.join(__dirname + '/node_modules/pako/dist/pako.es5.js')
            ),
            appConfig: path.join(
                __dirname + '/src',
                'config',
                (process.env.NODE_ENV === 'test' ? 'test.' : '') + 'config'
            ),
        },
    },

    resolveLoader: {
        modules: [
            'node_modules',
            path.join(process.cwd(), 'node_modules'),
            path.resolve(__dirname, 'loaders'),
        ],
    },

    plugins: [
        new webpack.DefinePlugin({
            VERSION: version,
            COMMIT: commit,
            IS_DEV_MODE: isDev,
            ENV_CBIOPORTAL_URL: process.env.CBIOPORTAL_URL
                ? JSON.stringify(
                      cleanAndValidateUrl(process.env.CBIOPORTAL_URL)
                  )
                : '"replace_me_env_cbioportal_url"',
            ENV_GENOME_NEXUS_URL: process.env.GENOME_NEXUS_URL
                ? JSON.stringify(
                      cleanAndValidateUrl(process.env.GENOME_NEXUS_URL)
                  )
                : '"replace_me_env_genome_nexus_url"',
        }),
        new HtmlWebpackPlugin({ cache: false, template: 'my-index.ejs' }),
        WebpackFailPlugin,
        new ProgressBarPlugin(),
        new webpack.DllReferencePlugin({
            context: '.',
            manifest: require('./common-dist/common-manifest.json'),
        }),
        new CopyWebpackPlugin([
            { from: './common-dist', to: 'reactapp' },
            { from: './src/rootImages', to: 'images' },
            { from: './src/common', to: 'common' },
            {
                from: './src/globalStyles/prefixed-bootstrap.min.css',
                to: 'reactapp/prefixed-bootstrap.min.css',
            },
            {
                from: './src/shared/lib/data/reference_genome_hg19.json',
                to: 'reactapp/reference_genome_hg19.json',
            },
            {
                from: './src/shared/legacy/igv.min.js',
                to: 'reactapp/igv.min.js',
            },
            { from: './src/shared/legacy/igv.css', to: 'reactapp/igv.css' },
            {
                from: './src/globalStyles/prefixed-bootstrap.min.css.map',
                to: 'reactapp/prefixed-bootstrap.min.css.map',
            },
        ]), // destination is relative to dist directory
        new TypedCssModulesPlugin({
            globPattern: 'src/**/*.module.scss',
        }),
    ],

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                '@babel/preset-env',
                                '@babel/preset-react',
                            ],
                            plugins: ['syntax-dynamic-import'],

                            cacheDirectory: babelCacheFolder,
                        },
                    },
                    {
                        loader: 'ts-loader',
                        options: {
                            transpileOnly:
                                isDev ||
                                isTest ||
                                (process.env.NETLIFY &&
                                    process.env.CONTEXT !== 'production'),
                        },
                    },
                ],
                exclude: /node_modules/,
            },
            {
                test: /\.(js|jsx|babel)$/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                '@babel/preset-env',
                                '@babel/preset-react',
                            ],
                        },
                    },
                ],
                exclude: function(modulePath) {
                    return (
                        /node_modules/.test(modulePath) &&
                        !/igv\.min/.test(modulePath)
                    );
                },
            },
            {
                test: /\.otf(\?\S*)?$/,
                use: [
                    {
                        loader: `url-loader`,
                        options: {
                            name: fontPath,
                            limit: 10000,
                        },
                    },
                ],
            },
            {
                test: /\.eot(\?\S*)?$/,
                use: [
                    {
                        loader: `url-loader`,
                        options: {
                            name: fontPath,
                            limit: 10000,
                        },
                    },
                ],
            },
            {
                test: /\.svg(\?\S*)?$/,
                use: [
                    {
                        loader: `url-loader`,
                        options: {
                            name: fontPath,
                            mimetype: 'image/svg+xml',
                            limit: 10000,
                        },
                    },
                ],
            },
            {
                test: /\.ttf(\?\S*)?$/,
                use: [
                    {
                        loader: `url-loader`,
                        options: {
                            name: fontPath,
                            mimetype: 'application/octet-stream',
                            limit: 10000,
                        },
                    },
                ],
            },
            {
                test: /\.woff2?(\?\S*)?$/,
                use: [
                    {
                        loader: `url-loader`,
                        options: {
                            name: fontPath,
                            mimetype: 'application/font-woff',
                            limit: 10000,
                        },
                    },
                ],
            },
            {
                test: /\.(jpe?g|png|gif)$/,
                use: [
                    {
                        loader: `url-loader`,
                        options: {
                            name: imgPath,
                            limit: 10000,
                        },
                    },
                ],
            },
            {
                test: /\.swf$/,
                use: [
                    {
                        loader: `file-loader`,
                        options: {
                            name: imgPath,
                        },
                    },
                ],
            },
            {
                test: /\.pdf$/,
                use: [
                    {
                        loader: `url-loader`,
                        options: {
                            name: imgPath,
                            limit: 1,
                        },
                    },
                ],
            },
            {
                test: /lodash/,
                use: [{ loader: 'imports-loader?define=>false' }],
            },
            {
                test: /\.js$/,
                enforce: 'pre',
                use: [
                    {
                        loader: 'source-map-loader',
                    },
                ],
                exclude: [/igv\.min/, /node_modules\/svg2pdf.js\//],
            },

            {
                test: require.resolve('3dmol'),
                // 3Dmol expects "this" to be the global context
                use: 'imports-loader?this=>window',
            },
        ],

        noParse: [/3Dmol-nojquery.js/, /jspdf/],
    },
    devServer: {
        contentBase: './dist',
        hot: true,
        historyApiFallback: true,
        noInfo: false,
        quiet: false,
        lazy: false,
        publicPath: '/',
        https: false,
        host: 'localhost',
        headers: { 'Access-Control-Allow-Origin': '*' },
        stats: 'errors-only',
        disableHostCheck: true,
    },
};

// ENV variables
const dotEnvVars = dotenv.config();
const environmentEnv = dotenv.config({
    path: join(root, 'config', `${NODE_ENV}.config.js`),
    silent: true,
});
const envVariables = Object.assign({}, dotEnvVars, environmentEnv);

const defines = Object.keys(envVariables).reduce(
    (memo, key) => {
        const val = JSON.stringify(envVariables[key]);
        memo[`__${key.toUpperCase()}__`] = val;
        return memo;
    },
    {
        __NODE_ENV__: JSON.stringify(NODE_ENV),
        __DEBUG__: isDev,
    }
);

config.plugins = [
    new webpack.DefinePlugin(defines),
    new MiniCssExtractPlugin({
        filename: 'reactapp/styles.css',
        allChunks: true,
    }),
    new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery',
    }),
].concat(config.plugins);
// END ENV variables

// include jquery when we load boostrap-sass
config.module.rules.push({
    test: /bootstrap-sass[\/\\]assets[\/\\]javascripts[\/\\]/,
    use: [
        {
            loader: 'imports-loader',
            options: {
                jQuery: 'jquery',
            },
        },
    ],
});

if (isDev) {
    //add for testwriter
    // config.module.rules.push(
    //     {
    //         test: /\.ts|tsx/,
    //         use:[{loader: 'testwriter'}]
    //     }
    // );
    // config.entry.push(`${path.join(src, 'testWriter.js')}`);

    config.plugins.push(new webpack.HotModuleReplacementPlugin());
}

if (isDev || isTest) {
    config.devtool = sourceMap;

    // in dev we don't want to load the twitter widget b/c it can block load of site
    config.resolve.alias['react-twitter-widgets'] = join(
        src,
        'shared/Empty.tsx'
    );

    config.plugins.push(new ForkTsCheckerWebpackPlugin());

    // css modules for any scss matching test
    config.module.rules.push({
        test: /\.module\.scss$/,
        use: [
            'style-loader',
            {
                loader: 'css-loader',
                options: {
                    modules: true,
                    importLoaders: 2,
                    localIdentName: '[name]__[local]__[hash:base64:5]',
                },
            },
            'sass-loader',
            sassResourcesLoader,
        ],
    });

    // IN DEV WE WANT TO LOAD CSS AND SCSS BUT NOT USE EXTRACT TEXT PLUGIN
    // STYLES WILL BE IN JS BUNDLE AND APPENDED TO DOM IN <STYLE> TAGS

    config.module.rules.push({
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
    });

    config.module.rules.push({
        test: /\.scss$/,
        exclude: /\.module\.scss/,
        use: ['style-loader', 'css-loader', 'sass-loader', sassResourcesLoader],
    });

    config.devServer.port = devPort;
    //config.devServer.hostname = devHost;

    // force hot module reloader to hit absolute path so it can load
    // from dev server
    config.output.publicPath = '//localhost:3000/';
} else {
    (config.devtool = sourceMap), (config.output.publicPath = '/');

    // css modules for any scss matching test
    config.module.rules.push({
        test: /\.module\.scss$/,
        use: [
            {
                loader: MiniCssExtractPlugin.loader,
                options: {
                    fallback: 'style-loader',
                },
            },
            {
                loader: 'css-loader',
                options: {
                    modules: true,
                    localIdentName: '[name]__[local]__[hash:base64:5]',
                },
            },
            'sass-loader',
            sassResourcesLoader,
        ],
    });

    config.module.rules.push({
        test: /\.scss$/,
        exclude: /\.module\.scss/,
        use: [
            {
                loader: MiniCssExtractPlugin.loader,
                options: {
                    fallback: 'style-loader',
                },
            },
            'css-loader',
            'sass-loader',
            sassResourcesLoader,
        ],
    });

    config.module.rules.push({
        test: /\.css/,
        use: [
            {
                loader: MiniCssExtractPlugin.loader,
                options: {
                    fallback: 'style-loader',
                },
            },
            'css-loader',
        ],
    });
}

// reduce logging to optize netlify build
if (process.env.BUILD_REPORT_ERRORS_ONLY === 'true') {
    config.stats = 'errors-only';
}

//config.entry.push('bootstrap-loader');
// END BOOTSTRAP LOADER

// Roots
config.resolve.modules = [src, common, modules];

// end Roots

// Testing
if (isTest) {
    config.externals = {
        'react/addons': true,
        'react/lib/ReactContext': true,
        'react/lib/ExecutionEnvironment': true,
    };

    config.module.noParse = /[/\\]sinon\.js/;
    config.resolve.alias.sinon = 'sinon/pkg/sinon';
}
// End Testing

module.exports = config;
