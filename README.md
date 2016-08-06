# ifdef-loader

Webpack package loder that allows JavaScript conditional compilation with compiler directives.

## Installation

In webpack build directory:
```
npm install ifdef-loader --save-dev
```

## Directives

```
// #if SOMECOND
/* code to be included if SOMECOND is true */
// #end
```

