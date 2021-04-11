# ifdef-loader

Webpack loader that allows JavaScript or TypeScript conditional compilation (`#if ... #elif ... #else ... #endif`)
directly from Webpack.

Conditional compilation directives are written inside `///` triple slash comment so
that they don't effect normal JavaScript or TypeScript parsing.

Example:
```js
/// #if DEBUG
console.log("there's a bug!");
/// #endif
```
The `DEBUG` or any other variable can be specified when configuring the Webpack loader (see below).

The directive `#if` accepts any valid JavaScript expression:
```js
/// #if PRODUCTION && version.charAt(0)=='X'
console.log("Ho!");
/// #endif
```

If the expression is `true` the block of code between `#if` and `#endif` is included, otherwise is excluded by commenting it out.

Additionally, `#elif` and `#else` clauses can be added to an `#if` clause:
```js
/// #if env == 'PRODUCTION'
console.log('Production!');
/// #elif env == 'DEBUG'
console.log('Debug!');
/// #else
console.log('Something else!');
/// #endif
```

The `#if` clauses can also be nested:
```js
/// #if PRODUCTION
      /// #if OS=="android"
      android_code();
      /// #elif OS=="ios"
      ios_code();
      /// #endif
/// #endif
```

## Installation

In webpack build directory:
```
npm install ifdef-loader --save-dev
```

## Configuration

Example of use with TypeScript files, enabling the `DEBUG` and `version` variables:

In `webpack.config.json` put `ifdef-loader` after `ts-loader` so that files are processed
before going into TypeScript compiler: 
```js
// define preprocessor variables
const opts = {
   DEBUG: true,
   version: 3,
   "ifdef-verbose": true,                 // add this for verbose output
   "ifdef-triple-slash": false,           // add this to use double slash comment instead of default triple slash
   "ifdef-fill-with-blanks": true         // add this to remove code with blank spaces instead of "//" comments
   "ifdef-uncomment-prefix": "// #code "  // add this to uncomment code starting with "// #code "
};

/* ... */ { 
   test: /\.tsx?$/, 
   exclude: /node_modules/, 
   use: [
      { loader: "ts-loader" }, 
      { loader: "ifdef-loader", options: opts } 
   ]
}

// alternatively, options can be passed via query string:
const q = require('querystring').encode(opts);
/* ... */ { 
   test: /\.tsx?$/, 
   exclude: /node_modules/, 
   loaders: [ "ts-loader", `ifdef-loader?${q}` ] 
}

```
in `example.ts`:
```ts
/// #if DEBUG
     /* code to be included if DEBUG is defined */
///   #if version <2
        /* code to be included if DEBUG is defined and version < 2*/
///   #endif
/// #endif
```

## License

MIT

## Contributions

Contributions in the form of issues or pull requests are welcome.

## Changes

- v2.3.0 added option `uncomment-prefix` to write code in comments allowing it to pass through linters and syntax checking

- v2.2.0 added option `fill-with-blanks` for removing code with blank spaces instead of `//` comments

- v2.1.0 added support for `#elif` clause.

- v2.0.0 BREAKING CHANGE: options are now passed using the 
standard Webpack API (`loader-utils`). See below for the upgrade.

- v1.0.0 changed to triple slash comment syntax. Double slash syntax
deprecated and available by turning off the `ifdef-triple-slash` option.

- v1.0.3 fixed bug occurring with short lines. Improved handling of line
termination (CRLF vs LF) in order to preserve source maps.

- v1.1.0 added support for `#else` clauses.

## Upgrading from v1 to v2

In v2 options are passed differently than v1, so you need to update your `webpack.config.js`. 
Just do the following simple changes:
```js
/* from */ const q = require('querystring').encode({json: JSON.stringify(opts)});
/* to   */ const q = require('querystring').encode(opts);
/* you can keep the  ... `ifdef-loader?${q}` ... syntax    */
/* but it's better to pass options directly (see the docs) */
```
