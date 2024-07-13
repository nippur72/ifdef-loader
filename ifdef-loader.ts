import * as loaderUtils from 'loader-utils';
import { parse } from './preprocessor';
import * as path from 'path';

export = function(source: string, map) {
   this.cacheable && this.cacheable();

   const options: loaderUtils.OptionObject = this.getOptions() || {};
   const originalData = options.json || options;

   let data = {};
   if (typeof originalData === 'object' && originalData !== null) {
      data = { ...originalData };
   } else if (typeof originalData === 'string') {
         data = { originalData };
   } else if (originalData === true) {
      data = { originalData: true };
   }

   const verboseFlag = "ifdef-verbose";
   const verbose = data[verboseFlag];
   if(verbose !== undefined) {
      delete data[verboseFlag];
   }

   let filePath: string | undefined = undefined;
   if(verbose) {
      filePath = path.relative(this.rootContext || '', this.resourcePath);
   }

   const tripleSlashFlag = "ifdef-triple-slash";
   const tripleSlash = data[tripleSlashFlag];
   if(tripleSlash !== undefined) {
      delete data[tripleSlashFlag];
   }

   const fillWithBlanksFlag = "ifdef-fill-with-blanks";
   const fillWithBlanks = data[fillWithBlanksFlag];
   if(fillWithBlanks !== undefined) {
      delete data[fillWithBlanksFlag];
   }

   const uncommentPrefixFlag = "ifdef-uncomment-prefix";
   const uncommentPrefix = data[uncommentPrefixFlag];
   if(uncommentPrefix !== undefined) {
      delete data[uncommentPrefixFlag];
   }

   try {
      source = parse(source, data, verbose, tripleSlash, filePath, fillWithBlanks, uncommentPrefix);
      this.callback(null, source, map);
   } catch(err) {
      const errorMessage = `ifdef-loader error: ${err}`;
      this.callback(new Error(errorMessage));
   }
};
