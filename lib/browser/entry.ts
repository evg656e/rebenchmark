import * as rebenchmark from './index';

type RebenchmarkGlobals = typeof rebenchmark;

declare global {
    var rebenchmark: RebenchmarkGlobals;
}

globalThis.rebenchmark = rebenchmark;
