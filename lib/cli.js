import { parse } from 'path';
import { pathToFileURL } from 'url';
import yargs from 'yargs';
import glob from 'glob-promise';
import { setup } from './builder';
import { createReporter, coerceReporterOptions } from './reporters';
import { coerceInclude, coerceExclude } from './util/grep';
import { isNonEmptyString } from './util/isNonEmptyString';

process.on('uncaughtException', (err) => {
    return console.error(err.message);
});

(({ _, benchmarks, include, exclude, ...opts }) => {
    benchmarks = isNonEmptyString(benchmarks) ? [benchmarks] :
        !Array.isArray(benchmarks) ? [] : benchmarks;

    benchmarks = _.length !== 0 ? _ :
        benchmarks.length !== 0 ? benchmarks : ['benchmarks/*.js'];

    include = coerceInclude(include);
    exclude = coerceExclude(exclude);

    Promise
        .all(benchmarks.map(pattern => glob(pattern, { absolute: true })))
        .then(files => run({
            ...opts,
            files: files.flat().filter(file => include(file) && !exclude(file))
        }))
        .catch(console.error);
})(
    yargs.options({
        // File handling & Test filtering
        include: {
            alias: 'i',
            array: true,
            desc: 'File pattern(s) to include',
            requiresArg: true
        },
        exclude: {
            alias: 'x',
            array: true,
            desc: 'File pattern(s) to exclude',
            requiresArg: true
        },
        grep: {
            alias: 'g',
            array: true,
            desc: 'Run only tests matching pattern(s)',
            requiresArg: true
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
        'reporter-options': {
            array: true,
            alias: 'O',
            description: 'Reporter-specific options (<k1=v1[,k2=v2,..]>)',
            requiresArg: true
        },
        platform: {
            alias: 'p',
            boolean: true,
            desc: 'Print platform information'
        },
        // Benchmark options
        delay: {
            number: true,
            desc: 'The delay between test cycles (secs)',
            requiresArg: true
        },
        'init-count': {
            number: true,
            desc: 'The default number of times to execute a test on a benchmark’s first cycle',
            requiresArg: true
        },
        'max-time': {
            number: true,
            desc: 'The maximum time a benchmark is allowed to run before finishing (secs)',
            requiresArg: true
        },
        'min-samples': {
            number: true,
            desc: 'The minimum sample size required to perform statistical analysis',
            requiresArg: true
        },
        'min-time': {
            number: true,
            desc: 'The time needed to reduce the percent uncertainty of measurement to 1% (secs)',
            requiresArg: true
        }
    })
        .usage('$0 [options] <benchmarks..>')
        .config()
        .alias('config', 'c')
        .help()
        .alias('help', 'h')
        .version()
        .alias('version', 'v')
        .argv
);

function run({ reporter, reporterOptions, files, ...opts }) {
    return new Promise((resolve, reject) => {
        loadReporter(reporter, reporterOptions).then(reporter => {
            const builder = setup({
                ...opts,
                reporter,
                autoRun: true
            });

            function next() {
                const f = files.shift();
                if (f) {
                    import(pathToFileURL(f)).catch(reject);
                }
                resolve();
            }

            builder.on('end', () => process.nextTick(() => next()));

            next();
        }).catch(reject);
    });
}

function loadReporter(nameOrUrl, reporterOptions) {
    reporterOptions = coerceReporterOptions(reporterOptions);
    return isName(nameOrUrl) ?
        Promise.resolve(createReporter(nameOrUrl, reporterOptions)) :
        import(nameOrUrl).then(({ default: ReporterClass }) => new ReporterClass(reporterOptions));
}

function isName(nameOrUrl) {
    try {
        return parse(nameOrUrl).name === nameOrUrl;
    }
    catch (e) {
        return false;
    }
}
