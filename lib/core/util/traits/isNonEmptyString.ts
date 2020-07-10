export function isNonEmptyString(arg: any): arg is string {
    return typeof arg === 'string' && arg.length !== 0;
}
