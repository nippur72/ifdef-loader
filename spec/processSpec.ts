/// <reference types="jasmine" />

import { parse } from "../preprocessor";

import fs = require('fs');

function removeCR(f: string): string {
   return f.split('\n').map(line=>line.split('\r').join('')).join('\n');
}

function read(fileName: string) {
   return fs.readFileSync(fileName).toString().replace(/\r\n/g, "\n");
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

   const files = [ "simple", "nested", "dfleury", "nested.else", "simple.doubleslash", "elif", "nested.elif", "earlyskip" ];

   const fileSet = files.map(fn => ({
      input:        `spec/data/${fn}.in.js`,
      output:       `spec/data/${fn}.out.js`,
      output_fwb:   `spec/data/${fn}.fwb.out.js`,
      actual:       `spec/data/${fn}.out.actual.js`,
      actualLF:     `spec/data/${fn}.out.actual.lf.js`,
      actual_fwb:   `spec/data/${fn}.fwb.out.actual.js`,
      actualLF_fwb: `spec/data/${fn}.fwb.out.actual.lf.js`
   }));

   function check_spec(fillWithBlanks) {
      const uncommentPrefix = "/// #code ";
      // checks spec files as terminating in CRLF (windows)
      fileSet.forEach( ({ input, output, output_fwb, actual, actual_fwb })=> {
         it(`works on ${input}`, ()=> {
            const tripleSlash = input.indexOf(".doubleslash.") == -1;
            const inFile = read(input);         
            const actualFile = parse(inFile, defs, false, tripleSlash, undefined, fillWithBlanks, uncommentPrefix);
            const expectedFile = read(fillWithBlanks ? output_fwb : output);            
            write(fillWithBlanks ? actual_fwb : actual, actualFile);
            expect(actualFile).toEqual(expectedFile);
         });
      });

      // checks spec files as terminating in LF only (unix)
      fileSet.forEach( ({ input, output, output_fwb, actualLF, actualLF_fwb })=> {
         it(`works on ${input}`, ()=> {
            const tripleSlash = input.indexOf(".doubleslash.") == -1;
            const inFile = removeCR(read(input));
            const actualFile = parse(inFile, defs, false, tripleSlash, undefined, fillWithBlanks, uncommentPrefix);
            const expectedFile = removeCR(read(fillWithBlanks ? output_fwb : output));            
            write(fillWithBlanks ? actualLF_fwb : actualLF, actualFile);
            expect(actualFile).toEqual(expectedFile);
         });
      });
   }

   check_spec(true);    // checks all specs with fillWithBlanks = true
   check_spec(false);   // checks all specs with fillWithBlanks = false
});

// the ".actual.js" files have to be built manually using webpack
// running with the option "fill-with-blanks" true and false

describe("webpack bundle", ()=>{
   const files = [ "webpack" ];

   describe("with option 'fill-with-blanks' false", ()=> {
      const fileSet = files.map(fn => ({
         input:    `spec/data/${fn}.in.js`,
         output:   `spec/data/${fn}.out.js`,
         actual:   `spec/data/${fn}.out.actual.js`
      }));

      // checks spec files as terminating in CRLF (windows)
      fileSet.forEach( ({ input, output, actual })=> {
         it(`build correctly on ${input}`, ()=> {
            const actualFile = read(actual);
            const expectedFile = read(output);
            expect(actualFile).toEqual(expectedFile);
         });
      });
   });

   describe("with option 'fill-with-blanks' true", ()=> {
      const fileSet = files.map(fn => ({
         input:    `spec/data/${fn}.in.js`,
         output:   `spec/data/${fn}.fwb.out.js`,
         actual:   `spec/data/${fn}.fwb.out.actual.js`
      }));

      // checks spec files as terminating in CRLF (windows)
      fileSet.forEach( ({ input, output, actual })=> {
         it(`build correctly on ${input}`, ()=> {
            const actualFile = read(actual);
            const expectedFile = read(output);
            expect(actualFile).toEqual(expectedFile);
         });
      });
   });
});
