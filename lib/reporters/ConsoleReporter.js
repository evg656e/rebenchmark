import BaseReporter from './BaseReporter.js';
import { BaseResults } from './results/BaseResults.js';
import { createResults } from './results/registry.js';
import './results/register.js';

export default class ConsoleReporter extends BaseReporter {
    constructor(opts) {
        super({ indent: 2, ...opts });
        this.results = createResults(this.options.results, this, BaseResults);
    }

    begin(platform) {
        if (platform) {
            this.print(String(platform));
        }
    }

    before(suite) {
        if (suite.hasBenchmarks) {
            this.print(`[${suite.name}]`, suite.level);
        }
    }

    after(suite) {
        this.results.after(suite);
    }

    afterEach(suite, bench) {
        if (bench) {
            this.print(String(bench), suite.level + 1);
        }
    }

    print(str, level = 0) {
        console.log(' '.repeat(level * this.options.indent) + str);
    }
}
