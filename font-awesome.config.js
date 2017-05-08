module.exports = {
    styles:{
        "mixins": true,
        "core": true,
        "icons": true,
        "path": true

    },
    styleLoader: require('extract-text-webpack-plugin').extract('style-loader', 'css-loader!sass-loader')
};