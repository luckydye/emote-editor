const PACKAGE = require('./package.json');
const path = require('path');
const webpack = require('webpack');

const banner = PACKAGE.name + ' - ' + PACKAGE.version;

module.exports = {
    mode: "development",
    plugins: [
        new webpack.BannerPlugin(banner),
    ],
    entry: {
        'client': "./src/client.mjs",
    },
    output: {
        globalObject: 'self',
        filename: '[name].min.js',
        path: path.resolve(__dirname, 'public')
    },
    module: {
        rules: [
            {
                test: /\.shadow.css$|\.svg$/,
                use: ['raw-loader']
            },
            {
                test: /\.css$/,
                exclude: /\.shadow.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.ttf$/,
                use: ['file-loader']
            }
        ]
    }
}
