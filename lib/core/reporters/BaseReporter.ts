import { has } from '../util/object/has';
import { coerceNonNegativeInteger, coerceBoolean } from './coerceOptions';
import type Benchmark from 'benchmark';
import type { Suite } from '../Suite';

export interface RawBaseReporterOptions {
    [name: string]: any;
}

export interface BaseReporterOptions {
    results: boolean;
    indent: number;
}

export default class BaseReporter<TOptions extends BaseReporterOptions = BaseReporterOptions> { // we should keep default export for reporters to allow dynamic import through cli options
    options: TOptions;

    constructor(opts?: RawBaseReporterOptions) {
        this.options = this.coerceOptions({ ...opts }) as TOptions;
    }

    listen(suite: Suite) {
        suite.setMaxListeners(20);
        events.forEach((e) => suite.on(e, this[e].bind(this, suite)));
    }

    begin(platform?: Platform) { }

    before(suite: Suite) { }

    beforeEach(suite: Suite, bench?: Benchmark) { }

    afterEach(suite: Suite, bench?: Benchmark) { }

    after(suite: Suite) { }

    end() { }

    print(str: string, level = 0) { }

    coerceOptions(opts: RawBaseReporterOptions): BaseReporterOptions {
        return {
            results: coerceResults(opts),
            indent: coerceIndent(opts)
        };
    }
}

export function createCoerceOption<T>(name: string, defaultValue: T, coerceFn: (value: any, defaultValue: T) => T) {
    return function (opts: RawBaseReporterOptions) {
        if (!has(opts, name)) {
            return defaultValue;
        }
        return coerceFn(opts[name], defaultValue);
    };
}

const coerceIndent = createCoerceOption('indent', 2, coerceNonNegativeInteger);
const coerceResults = createCoerceOption('results', false, coerceBoolean);

const events = ['before', 'after', 'beforeEach', 'afterEach'] as const;
