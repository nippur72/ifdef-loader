/*
 * This file is used to test ifdef-loader on a real webpack environment.
 * It reads "spec/data/webpack.in.js" and outputs "spec/data/webpack.out.actual.js" 
 * which is later compared with "spec/data/webpack.out.js"
 * 
 */

const opts = {
   DEBUG: true,
   version: 3,
   "ifdef-verbose": true,            // add this for verbose output
   "ifdef-triple-slash": true,       // add this to use double slash comment instead of default triple slash
   "ifdef-fill-with-blanks": true    // add this to remove code with blank spaces instead of "//" comments 
};

// if using query strings
const q = require('querystring').encode(opts);

/************************************************************/

const webpack = require('webpack');

module.exports = function(env)
{   
   const entry = "./spec/data/webpack.in.js";

   const loaders = [{ 
      test: /\.in(\.module)?\.js$/, 
      exclude: /node_modules/, 
      use: [{ 
         loader: `${__dirname}/ifdef-loader`,
         options: opts 
      }]
      // alternate: 
      // loader: `${__dirname}/ifdef-loader?${q}`,
   }];
      
   let config =
   {
       module: { rules: loaders },
       entry: entry,
       cache: true,

       output: {
           libraryTarget: "this",
           path: `${__dirname}/spec/data`,
           filename: opts["ifdef-fill-with-blanks"] ? "webpack.fwb.out.actual.js" : "webpack.out.actual.js",
       }       
   };

   return config;
};

