import { getOptions } from 'loader-utils';
import { parse } from './preprocessor';

export = function(source: string, map) {
   this.cacheable && this.cacheable();
   // ?json=... contains JSON encoded data object
   const options = getOptions(this);
   const data = options.json || options;

   const verboseFlag = "ifdef-verbose";
   const verbose = data[verboseFlag];
   if(verbose !== undefined) {
      delete data[verboseFlag];
   }

   const tripleSlashFlag = "ifdef-triple-slash";
   const tripleSlash = data[tripleSlashFlag];
   if(tripleSlash !== undefined) {
      delete data[tripleSlashFlag];
   }

   try {
      source = parse(source, data, verbose, tripleSlash);
      this.callback(null, source, map);
   }
   catch(err) {
      const errorMessage = `ifdef-loader error: ${err}`;
      this.callback(new Error(errorMessage));
   }
};
