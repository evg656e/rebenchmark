import { EventEmitter } from 'events';
import pick from 'lodash/pick';
import Benchmark from 'benchmark';
import ConsoleReporter from './reporters/console';
import pseq from './util/pseq';
import reportError from './util/reportError';

export default class Suite extends EventEmitter {
    constructor(name, opts) {
        super();

        opts = { ...opts };

        this.children = [];
        this.name = name;
        this.parent = opts.parent;
        if (this.parent) {
            this.parent.children.push(this);
        }
        this.errors = [];
        this.suite = new Benchmark.Suite(name);

        if (opts.dry) {
            this.on('beforeEach', (bench) => bench && bench.abort());
        }

        this.on('afterEach', this._setResults.bind(this));
        if (this.isRoot) {
            this.on('before', () => this.emit('start'));
            this.on('after', () => process.nextTick(() => this.emit('end')));
        }

        this._initReporter(opts);
    }

    get hasErrors() {
        return this.errors.length > 0 || this.children.find((x) => x.errors.length) !== undefined;
    }

    get reporter() {
        return this.parent ? this.parent.reporter : this._reporter;
    }

    set reporter(r) {
        this._reporter = r;
    }

    get hasBenchmarks() {
        return this.length > 0 || this.children.find((x) => x.hasBenchmarks) !== undefined;
    }

    get length() {
        return this.suite.length;
    }

    get root() {
        return !this.parent ? this : this.parent.root;
    }

    get isRoot() {
        return !this.parent;
    }

    get level() {
        return this.parent ? this.parent.level + 1 : 0;
    }

    get path() {
        return this.parent ? this.parent.path + ':' + this.name : ':' + this.name;
    }

    filter(f) {
        return this.suite.filter(f);
    }

    getBench(name) {
        return this.suite.filter((x) => x.name === name)[0];
    }

    print(str, level = 0) {
        this.reporter.print(str, this.level + level);
    }

    add(name, theTest, options) {
        const defer = theTest.length === 1;

        options = {
            ...pick(options, benchProps),
            defer,
            onStart: (e) => { this.emit('beforeEach', e.target ? e.target : e); },
            onComplete: (e) => { this.emit('afterEach', e.target ? e.target : e) }
        };

        const fn = defer ? (d) => theTest((val) => {
            if (val) {
                if (val instanceof Error) {
                    throw val;
                }
                throw new Error(String(val));
            }
            d.resolve()
        }) : theTest;

        this.suite.add(name, fn, options);
        const bench = this.getBench(name);
        bench._attr = { suite: this.path, ...options.attr };
        return this;
    }

    walk(visitor, context) {
        return this._walk({
            beforeChildren: noop,
            afterChildren: noop,
            beforeChild: noop,
            afterChild: noop,
            ...visitor
        }, context);
    }

    _walk(visitor, context) {
        return pseq([
            () => visitor.beforeChildren(this, context),
            this.children.map((x) => [
                () => visitor.beforeChild(this, context),
                () => x.walk(visitor, context),
                () => visitor.afterChild(this, context)
            ]),
            () => visitor.afterChildren(this, context)
        ].flat(Infinity));
    }

    run(opts) {
        return this.walk({
            beforeChildren: (x) => x.emit('before'),
            beforeChild: (x) => x.emit('beforeEach'),
            afterChild: (x) => x.emit('afterEach'),
            afterChildren: (x) => x._run(opts).then(() => x.emit('after'))
        })
    }

    _run(opts) {
        if (this.length === 0) {
            return Promise.resolve();
        }
        opts = { ...opts, async: true };

        return new Promise((resolve, reject) =>
            this.suite
                .on('complete', resolve)
                .on('error', (x) => reject({ error: x.target.error, suite: this, bench: x.target }))
                .on('abort', (x) => reject(x.target ? x.target : x))
                .run(opts)
        ).catch((err) => {
            this.errors.push(err);
            reportError(err);
        });
    }

    _setResults(bench) {
        if (bench) {
            this.results = this.results || {};
            this.results[bench.name] = pick(bench, resultsProps);
        }
    }

    _initReporter(opts) {
        if (!this.reporter) {
            this._reporter = opts.reporter || new ConsoleReporter();
        }
        this.reporter.listen(this);
    }
}

function noop() { }

const benchProps = ['delay', 'initCount', 'maxTime', 'minSamples', 'minTime'];
const resultsProps = ['name', 'count', 'cycles', 'error', 'hz', 'stats', '_attr'];
