import { BaseResults } from './BaseResults.js';

export class FilterResults extends BaseResults {
    after(suite) {
        if (suite.length !== 0) {
            const filter = this.reporter.options.filter ?? 'fastest';
            this.reporter.print(filter + ': ' + suite.filter(filter).map('name'), suite.level);
        }
    }
}
