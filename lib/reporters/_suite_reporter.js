const events = ['before', 'after', 'beforeEach', 'afterEach'];

class SuiteReporter {

  constructor( opts ) {
    this.opts = opts || {};
  }

  listen( suite ) {
    suite.setMaxListeners( 20 )
    let self = this;
    events.forEach( ( e ) => suite.on( e, self[e].bind( self, suite ) ) );
  }

  before( suite ) { }

  beforeEach( suite, bench ) { }

  afterEach( suite, bench ) { }

  after( suite ) { }

  print( str, level = 0 ) { }
}

export default SuiteReporter;
