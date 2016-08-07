/// <reference types="jasmine" />

import { parse } from "../preprocessor";

import fs = require('fs');

function removeNewLine(f: string): string {
   return f.split('\n').map(line=>line.split('\r').join('')).join('\n');
}

function read(fileName: string) {
   return removeNewLine(fs.readFileSync(fileName).toString());
}

function write(fileName: string, data: string) {
   return fs.writeFileSync(fileName, data);
}

const defs = {
   DEBUG: true,
   production: false,
   version: 3.5,
   OS: "android"
};

describe("files spec", ()=> {

   const files = [ "simple", "nested" ];

   const fileSet = files.map(fn => ({
      input: `spec/data/${fn}.in.js`,
      output: `spec/data/${fn}.out.js`,
      actual: `spec/data/${fn}.out.actual.js`
   }));

   fileSet.forEach( ({ input, output, actual })=> {
      it(`works on ${input}`, ()=> {
         const inFile = read(input);
         const actualFile = parse(inFile, defs);
         const expectedFile = read(output);
         write(actual, actualFile);
         expect(actualFile).toEqual(expectedFile);
      });
   });

});

