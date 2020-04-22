import pick from 'lodash/pick';
import { EventEmitter } from 'events';
import platform from 'platform';
import { Suite } from './suite';
import { ConsoleReporter } from './reporters/ConsoleReporter';
import { coerceReporter } from './reporters';
import { coerceInclude } from './util/grep';

const pending = [];
let running = null;
let current = null;
let options = {};
let reporter = new ConsoleReporter();
const emitter = new EventEmitter();

function reportError(err, suite, bench) {
    if (err.suite) {
        bench = err.bench;
        suite = err.suite;
        err = err.error;
    }

    let name = [];
    if (suite) {
        name.push(suite.path);
    }
    if (bench) {
        name.push(bench.name);
    }
    name = name.join(':');

    if (!name.length || options.grep(name)) {
        if (name.length) {
            console.error(`Error in ${name}`);
        }
        console.error(err);
    }
}

export function suite(name, fn) {
    const suite = new Suite(name, {
        parent: current,
        dry: options.dry,
        results: options.results,
        resultsOptions: options.resultsOptions,
        reporter
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
    current = current.parent;

    if (suite.isRoot) {
        pending.push(suite);
        if (options.autoRun && !running) {
            run();
        }
    }
}

const benchProps = ['maxTime', 'minTime', 'minSamples'];

export function bench(name, opts, fn) {
    if (typeof opts === 'function') {
        fn = opts;
        opts = undefined;
    }
    const benchOpts = pick(options, benchProps);

    if (options.grep(`${current.path}:${name}`)) {
        current.add(name, fn, { ...benchOpts, ...opts });
    }
}

export { bench as benchmark };

function wrap(fn, suite, bench) {
    return () => {
        try {
            fn(suite);
        }
        catch (err) {
            suite.emit('error', err, suite, bench);
        }
    };
}

export function before(fn) {
    current.on('before', wrap(fn, current));
}

export function after(fn) {
    current.on('after', wrap(fn, current));
}

export function beforeEach(fn) {
    current.on('beforeEach', wrap(fn, current));
}

export function afterEach(fn) {
    current.on('afterEach', wrap(fn, current));
}

function runNext(opts) {
    running = pending.shift();
    if (running === undefined) {
        reporter.end();
        return Promise.resolve();
    }
    return running.run(opts).then(() => runNext(opts));
}

export function run(opts) {
    if (pending.length === 0) {
        return Promise.reject(new Error('No benchmarks'));
    }
    if (running) {
        Promise.reject(new Error('Benchmarks already running'));
    }
    reporter.begin(options.platform && platform ? platform : undefined);
    return runNext(opts);
}

export function setup(opts) {
    resetOptions(opts);
    globalThis.suite = suite;
    globalThis.bench = bench;
    globalThis.benchmark = bench; // alias
    globalThis.before = before;
    globalThis.after = after;
    globalThis.beforeEach = beforeEach;
    globalThis.afterEach = afterEach;
    return emitter;
}

function resetReporter(newReporter) {
    reporter = newReporter;
}

export function resetOptions({ grep, reporter, reporterOptions,...opts } = {}) {
    options = {
        ...opts,
        grep: coerceInclude(grep),
        reporter: coerceReporter(reporter, reporterOptions)
    };
    resetReporter(options.reporter);
    return emitter;
}
