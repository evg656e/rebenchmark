# rebenchmark

[![npm](https://img.shields.io/npm/v/rebenchmark.svg)](https://www.npmjs.com/package/rebenchmark)

[Benchmark.js](https://benchmarkjs.com) runner for [Node.js](https://nodejs.org) and browsers with BDD interface (like [Mocha](https://mochajs.org/)).

[Online Playground](https://jsfiddle.net/evg656e/hz4co8x3/)

Based on @venkatperi's [bench-runner](https://github.com/venkatperi/bench-runner).

## Table of contents

* [Getting Started](#Getting%20Started)
* [Suites & Benchmarks](#2Suites%20%26%20Benchmarks)
  * [Paths](#Paths)
  * [Nested Suites & Benchmarks](#Nested%20Suites%20%26%20Benchmarks)
  * [Benchmarking Asynchronous Functions](#Benchmarking%20Asynchronous%20Functions)
  * [Dynamically Generating Benchmarks](#Dynamically%20Generating%20Benchmarks)
 * [Usage](#Usage)
   * [CLI](#CLI)
   * [Node.js](#Node.js)
   * [Browsers](#Browsers)
* [Hooks](#Hooks)
* [Reporters](#Reporters)
  * [console](#console)
  * [json](#json)
  * [html](#html)
  * [null](#null)

## Getting Started

Install with `npm`:

```console
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

```console
$ rebenchmark -O results=table

[find in string]
  RegExp#test x 37,304,988 ops/sec ±1.81% (88 runs sampled)
  String#indexOf x 873,212,283 ops/sec ±1.68% (89 runs sampled)
  String#match x 17,030,626 ops/sec ±1.25% (85 runs sampled)
┌────────────────┬────────────────┐
│    (bench)     │ find in string │
├────────────────┼────────────────┤
│  RegExp#test   │   96% slower   │
│ String#indexOf │    fastest     │
│  String#match  │   98% slower   │
└────────────────┴────────────────┘
```

## Suites & Benchmarks

Group benchmarks in a suite:

```js
suite('group-of-tests', () => {
    bench('a-benchmark', ...);
    bench('yet-a-benchmark', ...);
});
```

### Paths

Suites and benchmarks are assigned paths which are useful, for example, for filtering with the `grep` option. Paths are constructed by concatenating the names of suites and benchmarks leading to the target, separated with a colon `:`. In the above snippet, benchmark `a-benchmark` has the path `:group-of-tests:a-benchmark`.

### Nested Suites & Benchmarks

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
        const es5obj = {
            value: 42,
            fn() { return function () { return es5obj.value; }; }
        };
        const es5fn = es5obj.fn();

        const es6obj = {
            value: 42,
            fn() { return () => this.value; }
        };
        const es6fn = es6obj.fn();

        bench('es5', es5fn);
        bench('es6', es6fn);
    });
});
```

Output:

```console
$ rebenchmark -pO results=table

Node.js 13.13.0 on Win32 64-bit
[es5 vs es6]
  [arrow functions]
    es5 x 957,326,571 ops/sec ±1.53% (94 runs sampled)
    es6 x 957,566,235 ops/sec ±1.40% (93 runs sampled)
  [classes]
    es5 x 932,924,301 ops/sec ±1.26% (92 runs sampled)
    es6 x 896,497,968 ops/sec ±2.84% (91 runs sampled)
  [generator]
    es5 x 15,930,495 ops/sec ±1.70% (89 runs sampled)
    es6 x 16,374,339 ops/sec ±1.90% (89 runs sampled)
┌─────────┬─────────────────┬───────────┬───────────┐
│ (bench) │ arrow functions │  classes  │ generator │
├─────────┼─────────────────┼───────────┼───────────┤
│   es5   │    2% slower    │  fastest  │ 3% slower │
│   es6   │     fastest     │ 2% slower │  fastest  │
└─────────┴─────────────────┴───────────┴───────────┘
```

### Benchmarking Asynchronous Functions

To defer a benchmark, pass an callback argument to the benchmark function. The callback must be called to end the benchmark.

```js
suite('deferred', () => {
    bench('timeout', (done) => setTimeout(done, 100));
});
```

Output:
```console
[deferred]
  timeout x 9.72 ops/sec ±0.41% (49 runs sampled)
```

### Dynamically Generating Benchmarks

Use javascript to generate benchmarks or suites dynamically:

```js
suite('buffer allocation', () => {
    for (let size = minSize; size <= maxSize; size *= 2) {
        bench(size, () => Buffer.allocUnsafe(size));
    }
})
```

The above code will produce a suite with multiple benchmarks:

```console
[buffer allocation]
  1024 x 2,958,389 ops/sec ±2.85% (81 runs sampled)
  2048 x 1,138,591 ops/sec ±2.42% (52 runs sampled)
  4096 x 462,223 ops/sec ±2.48% (54 runs sampled)
  8192 x 324,956 ops/sec ±1.56% (44 runs sampled)
  16384 x 199,686 ops/sec ±0.94% (80 runs sampled)
```

## Usage

### CLI

```console
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

```console
rebenchmark 'benches/**/*.{js,mjs}'
```

**-i, --include=`<regex>`**

Run benchmarks files with paths match the given regex, e.g.:

```console
rebenchmark -i string
```

**-x, --exclude=`<regex>`**

Skip benchmarks files with paths match the given regex, e.g.:

```console
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

```console
rebenchmark -R console -O indent=4,results=table,format=full
```

**--delay, --init-count, --max-time, --min-samples, --min-time**

These options are passed directly to `benchmark.js`.

**-c, --config=`<path>`**

You can save frequently used sets of options to the JSON file and use it when starting the runner:

```console
rebenchmark -c rebenchmark.config.json
```

rebenchmark.config.json:

```json
{
    "benchmarks": [
        "benches/**/*.js"
    ],
    "platform": true,
    "reporter": "console",
    "reporterOptions": {
        "indent": 4,
        "results": "table",
        "format": "full"
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
    <script src="https://unpkg.com/rebenchmark/stage/browser/rebenchmark.min.js" data-platform="true"></script>
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
    <script src="https://unpkg.com/rebenchmark/stage/browser/rebenchmark.min.js" data-no-auto-setup="true"></script>
    <script>
        rebenchmark.setup({
            reporter: new rebenchmark.reporters.HTMLReporter({
                root: document.querySelector('#rebenchmark'),
                results: 'table'
            }),
            platform: true
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

### Legacy browsers support

At the moment, the main entry point is compiling using ES2015. If you need support for older browsers, use `rebenchmark-legacy.js` or `rebenchmark-legacy.min.js`, e.g.:
```html
<script src="https://unpkg.com/rebenchmark/stage/browser/rebenchmark-legacy.min.js"></script>
```

## Hooks

Hooks must be synchronous since they are called by `benchmark.js` which does not support async hooks at this time. Also, `setup` and `teardown` are compiled into the test function. Including either may place restrictions on the scoping/availability of variables in the test function (see `benchmark.js` [docs](https://benchmarkjs.com/docs) for more information).

```js
suite('hooks', function () {
    before(function () {
        // runs before all tests in this suite
    });

    after(function () {
        // runs after all tests in this suite
    });

    beforeEach(function () {
        // runs before each benchmark test function in this suite
    });

    afterEach(function () {
        // runs after each benchmark test function in this suite
    });

    bench('name', {
        setup() {
            // setup is compiled into the test function and runs before each cycle of the test
        }
    })

    bench('name', {
        teardown() {
            // teardown is compiled into the test function and runs after each cycle of the test
        }
    }, testFn)

    // benchmarks here...
});
```

## Reporters

### console

The default reporter. Pretty prints results via `console.log`.

Options:
  * `indent` - number of spaces used to insert white space into the output for readability purposes
  * `results` - print benchmark results. The possible values are `table`, which displays the results in a table form, or `filter`, which displays single line with the filtered results.

  You can specify `format` option for `table` results, choices: `full`, `short` (default).
  You can specify `filter` option option for `filter` results, choices: `fastest` (default), `slowest`, `successful`.

Examples:
```console
rebenchmark -O results=table
rebenchmark -O results=table,format=full
rebenchmark -O results=filter,filter=fastest
```

### json

Outputs a single large JSON object when the tests have completed.

Options:
  * `indent` - number of spaces used to insert white space into the output for readability purposes.

### html

Prints results into HTML element. Intended for use only on browsers.

Options:
  * `root` - CSS-selector or HTML-element by itself where to print results
  * `echo` - whether to duplicate output to console (`true` by default)

And all options inherited from [console](#console) reporter.

### null

Discards all output.
