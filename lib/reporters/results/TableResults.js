import Benchmark from 'benchmark';
import { RenderedStyledTable } from 'styled-cli-table/module/precomposed/RenderedStyledTable';
import { single, border } from 'styled-cli-table/module/styles/border';
import { BaseResults } from './BaseResults';
import { setDefault } from '../../util/setDefault';
import { has } from '../../util/has';

export class TableResults extends BaseResults {
    constructor(reporter) {
        super(reporter);
        this.groupedResults = {};
        this.format = coerceFormat(reporter.options.format, Format.short);
    }

    after(suite) {
        if (suite.length !== 0) {
            this.groupResults(suite);
        }
        if (suite.isRoot) {
            this.printResults(suite);
        }
    }

    groupResults(suite) {
        const benches = suite.filter('successful');
        const fastest = suite.filter('fastest');

        benches.forEach((bench) => {
            const fastestHz = getHz(fastest[0]);
            const hz = getHz(bench);
            const percent = ((percent) => {
                if (fastest.indexOf(bench) !== -1)
                    return 'fastest';
                if (isFinite(hz))
                    return `${Benchmark.formatNumber(percent < 1 ? percent.toFixed(2) : Math.round(percent))}% slower`;
                return '';
            })((1 - (hz / fastestHz)) * 100);
            setDefault(this.groupedResults, bench.name, {})[suite.name] = this.formatResult(bench, percent);
        });
    }

    formatResult(bench, percent) {
        switch (this.format) {
            case Format.short: return percent;
            case Format.full: {
                const { hz, stats } = bench;
                return [
                    `${Benchmark.formatNumber(hz.toFixed(hz < 100 ? 2 : 0))} ops/sec`,
                    `\xb1${stats.rme.toFixed(2)}%`,
                    percent
                ];
            }
        }
    }

    getStyles() {
        switch (this.format) {
            case Format.short: return shortStyles;
            case Format.full: return fullStyles;
        }
    }

    printResults(suite) {
        const level = suite.level;
        const table = new RenderedStyledTable(flattenGroupedResults(this.groupedResults), this.getStyles());
        for (const line of table.render()) {
            this.reporter.print(line, level);
        }
        this.groupedResults = {};
    }
}

function getHz(bench) {
    return 1 / (bench.stats.mean + bench.stats.moe);
}

const Format = Object.fromEntries(['short', 'full'].map(name => [name, name]));

function coerceFormat(name = '', defaultName) {
    name = name.toLowerCase();
    if (has(Format, name))
        return name;
    return defaultName;
}

function flattenGroupedResults(results) {
    const keys = Object.keys(results);
    const index = {};
    let indexLength = 0;

    for (const key of keys) {
        for (const innerKey of Object.keys(results[key])) {
            setDefault(index, innerKey, () => ++indexLength);
        }
    }

    const n = indexLength + 1;
    const headerRow = new Array(n);
    for (const innerKey of Object.keys(index)) {
        headerRow[index[innerKey]] = innerKey;
    }

    const m = keys.length + 1;
    const ret = new Array(m);
    ret[0] = headerRow;
    let i = 1;
    for (const key of keys) {
        const dataRow = new Array(n);
        dataRow[0] = key;
        const values = results[key];
        for (const innerKey of Object.keys(values)) {
            dataRow[index[innerKey]] = values[innerKey];
        }
        ret[i++] = dataRow;
    }

    return ret;
}

const commonStyles = {
    borderCharacters: single,
    paddingLeft: 1, paddingRight: 1,
    align: 'center',
    cells({ value, rowIndex }) {
        return {
            content: value === undefined ?
                (rowIndex === 0 ? '(bench)' : '') :
                value
        };
    }
};

const shortStyles = {
    ...commonStyles,
    rows: {
        0: {
            borderTop: true, borderBottom: true
        },
        [-1]: {
            borderBottom: true
        }
    },
    columns() {
        return {
            borderLeft: true, borderRight: true
        };
    }
};

const fullStyles = {
    ...commonStyles,
    ...border(true),
    verticalAlign: 'middle',
    height: 3
};
