var ComponentsScanner = require('../../es5/ComponentsScanner').ComponentsScanner;
var TrimSpacesOptimizer = require('../../es5/Template/optimizer/TrimSpacesOptimizer').TrimSpacesOptimizer;
var StylesOptimizer = require('../../es5/Template/optimizer/StylesOptimizer').StylesOptimizer;
var ExtractTextWebpackPlugin = require('extract-text-webpack-plugin');
var Webpack = require('webpack');

var DEBUG = process.env.NODE_ENV !== 'production';

var className = DEBUG ? '[name]__[local]___[hash:base64:5]' : '[hash:base64:4]&minimize';

var config = {
    debug: DEBUG,
    entry: {
        index: __dirname + '/../../example/index.js'
    },
    output: {
        path: __dirname + '/../../dist',
        filename: 'bundle.js'
    },
    module: {
        loaders: [
            {test: /.js$/, loader: 'babel', query: {cacheDirectory: true, ignore: ['node_modules', 'es5']}},
            {test: /.peg$/, loader: 'peg'},
            {test: /.hbs$/, loader: require.resolve('../../es5/Template/loader')},
            {test: /.css$/, loader: ExtractTextWebpackPlugin.extract('css?modules&importLoaders=1&localIdentName=' + className)} // + '!postcss'
        ]
    },
    devtool: DEBUG ? 'inline-source-map' : false,

    plugins: [
        new ComponentsScanner([
            __dirname + '/../../example/components/**/*.js'
        ], {
            optimize: {
                plugins: [
                    new TrimSpacesOptimizer(),
                    new StylesOptimizer()
                ]
            }
        }),
        new ExtractTextWebpackPlugin('styles.css')
    ]
};

if (!DEBUG) {
    config.plugins.push(new Webpack.optimize.OccurenceOrderPlugin());
    config.plugins.push(new Webpack.optimize.UglifyJsPlugin({
        sourceMap: false,
        mangle: true,
        compress: {
            warnings: false
        }
    }))
}

module.exports = config;