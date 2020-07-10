export function pseq<T extends (...args: any[]) => void>(arr: T[]) {
    return arr.reduce(
        (r, n) => r.then(typeof n === 'function' ? n : () => Promise.resolve(n)),
        Promise.resolve());
} 
