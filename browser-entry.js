import BaseReporter from './lib/reporters/BaseReporter.js';
import { reporters } from './lib/reporters/index.js';
import { setup, run, resetOptions } from './lib/builder.js';

globalThis.rebenchmark = {
    setup,
    run,
    resetOptions,
    BaseReporter,
    reporters
};

const scriptOpts = {
    platform: true,
    reporter: 'html',
    reporterOptions: 'root=#rebenchmark,results=table',
    ...document?.currentScript?.dataset,
    autoRun: true
};

if (!scriptOpts.noAutoSetup) {
    setup(scriptOpts);
}
