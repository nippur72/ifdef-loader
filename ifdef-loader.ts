import * as loaderUtils from 'loader-utils';
import { parse } from './preprocessor';
import * as path from 'path';

export = function(source: string, map) {
   this.cacheable && this.cacheable();

   const options: loaderUtils.OptionObject = loaderUtils.getOptions(this);
   const originalData = options.json || options;

   const data = { ...originalData };

   const verboseFlag = "ifdef-verbose";
   const verbose = data[verboseFlag];
   if(verbose !== undefined) {
      delete data[verboseFlag];
   }

   let filePath: string | undefined = undefined;
   if(verbose) {
      filePath = path.relative(this.rootContext, this.resourcePath);
   }

   const tripleSlashFlag = "ifdef-triple-slash";
   const tripleSlash = data[tripleSlashFlag];
   if(tripleSlash !== undefined) {
      delete data[tripleSlashFlag];
   }

   try {
      source = parse(source, data, verbose, tripleSlash, filePath);
      this.callback(null, source, map);
   } catch(err) {
      const errorMessage = `ifdef-loader error: ${err}`;
      this.callback(new Error(errorMessage));
   }
};
