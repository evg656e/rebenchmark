import Benchmark from 'benchmark';
import { RenderedStyledTable } from 'styled-cli-table/module/precomposed/RenderedStyledTable';
import { single, border } from 'styled-cli-table/module/styles/border';
import { setDefault } from '../../util/object/setDefault';
import { has } from '../../util/object/has';
import { BaseResultsHandler } from './BaseResultsHandler';
import { NullResultsHandler } from './NullResultsHandler';
import type { TopLevelStyles } from 'styled-cli-table/module/styledtable/StyledTable';
import type { Suite } from '../../Suite';
import type ConsoleReporter from '../ConsoleReporter';

type Results = string | string[];

type GroupedResults = {
    [benchName: string]: {
        [suiteName: string]: Results;
    }
};

export class ConsoleResultsHandler extends BaseResultsHandler<ConsoleReporter> {
    format: string;
    groupedResults: GroupedResults;

    constructor(reporter: ConsoleReporter, format: string) {
        super(reporter);
        this.format = format;
        this.groupedResults = {};
    }

    after(suite: Suite) {
        if (suite.length !== 0) {
            this.groupResults(suite);
        }
        if (suite.isRoot) {
            this.printResults(suite);
        }
    }

    groupResults(suite: Suite) {
        const benches = suite.filter('successful');
        const fastest = suite.filter('fastest');

        benches.forEach((bench: Benchmark & { name: string }) => { //! tofix: Benchmark should have name prop
            const fastestHz = getHz(fastest[0]);
            const hz = getHz(bench);
            const percent = ((percent) => {
                if (fastest.indexOf(bench) !== -1)
                    return 'fastest';
                if (isFinite(hz))
                    return `${Benchmark.formatNumber(<any>(percent < 1 ? percent.toFixed(2) : Math.round(percent)))}% slower`; //! tofix: Benchmark.formatNumber should allow string type
                return '';
            })((1 - (hz / fastestHz)) * 100);
            setDefault(this.groupedResults, bench.name, {} as { [suiteName: string]: any })[suite.name] = this.formatResult(bench, percent);
        });
    }

    formatResult(bench: Benchmark, percent: string) {
        switch (this.format) {
            case Format.short: default: return percent;
            case Format.full: {
                const { hz, stats } = bench;
                return [
                    `${Benchmark.formatNumber(<any>(hz.toFixed(hz < 100 ? 2 : 0)))} ops/sec`,
                    `\xb1${stats.rme.toFixed(2)}%`,
                    percent
                ];
            }
        }
    }

    getStyles() {
        switch (this.format) {
            case Format.short: default: return shortStyles;
            case Format.full: return fullStyles;
        }
    }

    printResults(suite: Suite) {
        const level = suite.level;
        const table = new RenderedStyledTable(flattenGroupedResults(this.groupedResults), this.getStyles());
        for (const line of table.render()) {
            this.reporter.print(line, level);
        }
        this.groupedResults = {};
    }

    static create(reporter: ConsoleReporter) {
        if (reporter.options.results) {
            return new ConsoleResultsHandler(reporter, coerceFormat(reporter.options.format));
        }
        return NullResultsHandler.instance;
    }
}

function getHz(bench: Benchmark) {
    return 1 / (bench.stats.mean + bench.stats.moe);
}

const Format = Object.fromEntries(['short', 'full'].map(name => [name, name]));

function coerceFormat(name = '') {
    name = name.toLowerCase();
    if (has(Format, name))
        return name;
    return Format.short;
}

function flattenGroupedResults(results: GroupedResults) {
    const benchNames = Object.keys(results);
    const index: { [suiteName: string]: number } = {};
    let indexLength = 0;

    for (const benchName of benchNames) {
        for (const suiteName of Object.keys(results[benchName])) {
            setDefault(index, suiteName, () => ++indexLength);
        }
    }

    const n = indexLength + 1;
    const headerRow: string[] = new Array(n);
    for (const suiteName of Object.keys(index)) {
        headerRow[index[suiteName]] = suiteName;
    }

    const m = benchNames.length + 1;
    const data: Results[][] = new Array(m);
    data[0] = headerRow;
    let i = 1;
    for (const benchName of benchNames) {
        const dataRow: Results[] = new Array(n);
        dataRow[0] = benchName;
        const suiteResults = results[benchName];
        for (const suiteName of Object.keys(suiteResults)) {
            dataRow[index[suiteName]] = suiteResults[suiteName];
        }
        data[i++] = dataRow;
    }

    return data;
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
} as TopLevelStyles;

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
