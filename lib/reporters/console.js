import BaseReporter from './base';

export default class ConsoleReporter extends BaseReporter {
    constructor(opts) {
        super(opts);
        this.opts = { indent: 2, ...opts };
    }

    before(suite) {
        if (suite.hasBenchmarks) {
            this.print(`[${suite.name}]`, suite.level);
        }
    }

    after(suite) {
        const filter = this.opts.filter;
        if (filter && suite.length > 0) {
            this.print(filter + ': ' + suite.filter(filter).map('name'), suite.level);
        }
    }

    afterEach(suite, bench) {
        if (bench) {
            this.print(String(bench), suite.level + 1);
        }
    }

    print(str, level = 0) {
        console.log(' '.repeat(level * this.opts.indent) + str);
    }
}
