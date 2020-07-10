export function coerceNonNegativeInteger(value: any, defaultValue: number) {
    const x = Number.parseInt(String(value));
    if (isNaN(x) || x < 0) {
        return defaultValue;
    }
    return x;
}

export function coerceBoolean(value: any, defaultValue: boolean) {
    if (typeof value === 'string') {
        switch (value.toLocaleLowerCase()) {
            case 'true': case 't': return true;
            case 'false': case 'f': return false;
            default: return defaultValue;
        }
    }
    else if (typeof value === 'boolean') {
        return value;
    }
    return Boolean(Number(String(value)));
}
