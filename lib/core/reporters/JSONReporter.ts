import forOwn from 'lodash/forOwn';
import BaseReporter, { BaseReporterOptions, RawBaseReporterOptions } from './BaseReporter';
import { BaseResultsHandler } from './results/BaseResultsHandler';
import { JSONResultsHandler, SuiteResults } from './results/JSONResultsHandler';
import type Benchmark from 'benchmark';
import type { Suite } from '../Suite';

export interface JSONReporterOptions extends BaseReporterOptions {
}

export default class JSONReporter<TOptions extends JSONReporterOptions = JSONReporterOptions> extends BaseReporter<TOptions> {
    results!: SuiteResults;
    resultsHandler: BaseResultsHandler;

    constructor(opts?: RawBaseReporterOptions) {
        super(opts);
        this.resultsHandler = JSONResultsHandler.create(this);
    }

    afterEach(suite: Suite, bench?: Benchmark) {
        this.resultsHandler.afterEach(suite, bench);
    }

    after(suite: Suite) {
        if (suite.isRoot && suite.hasBenchmarks) {
            console.log(JSON.stringify({ [suite.name]: gen(suite, this.results) }, null, this.options.indent));
        }
    }
}

function gen(suite: Suite, suiteResults: SuiteResults) {
    if (suite.hasBenchmarks) {
        const res: { [name: string]: any } = {};
        suite.children.forEach((c) => res[c.name] = gen(c, suiteResults));
        forOwn(suiteResults.get(suite), (v, k) => res[k] = v);
        return res;
    }
}
