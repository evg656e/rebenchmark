import isRegExp from 'lodash/isRegExp';
import { isNonEmptyString } from './traits/isNonEmptyString';

export type Grep = (str: string) => boolean;

export type RawGrep = string | RegExp | (string | RegExp)[] | Grep;

export function createCoerceGrep(matchesDefault: boolean): (arg?: RawGrep) => Grep {
    return (arg?: any) => {
        if (typeof arg === 'function') {
            return arg;
        }
        if (isNonEmptyString(arg)) {
            arg = new RegExp(arg);
        }
        if (isRegExp(arg)) {
            return (str: string) => arg.test(str);
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
            return (str: string) => arg.some((pattern: RegExp) => pattern.test(str))
        }
        return (_: string) => matchesDefault;
    };
}

export const coerceInclude = createCoerceGrep(true);

export const coerceExclude = createCoerceGrep(false);

export const includeAll = coerceInclude();
