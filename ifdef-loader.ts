import path = require('path');
import url = require('url');
import queryString = require('querystring');

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

function parse(source, defs): string {
   const lines = source.split('\n');

   for(let n=0;;) {
      let startInfo = find_start_if(lines,n);
      if(startInfo === undefined) break;

      const end = find_end(lines, startInfo.line, startInfo.indent);
      if(end === undefined) {
         throw `#if without #endif in line ${startInfo.line+1}`;
      }

      const blank = evaluate(startInfo.condition, startInfo.keyword, defs);

      if(blank) {
         blank_code(lines, startInfo.line, end.line);
         console.log(`matched condition #${startInfo.keyword} ${startInfo.condition} => excluded lines [${startInfo.line+1}-${end.line+1}]`);
      }
      else {
         console.log(`unmatched condition #${startInfo.keyword} ${startInfo.condition}`);
         blank_code(lines, startInfo.line, startInfo.line);
         blank_code(lines, end.line, end.line);
      }

      n = startInfo.line;
   }

   return lines.join('\n');
}

interface IStart {
   line: number;
   indent: number;
   keyword: string;
   condition: string;
}

interface IEnd {
   line: number;
   keyword: string;
}

function find_start_if(lines: string[], n: number): IStart|undefined {
   const re = /^\/\/([\s]*)#(if)([\s\S]*)$/g;
   for(let t=n; t<lines.length; t++) {
      const match = re.exec(lines[t]);
      if(match) {
         //console.log(`match start at line ${t}`);
         return {
            line: t,
            indent: match[1].length,
            keyword: match[2],
            condition: match[3].trim()
         };
      }
   }
   return undefined;
}

function find_end(lines: string[], start: number, wantedIndent: number): IEnd | undefined {
   const re = /^\/\/([\s]*)#(endif)[\s]*$/g;
   for(let t=start+1; t<lines.length; t++) {
      let match = re.exec(lines[t]);
      if(match) {
         let indent = match[1].length;
         if(indent === wantedIndent) {
            //console.log(`match end at line ${t}`);
            return {
               line: t,
               keyword: match[2]
            };
         }
      }
   }
   return undefined;
}

function evaluate(condition: string, keyword: string, defs: any): boolean {

   let code = "";
   for(let key in defs) {
      code += `var ${key} = ${JSON.stringify(defs[key])};`;
   }
   code += `${condition}`;
   //console.log(code);

   let result: boolean;
   try {
      result = eval(code);
      //console.log(`evaluation of (${condition}) === ${result}`);
   }
   catch(error) {
      throw `error evaluation #if condition(${condition}"): ${error}`;
   }

   if(keyword === "ifndef") {
      result = !result;
   }

   return result;
}

function blank_code(lines: string[], start: number, end: number) {
   for(let t=start; t<=end; t++) {
      lines[t] = ("/" as any).repeat(lines[t].length);
   }
}

/*
const s =
`hello
11111
// #if DEBUG
3333
// #endif
55555
// #if comet !== "ciao"
7777
// #endif
99999
`;

const defs = {
   DEBUG: true,
   comet: "ciao"
};

console.log(parse(s,defs));
*/