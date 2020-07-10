import type Benchmark from 'benchmark';
import type { Suite } from '../../Suite';
import type BaseReporter from '../BaseReporter';

export class BaseResultsHandler<TReporter extends BaseReporter = BaseReporter> {
    constructor(public reporter: TReporter) { }

    afterEach(suite: Suite, bench?: Benchmark) { }

    after(suite: Suite) { }

    print(str: string, level?: number) {
        this.reporter.print(str, level);
    }
}
