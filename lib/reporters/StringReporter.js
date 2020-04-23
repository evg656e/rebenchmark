import BaseReporter from './BaseReporter';

export default class StringReporter extends BaseReporter {
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
        return this.res.join(this.options.sep ?? '\n');
    }
}
