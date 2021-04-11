import { OptionObject } from 'loader-utils';

interface Range {
   from: number;
   to: number;
}

/** Holds the line indexes for a complete #if block */
class IfBlock {
   /**
    * @param line_if Line index of #if
    * @param line_endif Line index of #endif
    * @param elifs Line indexes of #elifs
    * @param line_else Line index of #else, or null
    * @param inner_ifs List of any IfBlocks that are contained within this IfBlock
    */
   constructor(public line_if: number, public line_endif: number, public elifs: number[] = [], public line_else: number|null = null, public inner_ifs: IfBlock[] = []) { }

   getIfRange(): Range {
      const to = this.elifs.length > 0 ? this.elifs[0] : this.line_else != null ? this.line_else : this.line_endif;
      return { from: this.line_if, to };
   }
   getElifRange(index: number): Range {
      if(this.elifs.length > index) {
         const from = this.elifs[index];
         const to = this.elifs.length > index + 1 ? this.elifs[index + 1] : this.line_else != null ? this.line_else : this.line_endif;
         return { from, to };
      } else {
         throw `Invalid elif index '${index}', there are only ${this.elifs.length} elifs`;
      }
   }
   getElseRange(): Range {
      if(this.line_else != null) {
         return { from: this.line_else, to: this.line_endif };
      } else {
         throw 'Cannot use elseRange when elseIx is null';
      }
   }
}

enum IfType { If, Elif }

let useTripleSlash: boolean|undefined;
let fillCharacter: string;
let uncommentPrefix: string | undefined;

export function parse(source: string, defs: OptionObject, verbose?: boolean, tripleSlash?: boolean, filePath?: string, fillWithBlanks?: boolean, uncommentPrefixString?: string): string {
   if(tripleSlash === undefined) tripleSlash = true;
   useTripleSlash = tripleSlash;

   if(fillWithBlanks === undefined) fillWithBlanks = false;
   fillCharacter = fillWithBlanks ? ' ' : '/';

   uncommentPrefix = uncommentPrefixString;

   // early skip check: do not process file when no '#if' are contained
   if(source.indexOf('#if') === -1) return source;

   const lines = source.split('\n');

   const ifBlocks = find_if_blocks(lines);
   for(let ifBlock of ifBlocks) {
      apply_if(lines, ifBlock, defs, verbose, filePath);
   }

   return lines.join('\n');
}

function find_if_blocks(lines: string[]): IfBlock[] {
   const blocks: IfBlock[] = [];
   for(let i = 0; i < lines.length; i++) {
      if(match_if(lines[i])) {
         const ifBlock = parse_if_block(lines, i);
         blocks.push(ifBlock);
         i = ifBlock.line_endif;
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
         i = innerIf.line_endif;
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
function apply_if(lines: string[], ifBlock: IfBlock, defs: OptionObject, verbose: boolean = false, filePath?: string) {
   let includeRange: Range|null = null;

   // gets the condition and parses it
   const ifCond = parse_if(lines[ifBlock.line_if]);
   const ifRes = evaluate(ifCond, defs);

   const log = (condition: string, outcome: boolean) => {
      if(verbose) {
         console.log(`#if block lines [${ifBlock.line_if + 1}-${ifBlock.line_endif + 1}]: Condition '${condition}' is ${outcome ? 'TRUE' : 'FALSE'}. ${includeRange != null ? `Including lines [${includeRange.from + 1}-${includeRange.to + 1}]` : 'Excluding everything'} (${filePath})`);
      }
   };

   // finds which part of the #if has to be included, all else is excluded

   if(ifRes) {
      // include the #if body
      includeRange = ifBlock.getIfRange();
      log(ifCond, true);
   } else {
      // if there are #elif checks if one has to be included
      for(let elifIx = 0; elifIx < ifBlock.elifs.length; elifIx++) {
         const elifLine = lines[ifBlock.elifs[elifIx]];
         const elifCond = parse_if(elifLine);
         const elifRes = evaluate(elifCond, defs);
         if(elifRes) {
            // include #elif
            includeRange = ifBlock.getElifRange(elifIx);
            log(elifCond, true);
            break;
         }
      }

      // if no #elif are found then goes to #else branch
      if(includeRange == null) {
         if(ifBlock.line_else != null) {
            includeRange = ifBlock.getElseRange();
         }
         log(ifCond, false);
      }
   }

   // blanks everything except the part that has to be included
   if(includeRange != null) {      
      blank_code(lines, ifBlock.line_if, includeRange.from);   // blanks: #if ... "from"
      blank_code(lines, includeRange.to, ifBlock.line_endif);  // blanks: "to" ... #endif
      reveal_code(lines, includeRange.from, includeRange.to);  // reveal: "from" ... "to"
   } else {
      blank_code(lines, ifBlock.line_if, ifBlock.line_endif);  // blanks: #if ... #endif
   }

   // apply to inner #if blocks that have not already been erased
   for(let innerIf of ifBlock.inner_ifs) {      
      if(includeRange != null && innerIf.line_if >= includeRange.from && innerIf.line_if <= includeRange.to) {
         apply_if(lines, innerIf, defs, verbose);
      }
   }
}

/**
 * @return true if block has to be preserved
 */
function evaluate(condition: string, defs: OptionObject): boolean {
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

function blank_code(lines: string[], start: number, end: number) {
   for(let t=start; t<=end; t++) {
      const len = lines[t].length;
      const lastChar = lines[t].charAt(len-1);
      const windowsTermination = lastChar === '\r';
      if(len === 0) {
         lines[t] = '';
      }
      else if(len === 1) {
         lines[t] = windowsTermination ? '\r' : ' ';
      }
      else if(len === 2) {
         lines[t] = windowsTermination ? ' \r' : fillCharacter.repeat(2);
      }
      else {
         lines[t] = windowsTermination ? fillCharacter.repeat(len-1)+'\r' : fillCharacter.repeat(len);
      }
   }
}

function reveal_code(lines: string[], start: number, end: number) {
   // early exit if no prefix is specifed
   if(uncommentPrefix == undefined) return;

   // create a regex capturing the line
   let regex = new RegExp(`^(?<before>\s*${uncommentPrefix})(?<line>.*)$`);

   // replace lines that match the uncomment prefix
   for(let t=start; t<=end; t++) {
      let r = regex.exec(lines[t]);
      if(r!==null && r.groups!==undefined) {
         lines[t] = " ".repeat(r.groups.before.length) + r.groups.line;
      }
   }
}
