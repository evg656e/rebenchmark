import BaseReporter, { RawBaseReporterOptions } from './BaseReporter';
import ConsoleReporter from './ConsoleReporter';
import HTMLReporter from './HTMLReporter';
import JSONReporter from './JSONReporter';
import NullReporter from './NullReporter';
import StringReporter from './StringReporter';
import { Constructor } from '../util/Constructor';

export const reporters: { [name: string]: Constructor<BaseReporter> } = {
    ConsoleReporter,
    HTMLReporter,
    JSONReporter,
    NullReporter,
    StringReporter,
    console: ConsoleReporter,
    html: HTMLReporter,
    json: JSONReporter,
    null: NullReporter,
    string: StringReporter
};

function getReporterClass(name = '', DefaultReporterClass: Constructor<BaseReporter> = ConsoleReporter) {
    return reporters[name] ?? DefaultReporterClass;
}

const list: (str: string | string[]) => string[] = str => Array.isArray(str) ? list(str.join(',')) : str.split(/ *, */);

export type RawReporterOptions = string | string[] | RawBaseReporterOptions;

export function coerceReporterOptions(opts?: RawReporterOptions): RawBaseReporterOptions | undefined {
    if (typeof opts === 'string' || Array.isArray(opts)) {
        return Object.fromEntries(list(opts).map((opt) => {
            const pair = opt.split('=');
            if (pair.length > 2 || !pair.length) {
                throw new Error(`Invalid reporter option '${opt}': expected <key=value> format`);
            }
            if (pair.length === 1) {
                pair.push(true as any);
            }
            return pair;
        }));
    }
    return opts;
}

export function createReporter(name?: string, opts?: RawBaseReporterOptions, DefaultClass?: Constructor<BaseReporter>) {
    const ReporterClass = getReporterClass(name, DefaultClass);
    if (ReporterClass === undefined) {
        throw new TypeError(`Empty reporter class for name '${name}'`);
    }
    return new ReporterClass(opts);
}

export type RawReporter = string | BaseReporter;

export function coerceReporter(reporter?: RawReporter, opts?: RawReporterOptions) {
    if (typeof reporter === 'object'
        && reporter !== null
        && reporter instanceof BaseReporter) {
        return reporter;
    }
    return createReporter(reporter, coerceReporterOptions(opts));
}
