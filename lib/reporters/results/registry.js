export function registerResults(Class, name) {
    registry[name] = Class;
}

export function getResults(name = '', DefaultClass) {
    return registry[name.toLowerCase()] ?? DefaultClass;
}

export function createResults(name, reporter, DefaultClass) {
    const ResultsClass = getResults(name, DefaultClass);
    return new ResultsClass(reporter);
}

const registry = {};
