import { suite, bench, run, resetOptions, reporters } from '../index';

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
