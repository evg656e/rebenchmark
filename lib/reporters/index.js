import ConsoleReporter from './ConsoleReporter';
import HTMLReporter from './HTMLReporter';
import JSONReporter from './JSONReporter';
import NullReporter from './NullReporter';
import StringReporter from './StringReporter';

export const reporters = {
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

function getReporter(name, DefaultClass) {
    return reporters[name] ?? DefaultClass;
}

const list = str => Array.isArray(str) ? list(str.join(',')) : str.split(/ *, */)

export function coerceReporterOptions(opts) {
    if (typeof opts === 'string' || Array.isArray(opts)) {
        return Object.fromEntries(list(opts).map((opt) => {
            const pair = opt.split('=');
            if (pair.length > 2 || !pair.length) {
                throw new Error(`Invalid reporter option '${opt}': expected <key=value> format`);
            }
            if (pair.length === 1) {
                pair.push(true);
            }
            return pair;
        }));
    }
    return opts;
}

export function createReporter(name, opts, DefaultClass) {
    const ReporterClass = getReporter(name, DefaultClass);
    return new ReporterClass(opts);
}

export function coerceReporter(reporter, opts) {
    if (typeof reporter === 'object' && reporter !== null) {
        return reporter;
    }
    return createReporter(reporter, coerceReporterOptions(opts));
}
