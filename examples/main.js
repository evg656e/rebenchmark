import { suite, bench, run, resetOptions, reporters } from '../module/node/index.js';

resetOptions({
    reporter: new reporters.ConsoleReporter({ indent: 4, results: true }),
    platform: true
});

suite('find in string', () => {
    bench('RegExp#test', () => /o/.test('Hello World!'));
    bench('String#indexOf', () => 'Hello World!'.indexOf('o') > -1);
    bench('String#match', () => !!'Hello World!'.match(/o/));
});

run().then(() => {
    console.log('All done!');
});
