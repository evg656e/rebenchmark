import pick from 'lodash/pick';
import { EventEmitter } from 'events';
import platform from 'platform';
import Suite from './suite';
import ConsoleReporter from './reporters/ConsoleReporter';
import { coerceReporter } from './reporters/index';
import { coerceGrep } from './util/coerceGrep';

const pending = [];
let running = null;
let current = null;
let globalOpts = {};
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

    if (!name.length || globalOpts.grep(name)) {
        if (name.length) {
            console.error(`Error in ${name}`);
        }
        console.error(err);
    }
}

export function suite(name, fn) {
    const suite = new Suite(name, {
        parent: current,
        dry: globalOpts.dry,
        filter: globalOpts.filter,
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
        if (globalOpts.autoRun && !running) {
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
    const benchOpts = pick(globalOpts, benchProps);

    if (globalOpts.grep(`${current.path}:${name}`)) {
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
    if (running === undefined)
        return Promise.resolve();
    return running.run(opts).then(() => runNext(opts));
}

export function run(opts) {
    if (pending.length === 0)
        return Promise.reject(new Error('No benchmarks'));
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

export function resetOptions(opts) {
    opts = { ...opts };
    opts.grep = coerceGrep(opts.grep, true);
    opts.reporter = coerceReporter(opts.reporter, opts.reporterOptions);
    globalOpts = opts;
    reporter = globalOpts.reporter;
    reporter.setup(globalOpts.platform ? platform : undefined);
    return emitter;
}
