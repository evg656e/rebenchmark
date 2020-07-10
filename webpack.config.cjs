const path = require('path');

const extendProps = ({ legacy, ...props }) => ({
    suffix: legacy ? '-legacy' : '',
    targets: legacy ? [
        'last 2 versions',
        '> 0.5%',
        'not dead'
    ] : [
            'last 2 chrome versions',
            'last 2 firefox versions',
            'last 1 safari version'
        ],
    ...props
});

const output = ({ minimize, suffix }) => ({
    path: path.resolve(__dirname, 'stage/browser'),
    filename: minimize ? `[name]${suffix}.min.js` : `[name]${suffix}.js`,
    libraryTarget: 'var',
});

const sharedConfig = ({ minimize }) => ({
    devtool: false,
    optimization: {
        minimize
    }
});

const rules = ({ targets }, presetOptions) => ({
    test: /\.js$/,
    loader: 'babel-loader',
    options: {
        presets: [
            [
                '@babel/env',
                {
                    targets,
                    ...presetOptions
                }
            ]
        ],
        plugins: [
            '@babel/plugin-proposal-nullish-coalescing-operator',
            '@babel/plugin-proposal-optional-chaining'
        ]
    }
});

const rebenchmarkConfig = (props) => {
    props = extendProps(props);
    return {
        entry: { rebenchmark: './module/browser/entry.js' },
        output: output(props),
        externals: {
            lodash: '_',
            ...Object.fromEntries(['isRegExp', 'pick', 'forOwn'].map(mod => [`lodash/${mod}`, ['_', mod]])),
            benchmark: 'Benchmark',
            platform: 'platform'
        },
        module: {
            rules: [{
                ...rules(props, {
                    useBuiltIns: 'usage',
                    shippedProposals: true,
                    corejs: { version: 3 }
                }),
                exclude(module) {
                    return /node_modules/.test(module) &&
                        !/styled-cli-table/.test(module);
                }
            }]
        },
        ...sharedConfig(props)
    }
};

const rebenchmarkAutosetupConfig = (props) => {
    props = extendProps(props);
    return {
        entry: { 'rebenchmark-autosetup': './module/browser/autosetup.js' },
        output: output(props),
        module: {
            rules: [rules(props)]
        },
        ...sharedConfig(props)
    }
};

const generateVariants = (config) => [
    config({ legacy: false, minimize: false }),
    config({ legacy: true, minimize: false }),
    config({ legacy: false, minimize: true }),
    config({ legacy: true, minimize: true }),
];

module.exports = [
    ...generateVariants(rebenchmarkConfig),
    ...generateVariants(rebenchmarkAutosetupConfig)
];
