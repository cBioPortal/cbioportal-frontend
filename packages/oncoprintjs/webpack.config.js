const path = require('path');
const WebpackShellPlugin = require('webpack-shell-plugin');

module.exports = {
    entry: path.resolve(__dirname, 'src/js/oncoprint.js'),
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'oncoprint.bundle.js',
        library: 'oncoprintjs',
        libraryTarget: 'commonjs-module'
    },
    plugins: [
        new WebpackShellPlugin({onBuildStart:['mkdir -p '+path.resolve(__dirname, 'dist'), 'rm -rf '+path.resolve(__dirname, 'dist'), 'mkdir '+path.resolve(__dirname, 'dist')]})
    ]
};
