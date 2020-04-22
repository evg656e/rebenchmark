import { has } from './has';

export function setDefault(obj, key, defaultValue) {
    return has(obj, key) ?
        obj[key] :
        obj[key] = typeof defaultValue === 'function' ? defaultValue() : defaultValue;
}
