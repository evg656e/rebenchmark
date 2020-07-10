import BaseReporter, { RawBaseReporterOptions, BaseReporterOptions, createCoerceOption } from './BaseReporter';
import type Benchmark from 'benchmark';
import type { Suite } from '../Suite';

export interface StringReporterOptions extends BaseReporterOptions {
    sep: string;
}

export default class StringReporter<TOptions extends StringReporterOptions = StringReporterOptions> extends BaseReporter<TOptions> {
    res: string[];

    constructor(opts?: RawBaseReporterOptions) {
        super(opts);
        this.res = [];
    }

    before(suite: Suite) {
        this.res.push(`${suite.path}:before`);
    }

    after(suite: Suite) {
        this.res.push(`${suite.path}:after`);
    }

    beforeEach(suite: Suite, bench: Benchmark & { name: string }) {
        this.res.push(`${suite.path}:${bench.name}:beforeEach`);
    }

    afterEach(suite: Suite, bench: Benchmark & { name: string }) {
        this.res.push(`${suite.path}:${bench.name}:afterEach`);
    }

    toString() {
        return this.res.join(this.options.sep);
    }

    coerceOptions(opts: RawBaseReporterOptions): StringReporterOptions {
        return {
            ...super.coerceOptions(opts),
            sep: coerceSep(opts)
        };
    }
}

const coerceSep = createCoerceOption('sep', '\n', String);
