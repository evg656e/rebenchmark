import BaseReporter, { BaseReporterOptions, createCoerceOption } from './BaseReporter';
import { ConsoleResultsHandler } from './results/ConsoleResultsHandler';
import type Benchmark from 'benchmark';
import type { Suite } from '../Suite';
import type { BaseResultsHandler } from './results/BaseResultsHandler';
import type { RawBaseReporterOptions } from './BaseReporter';

export interface ConsoleReporterOptions extends BaseReporterOptions {
    format: string;
}

export default class ConsoleReporter<TOptions extends ConsoleReporterOptions = ConsoleReporterOptions> extends BaseReporter<TOptions> {
    resultsHandler: BaseResultsHandler;

    constructor(opts?: RawBaseReporterOptions) {
        super(opts);
        this.resultsHandler = ConsoleResultsHandler.create(this);
    }

    begin(platform?: Platform) {
        if (platform) {
            this.print(String(platform));
        }
    }

    before(suite: Suite) {
        if (suite.hasBenchmarks) {
            this.print(`[${suite.name}]`, suite.level);
        }
    }

    after(suite: Suite) {
        this.resultsHandler.after(suite);
    }

    afterEach(suite: Suite, bench?: Benchmark) {
        if (bench) {
            this.print(String(bench), suite.level + 1);
        }
    }

    print(str: string, level = 0) {
        console.log(' '.repeat(level * this.options.indent) + str);
    }

    coerceOptions(opts: RawBaseReporterOptions): ConsoleReporterOptions {
        return {
            ...super.coerceOptions(opts),
            format: coerceFormat(opts)
        };
    }
}

const coerceFormat = createCoerceOption('format', 'short', String);
