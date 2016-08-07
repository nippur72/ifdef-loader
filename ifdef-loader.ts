import path = require('path');
import url = require('url');
import queryString = require('querystring');

import { parse } from "./preprocessor";

export = function(source: string, map) {
   this.cacheable && this.cacheable();
   const query = queryString.parse(url.parse(this.query).query);

   try
   {
      source = parse(source, query);
      this.callback(null, source, map);
   }
   catch(err)
   {
      const errorMessage = `ifdef-loader error: ${err}`;
      console.log(errorMessage);
      this.callback(errorMessage);
   }
};

