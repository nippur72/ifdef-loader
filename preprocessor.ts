/** Holds the line indexes for a complete #if block */
class IfBlock {
   /**
    * @param startIx Line index of #if
    * @param endIx Line index of #endif
    * @param elseIx Line index of #else, or null
    * @param innerIfs List of any IfBlocks that are contained within this IfBlock
    */
   constructor(public startIx: number, public endIx: number, public elseIx: number|null = null, public innerIfs: IfBlock[] = []) { }
}

let useTripleSlash: boolean|undefined;

export function parse(source: string, defs: object, verbose?: boolean, tripleSlash?: boolean): string {
   if(tripleSlash === undefined) tripleSlash = true;
   useTripleSlash = tripleSlash;

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
   return new IfBlock(ifBlockStart, foundEnd, foundElse, innerIfs);
}

const ifRegex = () => useTripleSlash ? /^[\s]*\/\/\/([\s]*)#(if)([\s\S]+)$/g : /^[\s]*\/\/([\s]*)#(if)([\s\S]+)$/g;

function match_if(line: string) : boolean {
   const re = ifRegex();
   const match = re.exec(line);
   return Boolean(match);
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
   const ifCond = parse_if(lines[ifBlock.startIx]);
   const evalRes = evaluate(ifCond, defs);

   const incStart = evalRes ? ifBlock.startIx : ifBlock.elseIx;   // Start of included lines
   const incEnd = ifBlock.elseIx === null ?                       // End of included lines
      evalRes ? ifBlock.endIx : null :
      evalRes ? ifBlock.elseIx : ifBlock.endIx;
   const excStart = evalRes ? ifBlock.elseIx : ifBlock.startIx;   // Start of excluded lines
   const excEnd = ifBlock.elseIx === null ?                       // End of excluded lines
      evalRes ? null : ifBlock.endIx :
      evalRes ? ifBlock.endIx : ifBlock.elseIx;

   if(verbose) {
      console.log(`Condition '${ifCond}' is ${evalRes ? 'TRUE' : 'FALSE'}.${incStart != null && incEnd != null ? ` including lines [${incStart + 1}-${incEnd + 1}]` : ''}${excStart != null && excEnd != null ? ` excluding lines [${excStart + 1}-${excEnd + 1}]` : ''}`);
   }

   blank_code(lines, ifBlock.startIx);                      // Erase /// #if line
   if(ifBlock.elseIx) { blank_code(lines, ifBlock.elseIx) } // Erase /// #else line
   blank_code(lines, ifBlock.endIx);                        // Erase /// #endif line

   if(excStart !== null && excEnd !== null) {
      blank_code(lines ,excStart + 1, excEnd - 1);          // Erase body
   }

   for(let innerIf of ifBlock.innerIfs) {
      // Apply inner-if blocks only when they are not already erased
      if((excStart === null || excEnd === null) || innerIf.startIx < excStart || innerIf.startIx > excEnd) {
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
