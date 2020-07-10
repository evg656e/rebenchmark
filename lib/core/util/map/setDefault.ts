export function setDefault<K, V>(map: Map<K, V>, key: K, defaultValue: V): V;
export function setDefault<K, V>(map: Map<K, V>, key: K, defaultValue: () => V): V;
export function setDefault<K, V>(map: Map<K, V>, key: K, defaultValue: any) {
    if (map.has(key))
        return map.get(key);
    const ret = typeof defaultValue === 'function' ? defaultValue() : defaultValue;
    map.set(key, ret);
    return ret;
}
