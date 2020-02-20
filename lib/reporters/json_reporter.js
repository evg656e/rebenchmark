import { forOwn, extend } from 'lodash';
import SuiteReporter from './_suite_reporter';

function gen( suite ) {
  if ( suite.hasBenchmarks ) {
    let res = {};
    suite.children.forEach( ( c ) => res[c.name] = gen( c ) );
    forOwn( suite.results, ( v, k ) => res[k] = v );
    return res;
  }
}

class JSONReporter extends SuiteReporter {

  constructor( opts ) {
    super( opts );
    this.opts = extend( {}, {indent : 2}, opts );
  }

  before( suite ) {
  }

  after( suite ) {
    if ( suite.isRoot && suite.hasBenchmarks ) {
      let res = {};
      res[suite.name] = gen( suite )
      console.log( JSON.stringify( res, null, this.opts.indent ) );
    }
  }

}

export default JSONReporter;
