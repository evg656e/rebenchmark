import BaseReporter from './BaseReporter';

export default class ConsoleReporter extends BaseReporter {
    constructor(opts) {
        super({ indent: 2, ...opts });
    }
    
    setup(platform) {
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
        const filter = suite.options.filter;
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