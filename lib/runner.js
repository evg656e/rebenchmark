import { parse } from 'path';
import { pathToFileURL } from 'url';
import { setup } from './builder';
import { createReporter, coerceReporterOptions } from './reporters/index';

function isName(nameOrUrl) {
    try {
        return parse(nameOrUrl).name === nameOrUrl;
    }
    catch (e) {
        return false;
    }
}

function loadReporter(nameOrUrl, reporterOptions) {
    reporterOptions = coerceReporterOptions(reporterOptions)
    return isName(nameOrUrl) ?
        Promise.resolve(createReporter(nameOrUrl, reporterOptions)) :
        import(nameOrUrl).then(({ default: ReporterClass }) => new ReporterClass(reporterOptions));
}

export function run(opts) {
    return new Promise((resolve, reject) => {
        loadReporter(opts.reporter, opts.reporterOptions).then(reporter => {
            opts.reporter = reporter;

            const builder = setup({ ...opts, autoRun: true });

            const files = opts.files;

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
};
