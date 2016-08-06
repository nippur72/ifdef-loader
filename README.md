# ifdef-loader

Webpack package loader that allows JavaScript/TypeScript conditional compilation (aka compiler directives).

## Installation

In webpack build directory:
```
npm install ifdef-loader --save-dev
```

## Configuration

Example of use with TypeScript files, enabling the `DEBUG` variable:

In `webpack.config.json`:
```js
//...
{ test: /\.tsx?$/, exclude: /node_modules/, loaders: [ "ts-loader", 'ifdef-loader?DEBUG=true' ] }
//...
```
in `example.ts`:
```ts
// #if DEBUG
/* code to be included if DEBUG is defined */
// #end
```

## Directives

Directives must be placed after a `//` doubleslash comment.

If directives are nested, they must respect the indentation:

```js
// #if SOMECOND
//   #if SOMEOTHER
/* code */
//   #end
// #end
```

At the moment the only directive supported is `#if` (more to come).

```js
// #if SOMECOND
/* code to be included if SOMECOND is true */
// #end
```

## License

MIT

