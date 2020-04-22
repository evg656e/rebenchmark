import { FilterResults } from './FilterResults';
import { TableResults } from './TableResults';
import { registerResults } from './registry';

registerResults(FilterResults, 'filter');
registerResults(TableResults, 'table');
