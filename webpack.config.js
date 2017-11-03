var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var WebpackFailPlugin = require('webpack-fail-plugin');
var ProgressBarPlugin = require('progress-bar-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');

var commit = '"unknown"';
var version = '"unknown"';
// Don't show COMMIT/VERSION on Heroku (crashes, because no git dir)
if (process.env.PATH.indexOf('heroku') === -1) {
    // show full git version
    var GitRevisionPlugin = require('git-revision-webpack-plugin');
    var gitRevisionPlugin = new GitRevisionPlugin({
        versionCommand: 'describe --always --tags --dirty'
    });
    commit = JSON.stringify(gitRevisionPlugin.commithash())
    version = JSON.stringify(gitRevisionPlugin.version())
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
const dest = join(root, 'dist');
const css = join(src, 'styles');

const fontPath = 'reactapp/[hash].[ext]';
const imgPath = 'reactapp/images/[hash].[ext]';

var routeComponentRegex = /routes\/([^\/]+\/?[^\/]+).js$/;

var config = {

    'entry': [
        `babel-polyfill`,
        `${path.join(src, 'appBootstrapper.jsx')}`
    ],
    'output': {
        path: './dist/',
        filename: 'reactapp/[name].app.js',
        chunkFilename: 'reactapp/[name].[chunkhash].chunk.js',
        cssFilename: 'reactapp/app.css',
        hash: false,
        publicPath: '/',
    },

    'resolve': {
        'extensions': [
            '',
            '.js',
            '.jsx',
            '.json',
            '.ts',
            '.tsx',
        ]
    },



    plugins: [
        new webpack.DefinePlugin({
            'VERSION': version,
            'COMMIT': commit,
        }),
        new HtmlWebpackPlugin({cache: false, template: 'my-index.ejs'}),
        new webpack.optimize.DedupePlugin(),
        WebpackFailPlugin,
        new ProgressBarPlugin(),
        new webpack.DllReferencePlugin({
            context: '.',
            manifest: require('./common-dist/common-manifest.json')
        }),
        new CopyWebpackPlugin([
            { from: './common-dist', to: 'reactapp' },
            { from: './src/globalStyles/prefixed-bootstrap.min.css', to:'reactapp/prefixed-bootstrap.min.css' },
            { from: './src/globalStyles/prefixed-bootstrap.min.css.map', to:'reactapp/prefixed-bootstrap.min.css.map' }
        ]) // destination is relative to dist directory
    ],

    'module': {
        'loaders': [
            {
                test: /\.tsx?$/,
                loaders: [
                    "babel-loader",
                    "ts-loader"
                ]
            },
            {
                test: /\.(js|jsx|babel)$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
            },
            {
                test: /\.json$/,
                loaders: ['json'],
            },
            {
                test: /\.otf(\?\S*)?$/,
                loader: `url-loader?name=${fontPath}&limit=10000`,
            },
            {
                test: /\.eot(\?\S*)?$/,
                loader: `url-loader?name=${fontPath}&limit=10000`,
            },
            {
                test: /\.svg(\?\S*)?$/,
                loader: `url-loader?name=${fontPath}&mimetype=image/svg+xml&limit=10000`,
            },
            {
                test: /\.ttf(\?\S*)?$/,
                loader: `url-loader?name=${fontPath}&mimetype=application/octet-stream&limit=10000`,
            },
            {
                test: /\.woff2?(\?\S*)?$/,
                loader: `url-loader?name=${fontPath}&mimetype=application/font-woff&limit=10000`,
            },
            {
                test: /\.(jpe?g|png|gif)$/,
                loader: `url-loader?name=${imgPath}&limit=10000`,
            },
            {
                test: /\.swf$/,
                loader: `file-loader?name=${imgPath}`,
            },
            {
                test: /\.pdf$/,
                loader: `url-loader?name=${imgPath}&limit=1`,
            },
            { test: /lodash/, loader: 'imports?define=>false'}


        ],

        noParse:[/3Dmol-nojquery/,/jspdf/],

        preLoaders: [
            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            {
                test: /\.js$/,
                loader: "source-map-loader"
            }
        ]
    },
    'postcss': [require('autoprefixer')],
    'devServer': {
        'historyApiFallback': false,
        'hot': false,
        'noInfo': false,
        'quiet': false,
        'lazy': false,
        'publicPath': '/',
        'contentBase': 'dist',
        'https': false,
        'hostname': 'localhost',
        'headers': {"Access-Control-Allow-Origin": "*"},
        'stats':'errors-only'
    }


};

// ENV variables
const dotEnvVars = dotenv.config();
const environmentEnv = dotenv.config({
    path: join(root, 'config', `${NODE_ENV}.config.js`),
    silent: true
});
const envVariables =
    Object.assign({}, dotEnvVars, environmentEnv);

const defines =
    Object.keys(envVariables)
        .reduce((memo, key) => {
            const val = JSON.stringify(envVariables[key]);
            memo[`__${key.toUpperCase()}__`] = val;
            return memo;
        }, {
            __NODE_ENV__: JSON.stringify(NODE_ENV),
            __DEBUG__: isDev
        });

config.plugins = [
    new webpack.DefinePlugin(defines),
    new ExtractTextPlugin('reactapp/styles.css',{ allChunks:true }),
    new webpack.ProvidePlugin({
        $: "jquery",
        jQuery: "jquery"
    })
].concat(config.plugins);
// END ENV variables

config.module.loaders.push.apply(this);

// include jquery when we load boostrap-sass
config.module.loaders.push(
    {
        test: /bootstrap-sass[\/\\]assets[\/\\]javascripts[\/\\]/,
        loader: 'imports?jQuery=jquery'
    }
);


if (isDev || isTest) {

    config.devtool = 'source-map';


    // css modules for any scss matching test
    config.module.loaders.push(
        {
            test: /\.module\.scss$/,
            loaders: [
                'style',
                'css?modules&importLoaders=2&localIdentName=[name]__[local]__[hash:base64:5]' +
                '!sass' +
                '!sass-resources'
            ]
        }
    );

    // IN DEV WE WANT TO LOAD CSS AND SCSS BUT NOT USE EXTRACT TEXT PLUGIN
    // STYLES WILL BE IN JS BUNDLE AND APPENDED TO DOM IN <STYLE> TAGS

    config.module.loaders.push({test: /\.css$/, loader: 'style-loader!css-loader'});

    config.module.loaders.push(
        {
            test: /\.scss$/,
            exclude:/\.module\.scss/,
            loaders: [
                'style',
                'css?' +
                '!sass' +
                '!sass-resources'
            ]
        }
    );

    config.devServer.port = devPort;
    config.devServer.hostname = devHost;

    // force hot module reloader to hit absolute path so it can load
    // from dev server
    config.output.publicPath = '//localhost:3000/';

    // Get rid of Dedupe for non-production environments - it messes with scss with duplicate names
    config.plugins = config.plugins.filter(p => {
        const name = p.constructor.toString();
        const fnName = name.match(/^function (.*)\((.*\))/);

        const idx = [
            'DedupePlugin',
        ].indexOf(fnName[1]);
        return idx < 0;
    });

    // Get rid of Dedupe for non-production environments - it messes with scss with duplicate names
    config.plugins = config.plugins.filter(p => {
        const name = p.constructor.toString();
        const fnName = name.match(/^function (.*)\((.*\))/);

        const idx = [
            'DedupePlugin',
        ].indexOf(fnName[1]);
        return idx < 0;
    });

} else {


    config.devtool = 'cheap-module-source-map',
    config.output.publicPath = '';

    // css modules for any scss matching test
    config.module.loaders.push(
        {
            test: /\.module\.scss$/,
            loader: ExtractTextPlugin.extract(
                'style',
                'css?modules&importLoaders=2&localIdentName=[name]__[local]__[hash:base64:5]' +
                '!sass' +
                '!sass-resources'
            )
        }
    );

    config.module.loaders.push(
        {
            'test': /\.scss$/,
            'exclude':/\.module\.scss/,
            'loader': ExtractTextPlugin.extract(
                'style',
                'css?' +
                '!sass' +
                '!sass-resources'
            )

        }
    );

    config.module.loaders.push(
        {
            'test': /\.css/,
            'loader': ExtractTextPlugin.extract(
                'style',
                'css?'
            )

        }
    );

    config.plugins.push(
        new webpack.DefinePlugin({
            'process.env':{
                'NODE_ENV': `"${process.env.NODE_ENV || 'production'}"`
            }
        }),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            },
            sourceMap:true,
            comments:false
        })
    );

}


