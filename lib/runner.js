import { pathToFileURL } from 'url';
import platform from 'platform';
import builder from './builder';
import loadReporter from './util/loadReporter';

export default (opts) => {
    return new Promise((resolve, reject) => {
        globalOpts = opts;

        loadReporter(opts.reporter || 'console').then(({ default: ReporterClass }) => {
            reporter = new ReporterClass(opts);

            if (opts.platform) {
                reporter.print(platform);
            }

            let files = opts.files;

            function next() {
                const f = files.shift();
                if (f) {
                    return import(pathToFileURL(f)).catch(reject);
                }
                resolve();
            }

            builder.on('end', () => process.nextTick(() => next()));

            next();
        }).catch(reject);
    });
};
