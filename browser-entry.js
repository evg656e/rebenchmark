import BaseReporter from './lib/reporters/BaseReporter';
import { reporters } from './lib/reporters/index';
import { setup, run, resetOptions } from './lib/builder';

globalThis.rebenchmark = {
    setup,
    run,
    resetOptions,
    BaseReporter,
    reporters
};

const scriptOpts = {
    reporter: new reporters.HTMLReporter({ root: '#rebenchmark' }),
    ...document && document.currentScript && document.currentScript.dataset,
    autoRun: true
};
!scriptOpts.noAutoSetup && setup(scriptOpts);
