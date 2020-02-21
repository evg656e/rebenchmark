import pick from 'lodash/pick';
import { EventEmitter } from 'events';
import Suite from './suite';
import reportError from './util/reportError';

let current = null;
const emitter = new EventEmitter();

function suite(name, fn) {
    const suite = new Suite(name, {
        parent: current,
        reporter: reporter,
        dry: globalOpts.dry
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
        suite.run().catch(reportError);
    }
}

const benchProps = ['maxTime', 'minTime', 'minSamples'];

function bench(name, opts, fn) {
    if (typeof opts === 'function') {
        fn = opts;
        opts = undefined;
    }
    const benchOpts = pick(globalOpts, benchProps);

    if (typeof globalOpts.grep === 'function' && globalOpts.grep(`${current.path}:${name}`)) {
        current.add(name, fn, { ...benchOpts, ...opts });
    }
}

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

function before(fn) {
    current.on('before', wrap(fn, current));
}

function after(fn) {
    current.on('after', wrap(fn, current));
}

function beforeEach(fn) {
    current.on('beforeEach', wrap(fn, current));
}

function afterEach(fn) {
    current.on('afterEach', wrap(fn, current));
}

globalThis.suite = suite;
globalThis.bench = bench;
globalThis.benchmark = bench; // alias
globalThis.before = before;
globalThis.after = after;
globalThis.beforeEach = beforeEach;
globalThis.afterEach = afterEach;
globalThis.globalOpts = {};
globalThis.reporter = null;

export default emitter;
