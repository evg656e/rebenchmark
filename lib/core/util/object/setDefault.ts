import { has } from './has';

export function setDefault<T>(obj: any, key: PropertyKey, defaultValue: T): T;
export function setDefault<T>(obj: any, key: PropertyKey, defaultValue: () => T): T;
export function setDefault(obj: any, key: PropertyKey, defaultValue: any): any {
    return has(obj, key) ?
        obj[key] :
        obj[key] = typeof defaultValue === 'function' ? defaultValue() : defaultValue;
}
