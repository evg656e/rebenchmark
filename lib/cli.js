import yargs from 'yargs';
import glob from 'glob-promise';
import { run } from './runner';
import { coerceGrep } from './util/coerceGrep';
import { isNonEmptyString } from './util/isNonEmptyString';

process.on('uncaughtException', (err) => {
    return console.error(err.message);
});

const args = yargs.options({
    // File handling & Test filtering
    include: {
        alias: 'i',
        array: true,
        desc: 'File pattern(s) to include'
    },
    exclude: {
        alias: 'x',
        array: true,
        desc: 'File patterns(s) to exclude'
    },
    grep: {
        alias: 'g',
        array: true,
        desc: 'Run only tests matching pattern(s)'
    },
    dry: {
        alias: 'd',
        boolean: true,
        desc: 'Do a dry run without executing benchmarks'
    },
    // Reporting & Output
    reporter: {
        alias: 'R',
        string: true,
        default: 'console',
        desc: 'Specify which reporter to use'
    },
    'reporter-option': {
        array: true,
        alias: ['reporter-options', 'O'],
        description: 'Reporter-specific options (<k1=v1,[k2=v2,..]>)',
        requiresArg: true
    },
    platform: {
        alias: 'p',
        boolean: true,
        desc: 'Print platform information'
    },
    filter: {
        alias: 'f',
        choices: ['fastest', 'slowest', 'successful'],
        desc: 'Report filtered (e.g. fastest) benchmark after suite runs'
    },
    // Benchmark options
    delay: {
        number: true,
        desc: 'The delay between test cycles (secs)'
    },
    'init-count': {
        number: true,
        desc: 'The default number of times to execute a test on a benchmark’s first cycle'
    },
    'max-time': {
        number: true,
        desc: 'The maximum time a benchmark is allowed to run before finishing (secs)'
    },
    'min-samples': {
        number: true,
        desc: 'The minimum sample size required to perform statistical analysis'
    },
    'min-time': {
        number: true,
        desc: 'The time needed to reduce the percent uncertainty of measurement to 1% (secs)'
    }
})
    .usage('$0 [options] <benchmarks...>')
    .config()
    .alias('config', 'c')
    .help()
    .alias('help', 'h')
    .version()
    .alias('version', 'v')
    .argv;

args.benchmarks = isNonEmptyString(args.benchmarks) ? [args.benchmarks] :
    !Array.isArray(args.benchmarks) ? [] : args.benchmarks;

const benchmarks = args._.length !== 0 ? args._ :
    args.benchmarks.length !== 0 ? args.benchmarks : ['benchmarks/*.js'];

const include = coerceGrep(args.include, true);
const exclude = coerceGrep(args.exclude, false);

Promise
    .all(benchmarks.map(pattern => glob(pattern, { absolute: true })))
    .then(files => run({
        ...args,
        files: files.flat().filter(file => include(file) && !exclude(file))
    }))
    .catch(console.error);
