/** Holds the line indexes for a complete #if block */
class IfBlock {
   /**
    * @param startIx Line index of #if
    * @param endIx Line index of #endif
    * @param elifIxs Line indexes of #elifs
    * @param elseIx Line index of #else, or null
    * @param innerIfs List of any IfBlocks that are contained within this IfBlock
    */
   constructor(public startIx: number, public endIx: number, public elifIxs: number[] = [], public elseIx: number|null = null, public innerIfs: IfBlock[] = []) { }

   getIfRange(): [number, number] {
      const to = this.elifIxs.length > 0 ? this.elifIxs[0] : this.elseIx != null ? this.elseIx : this.endIx;
      return [this.startIx, to];
   }
   getElifRange(index: number): [number, number] {
      if(this.elifIxs.length > index) {
         const from = this.elifIxs[index];
         const to = this.elifIxs.length > index + 1 ? this.elifIxs[index + 1] : this.elseIx != null ? this.elseIx : this.endIx;
         return [from, to];
      } else {
         throw `Invalid elif index '${index}', there are only ${this.elifIxs.length} elifs`;
      }
   }
   getElseRange(): [number, number] {
      if(this.elseIx != null) {
         return [this.elseIx, this.endIx];
      } else {
         throw 'Cannot use elseRange when elseIx is null';
      }
   }
}

enum IfType { If, Elif }

let useTripleSlash: boolean|undefined;

export function parse(source: string, defs: object, verbose?: boolean, tripleSlash?: boolean): string {
   if(tripleSlash === undefined) tripleSlash = true;
   useTripleSlash = tripleSlash;

   // early skip check: do not process file when no '#if' are contained
   if(source.indexOf('#if') === -1) return source;

   const lines = source.split('\n');

   var ifBlocks = find_if_blocks(lines);
   for(let ifBlock of ifBlocks) {
      apply_if(lines, ifBlock, defs, verbose);
   }

   return lines.join('\n');
}

function find_if_blocks(lines: string[]): IfBlock[] {
   const blocks: IfBlock[] = [];
   for(let i = 0; i < lines.length; i++) {
      if(match_if(lines[i])) {
         const ifBlock = parse_if_block(lines, i);
         blocks.push(ifBlock);
         i = ifBlock.endIx;
      }
   }
   return blocks;
}

/**
 * Parse #if statement at given locatoin
 * @param ifBlockStart Line on which the '#if' is located. (Given line MUST be start of an if-block)
 */
function parse_if_block(lines: string[], ifBlockStart: number): IfBlock {
   let foundElifs: number[] = [];
   let foundElse: number|null = null;
   let foundEnd: number|undefined;
   let innerIfs: IfBlock[] = [];

   for(let i = ifBlockStart + 1; i < lines.length; i++) {
      const curLine = lines[i];

      const innerIfMatch = match_if(curLine);
      if(innerIfMatch) {
         const innerIf = parse_if_block(lines, i);
         innerIfs.push(innerIf);
         i = innerIf.endIx;
         continue;
      }

      const elifMatch = match_if(curLine, IfType.Elif);
      if(elifMatch) {
         foundElifs.push(i);
         continue;
      }

      const elseMatch = match_else(curLine);
      if(elseMatch) {
         foundElse = i;
         continue;
      }

      const endMatch = match_endif(curLine);
      if(endMatch) {
         foundEnd = i;
         break;
      }
   }

   if(foundEnd === undefined) {
      throw `#if without #endif on line ${ifBlockStart + 1}`;
   }
   return new IfBlock(ifBlockStart, foundEnd, foundElifs, foundElse, innerIfs);
}

const ifRegex = () => useTripleSlash ? /^[\s]*\/\/\/([\s]*)#(if|elif)([\s\S]+)$/g : /^[\s]*\/\/([\s]*)#(if|elif)([\s\S]+)$/g;

function match_if(line: string, type: IfType = IfType.If) : boolean {
   const re = ifRegex();
   const match = re.exec(line);
   return match !== null && ((type == IfType.If && match[2] == "if") || (type == IfType.Elif && match[2] == "elif"));
}

