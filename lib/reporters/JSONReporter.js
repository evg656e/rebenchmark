import forOwn from 'lodash/forOwn';
import BaseReporter from './BaseReporter';

function gen(suite) {
    if (suite.hasBenchmarks) {
        const res = {};
        suite.children.forEach((c) => res[c.name] = gen(c));
        forOwn(suite.results, (v, k) => res[k] = v);
        return res;
    }
}

export default class JSONReporter extends BaseReporter {
    constructor(opts) {
        super({ indent: 2, ...opts });
    }

    after(suite) {
        if (suite.isRoot && suite.hasBenchmarks) {
            console.log(JSON.stringify({ [suite.name]: gen(suite) }, null, this.options.indent));
        }
    }
}
