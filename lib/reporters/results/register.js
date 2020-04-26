import { FilterResults } from './FilterResults.js';
import { TableResults } from './TableResults.js';
import { registerResults } from './registry.js';

registerResults(FilterResults, 'filter');
registerResults(TableResults, 'table');