/**
 * @param line Line to parse, must be a valid #if statement
 * @returns The if condition
 */
function parse_if(line: string): string {
   const re = ifRegex();
   const match = re.exec(line);
   if(match) {
      return match[3].trim();
   } else {
      throw `Could not parse #if: '${line}'`;
   }
}

function match_endif(line: string): boolean {
   const re = useTripleSlash ? /^[\s]*\/\/\/([\s]*)#(endif)[\s]*$/g : /^[\s]*\/\/([\s]*)#(endif)[\s]*$/g;
   const match = re.exec(line);
   return Boolean(match);
}

function match_else(line: string): boolean {
   const re = useTripleSlash ? /^[\s]*\/\/\/([\s]*)#(else)[\s]*$/g : /^[\s]*\/\/([\s]*)#(else)[\s]*$/g;
   const match = re.exec(line);
   return Boolean(match);
}

/** Includes and excludes relevant lines based on evaluation of the provided IfBlock */
function apply_if(lines: string[], ifBlock: IfBlock, defs: object, verbose: boolean = false) {
   let includeRange: [number, number]|null = null;

   const ifCond = parse_if(lines[ifBlock.startIx]);
   const ifRes = evaluate(ifCond, defs);

   const log = (condition: string, outcome: boolean) => {
      if(verbose) {
         console.log(`#if block lines [${ifBlock.startIx + 1}-${ifBlock.endIx + 1}]: Condition '${condition}' is ${outcome ? 'TRUE' : 'FALSE'}. ${includeRange != null ? `Including lines [${includeRange[0] + 1}-${includeRange[1] + 1}].` : 'Excluding everything.'}`);
      }
   };

   if(ifRes) {
      includeRange = ifBlock.getIfRange();
      log(ifCond, true);
   } else {
      for(let elifIx = 0; elifIx < ifBlock.elifIxs.length; elifIx++) {
         const elifLine = lines[ifBlock.elifIxs[elifIx]];
         const elifCond = parse_if(elifLine);
         const elifRes = evaluate(elifCond, defs);
         if(elifRes) {
            includeRange = ifBlock.getElifRange(elifIx);
            log(elifCond, true);
            break;
         }
      }

      if(includeRange == null) {
         if(ifBlock.elseIx != null) {
            includeRange = ifBlock.getElseRange();
         }
         log(ifCond, false);
      }
   }

   if(includeRange != null) {
      blank_code(lines, ifBlock.startIx, includeRange[0]);
      blank_code(lines, includeRange[1], ifBlock.endIx);
   } else {
      blank_code(lines, ifBlock.startIx, ifBlock.endIx);
   }

   for(let innerIf of ifBlock.innerIfs) {
      // Apply inner-if blocks only when they are not already erased
      if(includeRange != null && innerIf.startIx >= includeRange[0] && innerIf.startIx <= includeRange[1]) {
         apply_if(lines, innerIf, defs, verbose);
      }
   }
}

/**
 * @return true if block has to be preserved
 */
function evaluate(condition: string, defs: object): boolean {
   const code = `return (${condition}) ? true : false;`;
   const args = Object.keys(defs);

   let result: boolean;
   try {
     const f = new Function(...args, code);
     result = f(...args.map((k) => defs[k]));
      //console.log(`evaluation of (${condition}) === ${result}`);
   }
   catch(error) {
      throw `error evaluation #if condition(${condition}): ${error}`;
   }

   return result;
}

function blank_code(lines: string[], start: number, end: number = start) {
   for(let t=start; t<=end; t++) {
      const len = lines[t].length;
      const lastChar = lines[t].charAt(len-1);
      const windowsTermination = lastChar === '\r';
      if(len === 0)
      {
         lines[t] = '';
      }
      else if(len === 1)
      {
         lines[t] = windowsTermination ? '\r' : ' ';
      }
      else if(len === 2)
      {
         lines[t] = windowsTermination ? ' \r' : '//';
      }
      else
      {
         lines[t] = windowsTermination ? ("/" as any).repeat(len-1)+'\r' : ("/" as any).repeat(len);
      }
   }
}
