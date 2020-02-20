import { each, isNaN, isObject, isError, assign } from 'lodash';

function join(object, separator1, separator2) {
    var result = [],
        length = (object = Object(object)).length,
        arrayLike = length === length >>> 0;

    separator2 || (separator2 = ': ');
    each(object, function (value, key) {
        result.push(arrayLike ? value : key + separator2 + value);
    });
    return result.join(separator1 || ',');
}

function toStringBench(bench) {
    var error = bench.error,
        hz = bench.hz,
        id = bench.id,
        stats = bench.stats,
        size = stats.sample.length,
        pm = '\xb1',
        result = bench.name || (isNaN(id) ? id : '<Test #' + id + '>');

    if (error) {
        let errorStr;
        if (!isObject(error)) {
            errorStr = String(error);
        } else if (!isError(Error)) {
            errorStr = join(error);
        } else {
            // Error#name and Error#message properties are non-enumerable.
            errorStr = join(assign({ 'name': error.name, 'message': error.message }, error));
        }
        result += ': ' + errorStr;
    }
    else {
        result += ' x ' + formatNumber(hz.toFixed(hz < 100 ? 2 : 0)) + ' ops/sec ' + pm +
            stats.rme.toFixed(2) + '% (' + size + ' run' + (size === 1 ? '' : 's') + ' sampled)';
    }
    return result;
}
