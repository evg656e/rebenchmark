import { readdir } from 'fs';
import endsWith from 'lodash/endsWith';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function list() {
  return new Promise( ( resolve, reject ) => {
    readdir( __dirname, ( err, list ) => {
      if ( err ) {
        return reject( err )
      }
      resolve( list
          .filter( ( x ) => (x[0] !== '_') && endsWith( x, '.js' ) )
          .map( ( x ) => x.split( '_' )[0] ) );
    } );
  } );
}

export function load( name ) {
  return import( `./${name}_reporter` ).catch(() =>  import(name));
}
