suite('bind vs call', () => {
    const makeArray = (n) => {
        const ret = new Array(n);
        for (let i = 0; i < n; i++) {
            ret[i] = i;
        }
        return ret;
    };

    function acc(x) {
        this.res += x;
    }

    [
        ['small', makeArray(100), acc],
        ['medium', makeArray(1000), acc],
        ['big', makeArray(10000), acc],
    ].forEach(([set, arr, cb]) => {
        suite(set, () => {
            bench('call', () => {
                const obj = { res: 0 };
                for (let i = 0; i < arr.length; i++) {
                    cb.call(obj, arr[i], i, arr);
                }
                return obj;
            });

            bench('bind', () => {
                const obj = { res: 0 };
                const cbb = cb.bind(obj);
                for (let i = 0; i < arr.length; i++) {
                    cbb(arr[i], i, arr);
                }
                return obj;
            });
        });
    });
});
