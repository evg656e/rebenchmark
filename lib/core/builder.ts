import pick from 'lodash/pick';
import { EventEmitter } from 'events';
import platform from 'platform';
import { Suite, SuiteRunOptions, BenchFunctionOptions } from './Suite';
import ConsoleReporter from './reporters/ConsoleReporter';
import { coerceReporter, RawReporter, RawReporterOptions } from './reporters/index';
import { coerceInclude, includeAll, Grep, RawGrep } from './util/grep';
import type Benchmark from 'benchmark';
import type BaseReporter from './reporters/BaseReporter';

interface GlobalOptions extends Benchmark.Options {
    dry?: boolean;
    platform?: boolean;
    grep: Grep;
}

const roots: Suite[] = [];
let rootIndex = 0;
let hasOnlys = false;
let count = 0;
let running: Suite | undefined = undefined;
let current: Suite | undefined = undefined;
let reporter: BaseReporter = new ConsoleReporter();
let globalOptions: GlobalOptions = {
    grep: includeAll
};
const emitter = new EventEmitter();

function reportError(err: { suite: Suite, bench: Benchmark, error: string }, suite?: Suite, bench?: Benchmark & { name: string }): void;
function reportError(err: string, suite?: Suite, bench?: Benchmark & { name: string }): void;
function reportError(err: any, suite?: any, bench?: any) {
    if (err.suite) {
        bench = err.bench;
        suite = err.suite;
        err = err.error;
    }

    const name = (() => {
        const parts = [];
        if (suite) {
            parts.push(suite.path);
        }
        if (bench) {
            parts.push(bench.name);
        }
        return parts.join(':')
    })();

    if (!name.length || globalOptions.grep(name)) {
        if (name.length) {
            console.error(`Error in ${name}`);
        }
        console.error(err);
    }
}

export interface SuiteFunctionOptions {
    only?: boolean;
    skip?: boolean;
}

export function suite(name: string, fn: (...args: any[]) => void, opts: SuiteFunctionOptions = {}) {
    const suite = new Suite(name, {
        parent: current,
        dry: globalOptions.dry,
        reporter,
        only: opts.only
    });

    suite.on('error', reportError)
        .on('start', () => emitter.emit('start', suite))
        .on('end', () => emitter.emit('end', suite));

    current = suite;
    try {
        fn(); // configure this suite
    }
    catch (err) {
        reportError(err, suite);
    }

    if (opts.only) {
        suite.only();
    }
    if (opts.skip) {
        suite.skip();
    }

    current = current.parent;
    count++;

    if (suite.isRoot) {
        roots.push(suite);
        if (suite.isOnly) {
            hasOnlys = true;
        }
    }
}

suite.only = function (name: string, fn: (...args: any[]) => void, opts?: SuiteFunctionOptions) {
    suite(name, fn, { ...opts, only: true });
};

suite.skip = function (name: string, fn: (...args: any[]) => void, opts?: SuiteFunctionOptions) {
    suite(name, fn, { ...opts, skip: true });
};

export type SuiteFunction = typeof suite;

const benchProps = ['maxTime', 'minTime', 'minSamples'];

function checkCurrentSuite(current: Suite | undefined): current is Suite {
    if (current === undefined) {
        throw new Error(`Attempting to use a benchmark function outside the suite`);
    }
    return true;
}

export function bench(name: string, fn: (...args: any[]) => any, opts: BenchFunctionOptions = {}) {
    const benchOpts = pick(globalOptions, benchProps);

    if (checkCurrentSuite(current)) {
        if (globalOptions.grep(`${current.path}:${name}`)) {
            current.add(name, fn, { ...benchOpts, ...opts });
        }
    }
}

bench.only = function (name: string, fn: (...args: any[]) => any, opts?: BenchFunctionOptions) {
    bench(name, fn, { ...opts, only: true });
};

bench.skip = function (name: string, fn: (...args: any[]) => any, opts?: BenchFunctionOptions) {
    bench(name, fn, { ...opts, skip: true });
};

export type BenchFunction = typeof bench;

export { bench as benchmark };

function wrap(fn: (suite: Suite) => void, suite: Suite, bench?: Benchmark) {
    return () => {
        try {
            fn(suite);
        }
        catch (err) {
            suite.emit('error', err, suite, bench);
        }
    };
}

export type HookFunction = (fn: () => void) => void;

export function before(fn: () => void) {
    if (checkCurrentSuite(current)) {
        current.on('before', wrap(fn, current));
    }
}

export function after(fn: () => void) {
    if (checkCurrentSuite(current)) {
        current.on('after', wrap(fn, current));
    }
}

export function beforeEach(fn: () => void) {
    if (checkCurrentSuite(current)) {
        current.on('beforeEach', wrap(fn, current));
    }
}

export function afterEach(fn: () => void) {
    if (checkCurrentSuite(current)) {
        current.on('afterEach', wrap(fn, current));
    }
}

function runNext(opts?: SuiteRunOptions): Promise<void> {
    while (true) {
        running = roots[rootIndex++];
        if (running === undefined) {
            rootIndex = 0;
            reporter.end();
            return Promise.resolve();
        }
        if (hasOnlys) {
            if (!running.isOnly) {
                continue;
            }
        }
        if (running.isSkipped) {
            continue;
        }
        return running.run(opts).then(() => runNext(opts));
    }
}

export function run(opts?: SuiteRunOptions) {
    if (roots.length === 0) {
        return Promise.reject(new Error('No benchmarks'));
    }
    if (running) {
        Promise.reject(new Error('Benchmarks already running'));
    }
    reporter.begin(globalOptions.platform && platform ? platform : undefined);
    return runNext(opts);
}

export function stats() {
    return {
        count
    };
}

export interface RawGlobalOptions extends Benchmark.Options {
    grep?: RawGrep;
    reporter?: RawReporter;
    reporterOptions?: RawReporterOptions;
    dry?: boolean;
    platform?: boolean;
    results?: boolean;
}

export function setup(opts?: RawGlobalOptions) {
    resetOptions(opts);
    globalThis.suite = suite;
    globalThis.bench = bench;
    globalThis.benchmark = bench;
    globalThis.before = before;
    globalThis.after = after;
    globalThis.beforeEach = beforeEach;
    globalThis.afterEach = afterEach;
    return emitter;
}

function resetReporter(newReporter: BaseReporter) {
    reporter = newReporter;
}

export function resetOptions({ grep, reporter, reporterOptions, ...opts }: RawGlobalOptions = {}) {
    globalOptions = {
        ...opts,
        grep: coerceInclude(grep)
    };
    resetReporter(coerceReporter(reporter, reporterOptions));
    return emitter;
}
