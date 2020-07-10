import { EventEmitter } from 'events';
import pick from 'lodash/pick';
import Benchmark from 'benchmark';
import NullReporter from './reporters/NullReporter';
import { pseq } from './util/pseq';
import type BaseReporter from './reporters/BaseReporter';

export interface SuiteOptions {
    parent?: Suite;
    dry?: boolean;
    reporter?: BaseReporter;
    only?: boolean;
}

export interface Visitor {
    beforeChildren?(x: Suite, ctx?: any): void;
    beforeChild?(x: Suite, ctx?: any): void;
    afterChild?(x: Suite, ctx?: any): void;
    afterChildren?(x: Suite, ctx?: any): void | Promise<void | boolean>;
}

export interface SuiteRunOptions {
    [name: string]: any;
}

export interface BenchFunctionOptions extends Benchmark.Options {
    only?: boolean;
    skip?: boolean;
}

export type BenchmarkSuite = Benchmark.Suite & ArrayLike<Benchmark>;

export class Suite extends EventEmitter {
    children: Suite[];
    name: string;
    parent?: Suite;
    errors: Error[];

    _reporter!: BaseReporter;
    _suite: BenchmarkSuite;
    _filteredSuite: BenchmarkSuite | null;
    _onlyBenches: Set<Benchmark>;
    _skipBenches: Set<Benchmark>;
    _only: boolean;
    _skip: boolean;

    constructor(name: string, { parent, dry, reporter, only }: SuiteOptions) {
        super();

        this.children = [];
        this.name = name;
        this.parent = parent;
        if (this.parent) {
            this.parent.children.push(this);
        }
        this.errors = [];
        this._suite = new Benchmark.Suite(name) as BenchmarkSuite;
        this._filteredSuite = null;
        this._onlyBenches = new Set();
        this._skipBenches = new Set();
        this._only = Boolean(only);
        this._skip = false;

        if (parent && parent.isOnly) {
            this._only = true;
        }

        if (dry) {
            this.on('beforeEach', (bench: Benchmark) => bench && bench.abort());
        }

        if (this.isRoot) {
            this.on('before', () => this.emit('start'));
            this.on('after', () => process.nextTick(() => this.emit('end')));
        }

        this._initReporter(reporter);
    }

    get suite() {
        if (this._filteredSuite === null) {
            const skipAll = (this.parent && this.parent.isOnly && !this.isOnly) || this.isSkipped;
            const hasOnlys = this._onlyBenches.size !== 0;
            const hasSkips = this._skipBenches.size !== 0;
            if (skipAll || hasOnlys || hasSkips) {
                this._filteredSuite = this.filter((bench: Benchmark) => {
                    if (skipAll)
                        return false;
                    if (hasOnlys && !this._onlyBenches.has(bench))
                        return false;
                    if (hasSkips && this._skipBenches.has(bench))
                        return false;
                    return true;
                })
            }
            else {
                this._filteredSuite = this._suite;
            }
        }
        return this._filteredSuite;
    }

    get hasErrors() {
        return this.errors.length > 0 || this.children.find((x) => x.errors.length) !== undefined;
    }

    get reporter() {
        return this.parent ? this.parent.reporter : this._reporter;
    }

    set reporter(r: BaseReporter) {
        this._reporter = r;
    }

    get hasBenchmarks(): boolean {
        return this.length > 0 || this.children.find((x) => x.hasBenchmarks) !== undefined;
    }

    get length() {
        return this.suite.length;
    }

    get root(): Suite {
        return !this.parent ? this : this.parent.root;
    }

    get isRoot() {
        return !this.parent;
    }

    get level(): number {
        return this.parent ? this.parent.level + 1 : 0;
    }

    get path(): string {
        return this.parent ? this.parent.path + ':' + this.name : ':' + this.name;
    }

    get isOnly() {
        return this._only;
    }

    only() {
        if (!this._only) {
            this._only = true;
            if (this.parent) {
                this.parent.only();
            }
        }
    }

    get isSkipped() {
        return this._skip;
    }

    skip() {
        if (!this._skip) {
            this._skip = true;
        }
    }

    filter(f: string | ((x: Benchmark) => boolean)) {
        return this._suite.filter(f) as BenchmarkSuite;
    }

    print(str: string, level = 0) {
        this.reporter.print(str, this.level + level);
    }

    add(name: string, theTest: (...args: any[]) => any, opts: BenchFunctionOptions = {}) {
        const defer = theTest.length === 1;

        const fn = defer ? (d: { resolve: () => void }) => theTest((e?: any) => {
            if (e) {
                if (e instanceof Error) {
                    throw e;
                }
                throw new Error(String(e));
            }
            d.resolve();
        }) : theTest;

        this._suite.add(name, fn, {
            ...pick(opts, benchProps),
            defer,
            onStart: (e: Benchmark.Event) => { this.emit('beforeEach', e.target ? e.target : e) },
            onComplete: (e: Benchmark.Event) => { this.emit('afterEach', e.target ? e.target : e) }
        });

        const bench = this._suite[this._suite.length - 1] as Benchmark & { _attr: { path: string } };
        bench._attr = { path: this.path };
        if (opts.only) {
            this._onlyBenches.add(bench);
            this.only();
        }
        if (opts.skip) {
            this._skipBenches.add(bench);
        }

        return this;
    }

    walk(visitor?: Visitor, context?: any) {
        return this._walk({
            beforeChildren: noop,
            afterChildren: noop,
            beforeChild: noop,
            afterChild: noop,
            ...visitor
        }, context);
    }

    _walk(visitor: Required<Visitor>, context?: any) {
        return pseq([
            () => visitor.beforeChildren(this, context),
            this.children.map((x) => [
                () => visitor.beforeChild(this, context),
                () => x.walk(visitor, context),
                () => visitor.afterChild(this, context)
            ]),
            () => visitor.afterChildren(this, context)
        ].flat(Infinity) as (() => void)[]);
    }

    run(opts?: SuiteRunOptions) {
        return this.walk({
            beforeChildren: (x) => x.emit('before'),
            beforeChild: (x) => x.emit('beforeEach'),
            afterChild: (x) => x.emit('afterEach'),
            afterChildren: (x) => x._run(opts).then(() => x.emit('after'))
        })
    }

    _run(opts?: SuiteRunOptions) {
        if (this.length === 0) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) =>
            this.suite
                .on('complete', resolve)
                .on('error', (e: Benchmark.Event) => reject({ error: (<any>e.target).error, suite: this, bench: e.target }))
                .on('abort', (e: Benchmark.Event) => reject(e.target ? e.target : e))
                .run({ ...opts, async: true })
        ).catch((err) => {
            this.errors.push(err);
            this.emit('error', err);
        });
    }

    _initReporter(reporter?: BaseReporter) {
        if (this.reporter === undefined) {
            this._reporter = reporter ?? new NullReporter();
        }
        this.reporter.listen(this);
    }
}

function noop() { }

const benchProps = ['delay', 'initCount', 'maxTime', 'minSamples', 'minTime', 'setup', 'teardown'] as const;
