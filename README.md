# ifdef-loader

Webpack package loader that allows JavaScript/TypeScript conditional compilation (`#if ... #endif`).

## Installation

In webpack build directory:
```
npm install ifdef-loader --save-dev
```

## Configuration

Example of use with TypeScript files, enabling the `DEBUG` and `version` variables:

In `webpack.config.json`:
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

Add `ifdef-verbose` to query string if you want the loader to print informations when directives are processed:
```js
//...
{ test: /\.tsx?$/, exclude: /node_modules/, loaders: [ "ts-loader", 'ifdef-loader?ifdef-verbose=true' ] }
//...
```

## Directives

Directives must be placed after a `//` doubleslash comment.

```js
// #if SOMECOND
//   #if SOMEOTHER
/* code */
//   #endif
// #endif
```

At the moment the only directive supported is `#if`/`#endif` (more to come).

```js
// #if SOMECOND
/* code to be included if SOMECOND is true */
// #endif
```

## License

MIT

