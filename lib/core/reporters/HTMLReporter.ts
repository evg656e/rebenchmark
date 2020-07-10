import { RawBaseReporterOptions, createCoerceOption } from './BaseReporter';
import ConsoleReporter, { ConsoleReporterOptions } from './ConsoleReporter';
import { coerceBoolean } from './coerceOptions';

export interface HTMLReporterOptions extends ConsoleReporterOptions {
    echo: boolean;
    root: null | string | Element;
}

export default class HTMLReporter<TOptions extends HTMLReporterOptions = HTMLReporterOptions> extends ConsoleReporter<TOptions> {
    _root: Element | null;
    pending: Node[];

    constructor(opts?: RawBaseReporterOptions) {
        super(opts);
        this._root = null;
        this.pending = [];
    }

    print(str: string, level = 0) {
        if (this.options.echo) {
            super.print(str, level);
        }
        this.pending.push(document.createTextNode('\u00A0'.repeat(level * this.options.indent!) + str));
        this.pending.push(document.createElement('br'));
        this.flush();
    }

    flush() {
        if (this.root !== null) {
            while (this.pending.length !== 0) {
                this.root.appendChild(this.pending.shift()!);
            }
        }
    }

    get root() {
        if (this._root === null) {
            const root = this.options.root;
            if (typeof root === 'string') {
                this._root = document.querySelector(root);
            }
            else if (typeof root === 'object'
                && root !== null
                && root instanceof Element) {
                this._root = root;
            }
        }
        return this._root;
    }

    coerceOptions(opts: RawBaseReporterOptions): HTMLReporterOptions {
        return {
            ...super.coerceOptions(opts),
            root: coerceRoot(opts),
            echo: coerceEcho(opts)
        };
    }
}

const coerceRoot = createCoerceOption('root', null, (value: any) => {
    if (typeof value === 'string') {
        return value;
    }
    if (typeof value === 'object' && value !== null && value instanceof Element) {
        return value;
    }
    return null;
});
const coerceEcho = createCoerceOption('echo', true, coerceBoolean);
