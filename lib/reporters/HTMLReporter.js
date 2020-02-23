import ConsoleReporter from './ConsoleReporter';

export default class HTMLReporter extends ConsoleReporter {
    constructor(opts) {
        super({ echo: true, ...opts });
        this.pending = [];
    }

    print(str, level = 0) {
        if (this.opts.echo) {
            super.print(str, level);
        }
        this.pending.push(document.createTextNode('\u00A0'.repeat(level * this.opts.indent) + str));
        this.pending.push(document.createElement('br'));
        this.flush();
    }

    flush() {
        if (this.root) {
            while (this.pending.length !== 0) {
                this.root.appendChild(this.pending.shift());
            }
        }
    }

    get root() {
        if (!this._root) {
            this._root = this.opts.root;
            if (typeof this._root === 'string') {
                this._root = document.querySelector(this._root);
            }
        }
        return this._root;
    }
}
