import BaseReporter from './reporters/BaseReporter';
import HTMLReporter from './reporters/HTMLReporter';
import { reporters } from './reporters/index';
import { setup, run, resetOptions } from './builder';

globalThis.rebenchmark = {
    setup,
    run,
    resetOptions,
    BaseReporter,
    reporters
};

const scriptOpts = {
    reporter: new HTMLReporter({ root: '#rebenchmark-output' }),
    ...document && document.currentScript && document.currentScript.dataset,
    autoRun: true
};
!scriptOpts.noAutoSetup && setup(scriptOpts);
