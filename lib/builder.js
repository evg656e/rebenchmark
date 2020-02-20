import pick from 'lodash/pick';
import Suite from './suite';
import { EventEmitter } from 'events';
import reportErr from './util/reportErr';

let current = null;
const emitter = new EventEmitter();

function suite(name, fn) {
    const suite = new Suite(name, {
        parent: current,
        reporter: reporter,
        test: globalOpts.test
    });

    suite.on('error', reportErr)
        .on('start', () => emitter.emit('start', suite))
        .on('end', () => emitter.emit('end', suite));

    current = suite;
    try {
        fn(); // configure this suite
    }
    catch (err) {
        reportErr(err, suite);
    }
    current = current.parent;

    if (suite.isRoot) {
        suite.run().catch(reportErr);
    }
}

const benchProps = ['maxTime', 'minTime', 'minSamples'];

function bench(name, opts, fn) {
    if (typeof opts === 'function') {
        fn = opts;
        opts = undefined;
    }
    const benchOpts = pick(globalOpts, benchProps);

    if (!globalOpts.grep || globalOpts.grep.test(`${current.path}:${name}`)) {
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
globalThis.benchmark = bench;
globalThis.before = before;
globalThis.after = after;
globalThis.beforeEach = beforeEach;
globalThis.afterEach = afterEach;
globalThis.globalOpts = {};
globalThis.reporter = null;

export default emitter;
