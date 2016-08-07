# ifdef-loader

Webpack loader that allows JavaScript or TypeScript conditional compilation (`#if ... #endif`)
directly from Webpack.

Conditional compilation directives are written inside `//` doubleslash comment so
that they don't effect normal JavaScript or TypeScript parsing.

The `//` doubleslash comment must be at the start of line.

Example:
```js
// #if DEBUG
console.log("there's a bug!");
// #endif
```
The `DEBUG` or any other variable can be specified when configuring the Webpack loader (see below).

The directive `#if` accepts any valid JavaScript expression:
```js
// #if PRODUCTION && version.charAt(0)=='X'
console.log("Ho!");
// #endif
```

If the expression is `true` the block of code between `#if` and `#endif` is included,
otherwise is excluded by commenting it out.

The `#if` clauses can also be nested:
```js
// #if PRODUCTION
//    #if OS=="android"
         android_code();
//    #endif
//    #if OS=="ios"
         ios_code();
//    #endif
// #endif
```

Please note that `#else` is not supported at the moment.

## Installation

In webpack build directory:
```
npm install ifdef-loader --save-dev
```

## Configuration

Example of use with TypeScript files, enabling the `DEBUG` and `version` variables:

In `webpack.config.json` chain it before `ts-loader`:
```js
//...
{ test: /\.tsx?$/, exclude: /node_modules/, loaders: [ "ts-loader", 'ifdef-loader?DEBUG=true&version=3' ] }
//...
```
in `example.ts`:
```ts
// #if DEBUG
     /* code to be included if DEBUG is defined */
//   #if version <2
        /* code to be included if DEBUG is defined and version < 2*/
//   #endif
// #endif
```

Add `ifdef-verbose` to query string if you want the loader to print when directives are processed:
```js
//...
{ test: /\.tsx?$/, exclude: /node_modules/, loaders: [ "ts-loader", 'ifdef-loader?ifdef-verbose=true' ] }
//...
```

## License

MIT

## Contributions

Contributions in the form of issues or pull requests are welcome.

