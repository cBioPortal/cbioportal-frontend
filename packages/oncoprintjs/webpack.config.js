const path = require('path');
const WebpackShellPlugin = require('webpack-shell-plugin');

module.exports = env => ({
    entry: path.resolve(__dirname, 'src/js/oncoprint.ts'),
    module: {
        rules: [
            {
                test: /\.(png|jp(e*)g|svg)$/,
                use: [{
                    loader: 'url-loader',
                }]
            },
            {
                test: /src\/js\/workers\/*/,
                use:[{
                    loader: 'worker-loader',
                    options: { inline:true, fallback: false }
                }]
            },
            {
                test: /src\/js\/.+\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    plugins: [
        new WebpackShellPlugin({onBuildStart:['mkdir -p '+path.resolve(__dirname, 'dist')]})
    ],
    resolve: {
        extensions: [ '.tsx', '.ts', '.js' ]
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'oncoprint.bundle.js',
        library: 'oncoprintjs',
        libraryTarget: 'commonjs-module'
    },
    optimization: {
        minimize: (!env || (env.DEV !== "true"))
    }
});