config.sassResources = './sass-resources.scss';


//config.entry.push('bootstrap-loader');
// END BOOTSTRAP LOADER

config.entry.push('font-awesome-webpack');

// Roots
config.resolve.root = [src, modules];
config.resolve.alias = {
    css: join(src, 'styles'),
    containers: join(src, 'containers'),
    components: join(src, 'components'),
    utils: join(src, 'utils'),
    styles: join(src, 'styles'),
    reducers: join(src, 'redux/modules'),
    pages: join(src, 'pages'),
    shared: join(src,'shared'),
    appConfig: path.join(__dirname + '/src', 'config', process.env.NODE_ENV + '.config')
};
// end Roots

// Testing
if (isTest) {
    config.externals = {
        'react/addons': true,
        'react/lib/ReactContext': true,
        'react/lib/ExecutionEnvironment': true
    };

    config.module.noParse = /[/\\]sinon\.js/;
    config.resolve.alias.sinon = 'sinon/pkg/sinon';

    config.plugins = config.plugins.filter(p => {
        const name = p.constructor.toString();
        const fnName = name.match(/^function (.*)\((.*\))/);

        const idx = [
            'ExtractTextPlugin',
            'DedupePlugin',
            'UglifyJsPlugin'
        ].indexOf(fnName[1]);
        return idx < 0;
    });

    config.devTool = 'cheap-module-eval-source-map';

}
// End Testing

module.exports = config;
