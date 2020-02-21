export default (err, suite, bench) => {
    if (err.suite) {
        bench = err.bench;
        suite = err.suite;
        err = err.error;
    }

    let name = [];
    if (suite) {
        name.push(suite.path);
    }
    if (bench) {
        name.push(bench.name);
    }
    name = name.join(':');

    if (!name.length || !globalOpts || typeof globalOpts.grep !== 'function' || globalOpts.grep(name)) {
        if (name.length) {
            console.error(`Error in ${name}`);
        }
        console.error(err);
    }
}
