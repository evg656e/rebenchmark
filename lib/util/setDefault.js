import { has } from './has.js';

export function setDefault(obj, key, defaultValue) {
    return has(obj, key) ?
        obj[key] :
        obj[key] = typeof defaultValue === 'function' ? defaultValue() : defaultValue;
}
