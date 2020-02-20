import platform from 'platform';
import builder from './builder';
import { load } from './reporters';
import { pathToFileURL } from 'url';

export default ( opts ) => {
  return new Promise( ( resolve, reject ) => {
    globalOpts = opts;

    load( opts.reporter || 'console' ).then(({ default: ReporterClass }) => {
      reporter = new ReporterClass( opts )

      if ( opts.platform ) {
        reporter.print( platform );
      }
  
      let files = opts.files;
  
      function next() {
        let f = files.shift();
        if ( f ) {
          console.log(f);
          return import( pathToFileURL(f) ).catch(reject);
        }
        resolve();
      }
  
      builder.on( 'end', () => process.nextTick( () => next() ) );
  
      next();
    }).catch(reject);

  } );
};