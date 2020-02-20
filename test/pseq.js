import { deepEqual } from 'assert';
import pseq from '../lib/util/pseq';
import map from 'lodash/map';

describe('pseq', () => {
    const arr = [1, 2, 3, 4, 5];
    let res = [];

    beforeEach(() => {
        res = [];
    });

    it('exec promises in sequence', () => {
        return pseq(map(arr, x => () => Promise.resolve(res.push(x))))
            .then(() => deepEqual(res, arr));
    });

    it('wraps non promises', () => {
        return pseq(map(arr, x => () => res.push(x)))
            .then(() => deepEqual(res, arr));
    });
});
