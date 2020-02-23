# rebenchmark

[Benchmark.js](https://benchmarkjs.com) runner for [Node.js](https://nodejs.org) and browsers with BDD interface (like [Mocha](https://mochajs.org/)).

Based on @venkatperi's [bench-runner](https://github.com/venkatperi/bench-runner).

## Table of contents

1. [Getting Started](#1.%20Getting%20Started)
2. [Suites & Benchmarks](#2.%20Suites%20%26%20Benchmarks)

## 1. Getting Started

Install with `npm`:

```bash
npm install rebenchmark -g
mkdir benchmarks
$EDITOR benchmarks/string.js # open with your favorite editor
```

In your editor:

```js
suite('find in string', () => {
    bench('RegExp#test', () => /o/.test('Hello World!'));
    bench('String#indexOf', () => 'Hello World!'.indexOf('o') > -1);
    bench('String#match', () => !!'Hello World!'.match(/o/));
});
```

Back in the terminal:

```
$ rebenchmark -f fastest

[find in string]
  RegExp#test x 11,841,755 ops/sec ±3.00% (89 runs sampled)
  String#indexOf x 30,491,086 ops/sec ±0.45% (92 runs sampled)
  String#match x 8,287,739 ops/sec ±2.57% (88 runs sampled)
fastest: String#indexOf
```

## 2. Suites & Benchmarks

Group benchmarks in a suite:

```js
suite('group-of-tests', () => {
    bench('a-benchmark', ...);
    bench('yet-a-benchmark', ...);
});
```

### 2.1. Paths

Suites and benchmarks are assigned paths which are useful, for example, for filtering with the `grep` option. Paths are constructed by concatenating the names of suites and benchmarks leading to the target, separated with a colon `:`. In the above snippet, benchmark `a-benchmark` has the path `:group-of-tests:a-benchmark`.

### 2.2. Nested Suites & Benchmarks

Suites can be nested:

```js
suite('es5 vs es6', () => {
    suite('classes', () => {
        function ES5() { this.foo = 'bar'; }
        ES5.prototype.bar = function () { };

        class ES6 {
            constructor() { this.foo = 'bar'; }
            bar() { }
        }

        bench('es5', () => new ES5());
        bench('es6', () => new ES6());
    });

    suite('arrow functions', () => {
        var es5obj = {
            value: 42,
            fn: function () { return function () { return es5obj.value; }; }
        };
        var es5fn = es5obj.fn();

        var es6obj = {
            value: 42,
            fn: function () { return () => this.value; }
        };
        var es6fn = es6obj.fn();

        bench('es5', es5fn);
        bench('es6', es6fn);
    });
});
```

Output:

```
$ rebenchmark -g es5

[es5 vs es6]
  [arrow functions]
    es5 x 79,383,329 ops/sec ±0.95% (89 runs sampled)
    es6 x 80,249,618 ops/sec ±1.21% (83 runs sampled)
  [classes]
    es5 x 70,144,602 ops/sec ±0.41% (91 runs sampled)
    es6 x 36,864,672 ops/sec ±1.27% (87 runs sampled)
```

### 2.3. Benchmarking Asynchronous Functions

To defer a benchmark, pass an callback argument to the benchmark function. The callback must be called to end the benchmark.

```js
suite('deferred', () => {
    bench('timeout', (done) => setTimeout(done, 100));
});
```

Output:
```
[deferred]
  timeout x 9.72 ops/sec ±0.41% (49 runs sampled)
```

### 2.4. Dynamically Generating Benchmarks

Use javascript to generate benchmarks or suites dynamically:

```js
suite('buffer allocation', () => {
    for (let size = minSize; size <= maxSize; size *= 2) {
        bench(size, () => Buffer.allocUnsafe(size));
    }
})
```

The above code will produce a suite with multiple benchmarks:

```
[buffer allocation]
  1024 x 2,958,389 ops/sec ±2.85% (81 runs sampled)
  2048 x 1,138,591 ops/sec ±2.42% (52 runs sampled)
  4096 x 462,223 ops/sec ±2.48% (54 runs sampled)
  8192 x 324,956 ops/sec ±1.56% (44 runs sampled)
  16384 x 199,686 ops/sec ±0.94% (80 runs sampled)
```

## 3. Usage

### 3.1 CLI

```
rebenchmark [options] <benchmarks..>

Options:
  --include, -i           File pattern(s) to include                     [array]
  --exclude, -x           File pattern(s) to exclude                     [array]
  --grep, -g              Run only tests matching pattern(s)             [array]
  --dry, -d               Do a dry run without executing benchmarks    [boolean]
  --reporter, -R          Specify which reporter to use
                                                   [string] [default: "console"]
  --reporter-options, -O  Reporter-specific options (<k1=v1[,k2=v2,..]>) [array]
  --platform, -p          Print platform information                   [boolean]
  --filter, -f            Report filtered (e.g. fastest) benchmark after suite
                          runs     [choices: "fastest", "slowest", "successful"]
  --delay                 The delay between test cycles (secs)          [number]
  --init-count            The default number of times to execute a test on a
                          benchmark’s first cycle                       [number]
  --max-time              The maximum time a benchmark is allowed to run before
                          finishing (secs)                              [number]
  --min-samples           The minimum sample size required to perform
                          statistical analysis                          [number]
  --min-time              The time needed to reduce the percent uncertainty of
                          measurement to 1% (secs)                      [number]
  --config, -c            Path to JSON config file
  --help, -h              Show help                                    [boolean]
  --version, -v           Show version number                          [boolean]
```

By default, `rebenchmark` looks for `*.js` files under the `benchmarks/` subdirectory only. To configure where `rebenchmark` looks for tests, you may pass your own glob:

```
rebenchmark 'benches/**/*.{js,mjs}'
```

**-i, --include=`<regex>`**

Run benchmarks files with paths match the given regex, e.g.:

```
rebenchmark -i string
```

**-x, --exclude=`<regex>`**

Skip benchmarks files with paths match the given regex, e.g.:

```
rebenchmark -x deferred
```

**-g, --grep=`<regex>`**

The `--grep` option will trigger runner to only run tests whose paths match the given regex.

In the snippet below:
 * `rebenchmark -g es5` will match only `:compare:classes:es5` and `:compare:arrow functions:es5`
 * `rebenchmark -g arrow` will match `:compare:arrow functions:es5` and `:compare:arrow functions:es6`

```js
suite('compare', () => {
    suite('classes', () => {
        bench('es5', () => new ES5());
        bench('es6', () => new ES6());
    });

    suite('arrow functions', () => {
        bench('es5', es5fn);
        bench('es6', es6fn);
    });
});
```

**-d, --dry**

Enables dry-run mode which cycles through the suites and benchmarks selected by other settings such as `grep` without actually executing the benchmark code. This mode can be useful to verify the selection by a particular grep filter.

**-R, --reporter=`<name|url>`**

The `--reporter` option allows you to specify the reporter that will be used. Could be the name of one of the predefined printers (see [reporters](#Reporters) section), or the url of the module with default exported class that will be used as reporter.

**-O, --reporter-options=`<k1=v1[,k2=v2,..]>`**

Reporter-specific options, e.g.:

```
rebenchmark -R console -O indent=4
```

**--delay, --max-time, --min-samples, --min-time**

These options are passed directly to `benchmark.js`.

**-c, --config=`<path>`**

You can save frequently used sets of options to the JSON file and use it when starting the runner:

```
rebenchmark -c rebenchmark.config.json
```

rebenchmark.config.json:

```json
{
    "benchmarks": [
        "benches/**/*.js"
    ],
    "platform": true,
    "filter": "fastest",
    "reporter": "console",
    "reporterOptions": {
        "indent": 4
    }
}
```

### Node.js

```js
import { suite, bench, run, resetOptions, reporters } from 'rebenchmark';

resetOptions({
    reporter: new reporters.ConsoleReporter({ indent: 4 }),
    platform: true,
    filter: 'fastest'
});

suite('find in string', () => {
    bench('RegExp#test', () => /o/.test('Hello World!'));
    bench('String#indexOf', () => 'Hello World!'.indexOf('o') > -1);
    bench('String#match', () => !!'Hello World!'.match(/o/));
});

run().then(() => {
    console.log('All done!');
});
```

### Browsers

Automatic setup (default):

```html
<!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rebenchmark</title>
    <!-- Benchmark.js dependencies are not included, therefore must be provided manually -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.15/lodash.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/platform/1.3.5/platform.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/benchmark/2.1.4/benchmark.min.js"></script>
</head>

<body>
    <!-- The output is printed to the element with the identifier 'rebenchmark', if any, and duplicated to the console -->
    <pre id="rebenchmark"></pre> 

    <!-- Options can be passed using data-attributes -->
    <script src="https://unpkg.com/rebenchmark/umd/stage/browser/rebenchmark.min.js" data-filter="fastest"
        data-platform="true"></script> 
    <script src="benchmarks/es5_vs_es6.js"></script>
    <script>
        suite('find in string', () => {
            bench('RegExp#test', () => /o/.test('Hello World!'));
            bench('String#indexOf', () => 'Hello World!'.indexOf('o') > -1);
            bench('String#match', () => !!'Hello World!'.match(/o/));
        });
    </script>
</body>

</html>
```

Manual setup:
```html
<!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rebenchmark</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.15/lodash.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/platform/1.3.5/platform.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/benchmark/2.1.4/benchmark.min.js"></script>
</head>

<body>
    <pre id="rebenchmark"></pre> 

    <!-- To disable automatic setup, set "data-no-auto-setup" to "true" -->
    <script src="https://unpkg.com/rebenchmark/umd/stage/browser/rebenchmark.min.js" data-no-auto-setup="true"></script> 
    <script>
        rebenchmark.setup({
            reporter: new rebenchmark.reporters.HTMLReporter({ root: document.querySelector('#rebenchmark') }),
            platform: true,
            filter: 'fastest'
        });
    </script>
    <script src="benchmarks/es5_vs_es6.js"></script>
    <script>
        suite('find in string', () => {
            bench('RegExp#test', () => /o/.test('Hello World!'));
            bench('String#indexOf', () => 'Hello World!'.indexOf('o') > -1);
            bench('String#match', () => !!'Hello World!'.match(/o/));
        });
    </script>
    <script>
        rebenchmark.run().then(() => {
            console.log('All done!');
        });
    </script>
</body>

</html>
```

## Hooks

Hooks must be synchronous since they are called by `benchmark.js` which does not support async hooks at this time. Also, `setup` and `teardown` are compiled into the test function. Including either may place restrictions on the scoping/availability of variables in the test function (see `benchmark.js` [docs](https://benchmarkjs.com/docs) for more information).

## Reporters

### console

The default reporter. Pretty prints results via `console.log`. Accepts `indent` option (the number of spaces) used to insert white space into the output for readability purposes.

### json

Outputs a single large JSON object when the tests have completed. Accepts `indent` option like mentioned above.

### html

Prints results into element, provided by the `root` option (could be element by itself or string with CSS-selector), and duplicates output to the console. To suppress console output, set `echo` option to `false`. Accepts `indent` option like mentioned above. Intended for use only on browsers.

### null

Discards all output.
