rebenchmark.setup({
    platform: true,
    reporter: 'html',
    reporterOptions: 'root=#rebenchmark,results',
    ...document?.currentScript?.dataset
});

window.addEventListener('load', () => {
    rebenchmark.run();
});
