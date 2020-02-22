import BaseReporter from './reporters/BaseReporter';
import { reporters } from './reporters/index';
import { setup, run, resetOptions } from './builder';

globalThis.rebenchmark = {
    setup,
    run,
    resetOptions,
    BaseReporter,
    reporters
};

const scriptOpts = { ...document && document.currentScript && document.currentScript.dataset, autoRun: true };
!scriptOpts.noAutoSetup && setup(scriptOpts);
