const path = require('path');
const yargs = require('yargs');

const { optimizeMinimize } = yargs.alias('p', 'optimize-minimize').argv;

const config = (legacy) => {
    const suffix = legacy ? '-legacy' : '';
    const targets = legacy ? [
        'last 2 versions',
        '> 0.5%',
        'not dead'
    ] : [
        'last 2 chrome versions',
        'last 2 firefox versions',
        'last 1 safari version'
    ];

    return {
        entry: {
            rebenchmark: './browser-entry.js'
        },

        output: {
            path: path.resolve(__dirname, 'stage/browser'),
            filename: optimizeMinimize ? `[name]${suffix}.min.js` : `[name]${suffix}.js`,
            libraryTarget: 'var',
        },

        externals: {
            lodash: '_',
            ...Object.fromEntries(['isRegExp', 'pick', 'forOwn'].map(mod => [`lodash/${mod}`, ['_', mod]])),
            benchmark: 'Benchmark',
            platform: 'platform'
        },

        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude(module) {
                        return /node_modules/.test(module) &&
                            !/styled-cli-table/.test(module);
                    },
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            [
                                '@babel/env',
                                {
                                    targets,
                                    useBuiltIns: 'usage',
                                    shippedProposals: true,
                                    corejs: { version: 3, proposals: true }
                                }
                            ]
                        ]
                    }
                }
            ]
        },

        devtool: false
    }
};

module.exports = [
    config(),
    config(true)
];
