import SuiteReporter from './_suite_reporter';

export default class StringReporter extends SuiteReporter {
    constructor(opts) {
        super(opts);
        this.res = [];
    }

    before(suite) {
        this.res.push(`${suite.path}:before`);
    }

    after(suite) {
        this.res.push(`${suite.path}:after`);
    }

    beforeEach(suite, bench) {
        this.res.push(`${suite.path}:${bench.name}:beforeEach`);
    }

    afterEach(suite, bench) {
        this.res.push(`${suite.path}:${bench.name}:afterEach`);
    }

    toString() {
        return this.res.join(this.opts.sep || '\n');
    }
}