import forOwn from 'lodash/forOwn';
import SuiteReporter from './_suite_reporter';

function gen(suite) {
    if (suite.hasBenchmarks) {
        const res = {};
        suite.children.forEach((c) => res[c.name] = gen(c));
        forOwn(suite.results, (v, k) => res[k] = v);
        return res;
    }
}

export default class JSONReporter extends SuiteReporter {
    constructor(opts) {
        super(opts);
        this.opts = { indent: 2, ...opts };
    }

    before(suite) { }

    after(suite) {
        if (suite.isRoot && suite.hasBenchmarks) {
            console.log(JSON.stringify({ [suite.name]: gen(suite) }, null, this.opts.indent));
        }
    }
}
