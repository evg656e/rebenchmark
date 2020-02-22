import ConsoleReporter from './ConsoleReporter';
import JSONReporter from './JSONReporter';
import NullReporter from './NullReporter';
import StringReporter from './StringReporter';
import { isNonEmptyString } from '../util/isNonEmptyString';

export const reporters = {
    ConsoleReporter,
    JSONReporter,
    NullReporter,
    StringReporter,
    console: ConsoleReporter,
    json: JSONReporter,
    null: NullReporter,
    string: StringReporter,
};

function getReporterClass(name, _default = ConsoleReporter) {
    return reporters[name] || _default;
}

export function createReporter(name, opts, _default) {
    const ReporterClass = getReporterClass(name, _default);
    return new ReporterClass(opts);
}

const list = str => Array.isArray(str) ? list(str.join(',')) : str.split(/ *, */)

export function coerceReporter(reporter, reporterOptions) {
    if (typeof reporer === 'object' && reporter !== null) {
        return reporter;
    }
    reporterOptions = coerceReporterOptions(reporterOptions);
    if (isNonEmptyString(reporter)) {
        return createReporter(reporter, reporterOptions);
    }
    return new ConsoleReporter(reporterOptions);
}

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
