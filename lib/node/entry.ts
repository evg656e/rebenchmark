import { parse } from 'path';
import { pathToFileURL } from 'url';
import yargs from 'yargs';
import glob from 'glob-promise';
import { setup, run, stats, RawGlobalOptions } from '../core/builder';
import { createReporter, coerceReporterOptions, RawReporterOptions } from '../core/reporters/index';
import { coerceInclude, coerceExclude } from '../core/util/grep';
import { isNonEmptyString } from '../core/util/traits/isNonEmptyString';
import type BaseReporter from '../core/reporters/BaseReporter';
import type { Constructor } from '../core/util/Constructor';

process.on('uncaughtException', (err) => {
    console.error(err.message);
});

(({ _, benchmarks, include, exclude, ...opts }) => {
    const normalizedBenchmarks = normalizeBenchmarks(_, benchmarks);
    const normalizedInclude = coerceInclude(include);
    const normalizedExclude = coerceExclude(exclude);

    Promise
        .all(normalizedBenchmarks.map(pattern => glob(pattern, { absolute: true })))
        .then(files => loadFiles({
            ...opts,
            files: files.flat().filter(file => normalizedInclude(file) && !normalizedExclude(file))
        }))
        .then(() => run())
        .catch((err) => {
            console.error(err);
        });
})(
    yargs.options({
        // File handling & Test filtering
        include: {
            alias: 'i',
            array: true,
            string: true,
            desc: 'File pattern(s) to include',
            requiresArg: true
        },
        exclude: {
            alias: 'x',
            array: true,
            string: true,
            desc: 'File pattern(s) to exclude',
            requiresArg: true
        },
        grep: {
            alias: 'g',
            array: true,
            string: true,
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
        reporterOptions: {
            array: true,
            string: true,
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
        initCount: {
            number: true,
            desc: 'The default number of times to execute a test on a benchmark’s first cycle',
            requiresArg: true
        },
        maxTime: {
            number: true,
            desc: 'The maximum time a benchmark is allowed to run before finishing (secs)',
            requiresArg: true
        },
        minSamples: {
            number: true,
            desc: 'The minimum sample size required to perform statistical analysis',
            requiresArg: true
        },
        minTime: {
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

function normalizeBenchmarks(_: string[], benchmarks: unknown) {
    const benchmarksArray: string[] = isNonEmptyString(benchmarks) ? [benchmarks] :
        !Array.isArray(benchmarks) ? [] : benchmarks;
    return _.length !== 0 ? _ :
        benchmarksArray.length !== 0 ? benchmarksArray : ['benchmarks/*.js'];
}

function loadFiles({ reporter, reporterOptions, files, ...opts }: RawGlobalOptions & { reporter: string, files: string[] }) {
    return new Promise((resolve, reject) => {
        if (files.length === 0) {
            return reject(new Error('No files found for specified options.'));
        }
        loadReporter(reporter, reporterOptions).then((reporter: BaseReporter) => {
            setup({
                ...opts,
                reporter
            });

            function next() {
                const file = files.shift();
                if (file !== undefined) {
                    const oldCount = stats().count;
                    loadFile(file).then(() => {
                        process.nextTick(next);
                        const newCount = stats().count;
                        if (oldCount === newCount) {
                            console.warn(`No benchmarks found on file: '${file}'`);
                        }
                    }).catch(reject);
                } else {
                    resolve();
                }
            }

            next();
        }).catch(reject);
    });
}

function loadFile(file: string) {
    if (typeof require === 'function') {
        return Promise.resolve(require(file));
    }
    return import(String(pathToFileURL(file)));
}

function loadReporter(nameOrUrl: string, reporterOptions?: RawReporterOptions) {
    reporterOptions = coerceReporterOptions(reporterOptions);
    return isName(nameOrUrl) ?
        Promise.resolve(createReporter(nameOrUrl, reporterOptions)) :
        import(nameOrUrl).then(({ default: ReporterClass }: { default: Constructor<BaseReporter> }) => new ReporterClass(reporterOptions));
}

function isName(nameOrUrl: string) {
    try {
        return parse(nameOrUrl).name === nameOrUrl;
    }
    catch (e) {
        return false;
    }
}
