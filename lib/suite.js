import { EventEmitter } from 'events';
import pick from 'lodash/pick.js';
import Benchmark from 'benchmark';
import ConsoleReporter from './reporters/ConsoleReporter.js';
import { pseq } from './util/pseq.js';

export class Suite extends EventEmitter {
    constructor(name, { parent, dry, reporter, ...opts }) {
        super();

        this._opts = { ...opts };

        this.children = [];
        this.name = name;
        this.parent = parent;
        if (this.parent) {
            this.parent.children.push(this);
        }
        this.errors = [];
        this.suite = new Benchmark.Suite(name);

        if (dry) {
            this.on('beforeEach', (bench) => bench && bench.abort());
        }

        this.on('afterEach', this._setResults.bind(this));
        if (this.isRoot) {
            this.on('before', () => this.emit('start'));
            this.on('after', () => process.nextTick(() => this.emit('end')));
        }

        this._initReporter(reporter);
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

    get options() {
        return this._opts;
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

    add(name, theTest, opts = {}) {
        const defer = theTest.length === 1;

        const fn = defer ? (d) => theTest((e) => {
            if (e) {
                if (e instanceof Error) {
                    throw e;
                }
                throw new Error(String(e));
            }
            d.resolve()
        }) : theTest;

        const bench = this.suite.add(name, fn, {
            ...pick(opts, benchProps),
            defer,
            onStart: (e) => { this.emit('beforeEach', e.target ? e.target : e) },
            onComplete: (e) => { this.emit('afterEach', e.target ? e.target : e) }
        });
        bench._attr = { path: this.path, ...opts.attr };
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

        return new Promise((resolve, reject) =>
            this.suite
                .on('complete', resolve)
                .on('error', (e) => reject({ error: e.target.error, suite: this, bench: e.target }))
                .on('abort', (e) => reject(e.target ? e.target : e))
                .run({ ...opts, async: true })
        ).catch((err) => {
            this.errors.push(err);
            this.emit('error', err);
        });
    }

    _setResults(bench) {
        if (bench) {
            this.results = this.results ?? {};
            this.results[bench.name] = pick(bench, resultsProps);
        }
    }

    _initReporter(reporter) {
        if (!this.reporter) {
            this._reporter = reporter ?? new ConsoleReporter();
        }
        this.reporter.listen(this);
    }
}

function noop() { }

const benchProps = ['delay', 'initCount', 'maxTime', 'minSamples', 'minTime'];
const resultsProps = ['name', 'count', 'cycles', 'error', 'hz', 'stats', '_attr'];
