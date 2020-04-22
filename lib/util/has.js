const hasOwnProperty = Object.prototype.hasOwnProperty;

export function has(obj, key) {
    return hasOwnProperty.call(obj, key);
}
