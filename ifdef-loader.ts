import path = require('path');
import url = require('url');
import queryString = require('querystring');

import { parse } from "./preprocessor";

export = function(source: string, map) {
   this.cacheable && this.cacheable();
   // ?json=... contains JSON encoded data object
   const query = queryString.parse(url.parse(this.query).query);
   const data = JSON.parse(query.json);

   const verboseFlag = "ifdef-verbose";
   const verbose = data[verboseFlag];
   if(verbose) {
      delete data[verboseFlag];
   }

   try
   {
      source = parse(source, data, verbose);
      this.callback(null, source, map);
   }
   catch(err)
   {
      const errorMessage = `ifdef-loader error: ${err}`;
      console.log(errorMessage);
      this.callback(errorMessage);
   }
};

