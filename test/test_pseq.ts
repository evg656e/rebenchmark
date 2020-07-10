import { deepEqual } from 'assert';
import { pseq } from '../lib/core/util/pseq';

describe('pseq', () => {
    const arr = [1, 2, 3, 4, 5];
    let res: number[] = [];

    beforeEach(() => {
        res = [];
    });

    it('exec promises in sequence', () => {
        return pseq(arr.map(x => () => Promise.resolve(res.push(x))))
            .then(() => deepEqual(res, arr));
    });

    it('wraps non promises', () => {
        return pseq(arr.map(x => () => res.push(x)))
            .then(() => deepEqual(res, arr));
    });
});
