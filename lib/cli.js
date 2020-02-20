import map from 'lodash/map';
import flatten from 'lodash/flatten';
import extend from 'lodash/extend';
import yargs from 'yargs';
import glob from 'glob-promise';
import runner from './runner';

process.on('uncaughtException', (err) => {
    return console.error(err.message);
});

const args = yargs.options({
    r: { alias: 'recursive', default: false, boolean: true },
    f: {
        alias: 'filter',
        choices: ['fastest', 'slowest', 'successful'],
        desc: 'Report filtered (e.g. fastest) benchmark after suite runs'
    },
    d: {
        alias: 'delay',
        number: true,
        desc: 'The delay between test cycles (secs)'
    },
    x: {
        alias: 'maxTime',
        number: true,
        desc: 'The maximum time a benchmark is allowed to run before finishing (secs)'
    },
    s: {
        alias: 'minSamples',
        number: true,
        desc: 'The minimum sample size required to perform statistical analysis'
    },
    n: {
        alias: 'minTime',
        number: true,
        desc: 'The time needed to reduce the percent uncertainty of measurement to 1% (secs)'
    },
    g: {
        alias: 'grep',
        string: true,
        desc: 'Run only tests matching <pattern>'
    },
    R: {
        alias: 'reporter',
        string: true,
        default: 'console',
        desc: 'Specify which reporter to use'
    },
    p: {
        alias: 'platform',
        boolean: true,
        desc: 'Print platform information'
    },
    t: {
        alias: 'test',
        boolean: true,
        desc: 'Do a dry run without executing benchmarks'
    },
    j: {
        alias: 'JSON',
        boolean: true,
        desc: 'emit results in JSON format'
    }
})
    .help()
    .argv;

// compile grep pattern
args.grep = args.grep ? new RegExp(args.grep) : undefined;

// glob files
const files = args._.length ? args._ : ['benches'];
const pattern = (args.recursive ? '**/' : '') + '*.js';

Promise
    .all(map(files, f => glob(pattern, { cwd: f, absolute: true })))
    .then(flatten)
    .then(list => runner(extend(args, { files: list })))
    .catch(console.error);
