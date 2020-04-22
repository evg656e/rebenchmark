function forEach(array, callbackfn, thisArg) {
    for (let i = 0; i < array.length; i++)
        callbackfn.call(thisArg, array[i], i, array);
}

suite('forLoop', () => {
    [
        ['empty array', []],
        ['small array', new Array(10).fill(1)],
        ['medium array', new Array(100).fill(1)],
        ['large array', new Array(10000).fill(1)]
    ].forEach(([title, array]) => {
        suite(title, () => {
            bench('conventional for', () => {
                let sum = 0;
                for (let i = 0; i < array.length; i++) {
                    const value = array[i];
                    sum += value;
                    sum += i;
                    sum += value;
                }
                return sum;
            });

            bench('for of', () => {
                let sum = 0;
                let i = 0;
                for (const value of array) {
                    sum += value;
                    sum += i;
                    sum += value;
                    i++;
                }
                return sum;
            });

            bench('forEach', () => {
                let sum = 0;
                array.forEach((value, i) => {
                    sum += value;
                    sum += i;
                    sum += value
                });
                return sum;
            });

            bench('self-made forEach', () => {
                let sum = 0;
                forEach(array, (value, i) => {
                    sum += value;
                    sum += i;
                    sum += value
                });
                return sum;
            });
        });
    });
});
