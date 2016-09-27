var ExtractTextPlugin = require("extract-text-webpack-plugin");

var HtmlWebpackPlugin = require('html-webpack-plugin');

var jsonFN = require("json-fn");

const NODE_ENV = process.env.NODE_ENV || 'development';
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

const setPublicPath = process.env.SET_PUBLIC_PATH !== 'false';
const publicPath = (isDev && setPublicPath) ? `//${devHost}:${devPort}/` : '';

const root = resolve(__dirname);
const src = join(root, 'src');
const modules = join(root, 'node_modules');
const dest = join(root, 'dist');
const css = join(src, 'styles');


var config = {

    "entry": [
        "./src/app.js"
    ],
    "output": {
        "path": "./dist/",
        "filename": "app.js",
        "cssFilename": "app.css",
        "hash": false,
        "publicPath": "/"
    },
    "resolve": {
        "extensions": [
            "",
            ".js",
            ".jsx",
            ".json"
        ]
    },

    plugins: [
        new HtmlWebpackPlugin({cache: false, template: 'my-index.ejs'}),
        new webpack.optimize.DedupePlugin()
    ],

    "module": {
        "loaders": [
            {
                test: /\.(js|jsx|babel)$/,
                exclude: /node_modules/,
                loader: 'babel-loader'
            },
            {
                test: /\.json$/,
                loaders: ['json']
            },
            {
                test: /\.otf(\?\S*)?$/,
                loader: 'url-loader?limit=10000'
            },
            {
                test: /\.eot(\?\S*)?$/,
                loader: 'url-loader?limit=10000',
            },
            {
                test: /\.svg(\?\S*)?$/,
                loader: 'url-loader?mimetype=image/svg+xml&limit=10000'
            },
            {
                test: /\.ttf(\?\S*)?$/,
                loader: 'url-loader?mimetype=application/octet-stream&limit=10000'
            },
            {
                test: /\.woff2?(\?\S*)?$/,
                loader: 'url-loader?mimetype=application/font-woff&limit=10000'
            },
            {
                test: /\.(jpe?g|png|gif)$/,
                loader: 'url-loader?limit=10000'
            },
            {
                test: /\.swf$/,
                loader: 'file-loader'
            }
        ]
    },
    "postcss": [require('autoprefixer')],
    "devtool": "cheap-module-eval-source-map",
    "devServer": {
        "historyApiFallback": false,
        "hot": false,
        "noInfo": false,
        "quiet": false,
        "lazy": false,
        "publicPath": "/",
        "contentBase": "dist",
        "https": false,
        "hostname": "localhost"
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
    new ExtractTextPlugin("styles.css")
].concat(config.plugins);
// END ENV variables


// for font-awesome;
const fontAwesomeLoaders = [
    {test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "url-loader?limit=10000&minetype=application/font-woff"},
    {test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "file-loader"}
];

config.module.loaders.push.apply(this, fontAwesomeLoaders);

config.module.loaders.push(
    {
        test: /bootstrap-sass[\/\\]assets[\/\\]javascripts[\/\\]/,
        loader: 'imports?jQuery=jquery'
    }
);

// if we want css modules
config.module.loaders.push(
    {
        test: /module\.scss$/,
        loaders: [
            'style',
            'css?modules&importLoaders=2&localIdentName=[name]__[local]__[hash:base64:5]' +
            '!sass' +
            '!sass-resources'
        ]
    }

);

if (isDev) {

    // IN DEV WE WANT TO LOAD CSS AND SCSS BUT NOT USE EXTRACT TEXT PLUGIN
    // STYLES WILL BE IN JS BUNDLE AND APPENDED TO DOM IN <STYLE> TAGS

    config.module.loaders.push({test: /\.css$/, loader: "style-loader!css-loader"});

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


} else {

    config.module.loaders.push(
        {
            "test": /\.css$|.scss$/,
            "exclude":/\.module\.scss/,
            "loader": ExtractTextPlugin.extract(
                'style',
                'css?' +
                '!sass' +
                '!sass-resources'
            )

        }
    );

    config.plugins.push(
        new webpack.DefinePlugin({
            'process.env':{
                'NODE_ENV': JSON.stringify('production')
            }
        }),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            },
            sourceMap:false,
            comments:false
        })
    );





}


config.sassResources = './sass-resources.scss';


config.entry.push('bootstrap-loader');
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
    features: join(src, 'features'),
    shared: join(src,'shared')
};
// end Roots

// Dev
if (isDev) {
    config.devServer.port = devPort;
    config.devServer.hostname = devHost;

    // force hot module reloader to hit absolute path so it can load
    // from dev server
    config.output.publicPath = "http://localhost:3000/";
}

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
            'DedupePlugin',
            'UglifyJsPlugin'
        ].indexOf(fnName[1]);
        return idx < 0;
    });
}
// End Testing


config.devtool = "inline-source-map";

module.exports = config;
