import isRegExp from 'lodash/isRegExp';
import { isNonEmptyString } from './isNonEmptyString';

export function coerceGrep(arg, matchesDefault) {
    if (typeof arg === 'function') {
        return arg;
    }
    if (isNonEmptyString(arg)) {
        arg = new RegExp(arg);
    }
    if (isRegExp(arg)) {
        return str => arg.test(str);
    }
    if (Array.isArray(arg)) {
        arg = arg.map(x => {
            if (isNonEmptyString(x)) {
                return new RegExp(x);
            }
            if (isRegExp(x)) {
                return x;
            }
            throw new Error(`Expected non-empty string or RegExp, got: ${x}`);
        });
        return str => arg.some(pattern => pattern.test(str))
    }
    return _ => matchesDefault;
}
