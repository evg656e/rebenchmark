import pick from 'lodash/pick';
import { setDefault } from '../../util/map/setDefault';
import { BaseResultsHandler } from './BaseResultsHandler';
import { NullResultsHandler } from './NullResultsHandler';
import type Benchmark from 'benchmark';
import type { Suite } from '../../Suite';
import type JSONReporter from '../JSONReporter';

export type SuiteResults = Map<Suite, { [name: string]: any }>;

export class JSONResultsHandler extends BaseResultsHandler<JSONReporter> {
    results: SuiteResults;

    constructor(reporter: JSONReporter) {
        super(reporter);
        this.results = reporter.results;
    }

    afterEach(suite: Suite, bench?: Benchmark & { name: string }) {
        if (bench) {
            setDefault(this.results, suite, {})[bench.name] = pick(bench, resultsProps);
        }
    }

    static create(reporter: JSONReporter) {
        if (reporter.options.results) {
            reporter.results = new Map();
            return new JSONResultsHandler(reporter);
        }
        return NullResultsHandler.instance;
    }
}

const resultsProps = ['name', 'count', 'cycles', 'error', 'hz', 'stats', '_attr'] as const;
