const path = require('path');
const yargs = require('yargs');

const { optimizeMinimize } = yargs.alias('p', 'optimize-minimize').argv;

module.exports = {
    entry: {
        rebenchmark: './browser-entry.js'
    },

    output: {
        path: path.resolve(__dirname, 'stage/browser'),
        filename: optimizeMinimize ? '[name].min.js' : '[name].js',
        libraryTarget: 'var',
    },

    externals: {
        lodash: '_',
        ...Object.fromEntries(['isRegExp', 'pick', 'forOwn'].map(mod => [`lodash/${mod}`, ['_', mod]])),
        benchmark: 'Benchmark',
        platform: 'platform'
    },

     devtool: false
};
