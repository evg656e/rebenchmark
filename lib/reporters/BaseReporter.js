export default class BaseReporter {
    constructor(opts) {
        this.opts = { ...opts };
    }

    listen(suite) {
        suite.setMaxListeners(20);
        events.forEach((e) => suite.on(e, this[e].bind(this, suite)));
    }

    setup(platform) { }

    before(suite) { }

    beforeEach(suite, bench) { }

    afterEach(suite, bench) { }

    after(suite) { }

    print(str, level = 0) { }
}

const events = ['before', 'after', 'beforeEach', 'afterEach'];
