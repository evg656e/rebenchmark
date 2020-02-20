suite('deferred', () => {
    bench('timeout', (done) => {
        console.log('asd');
        setTimeout(done, 100);
    });
});
