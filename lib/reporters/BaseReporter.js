export class BaseReporter {
    constructor(opts) {
        this.options = { ...opts };
    }

    listen(suite) {
        suite.setMaxListeners(20);
        events.forEach((e) => suite.on(e, this[e].bind(this, suite)));
    }

    begin(platform) { }

    before(suite) { }

    beforeEach(suite, bench) { }

    afterEach(suite, bench) { }

    after(suite) { }

    end() { }

    print(str, level = 0) { }
}

const events = ['before', 'after', 'beforeEach', 'afterEach'];
