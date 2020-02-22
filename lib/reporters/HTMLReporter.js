import BaseReporter from './BaseReporter';
import ConsoleReporter from './ConsoleReporter';
import NullReporter from './NullReporter';

export default class HTMLReporter extends BaseReporter {
    constructor(opts) {
        super({ indent: 2, echo: true, ...opts });
        this._echo = this.opts.echo ? new ConsoleReporter(opts) : new NullReporter();
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
        const root = this.root();
        if (root) {
            root.appendChild(document.createTextNode('\u00A0'.repeat(level * this.opts.indent) + str));
            root.appendChild(document.createElement('br'));
        }
        this._echo.print(str, level);
    }

    root() {
        if (!this._root) {
            this._root = this.opts.root;
            if (typeof this._root === 'string') {
                this._root = document.querySelector(this._root);
            }
        }
        return this._root;
    }
}
