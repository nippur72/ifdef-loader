var a=1;
/// #if DEBUG
debug("hello");
/// #elif DEBUG === null
var b=2;
/// #endif
var c=3;

var v=0;
/// #if version == 1
v=1;
/// #elif version == 2
v=2;
/// #elif version == 3.5
v=3.5;
/// #elif version == 4
v=4;
/// #else
v=-1;
/// #endif

/// #if DEBUG
/// #elif DEBUG === null
/// #else
/// #endif

/// #if true
var v=0;
/// #elif true
var v=1;
/// #else
/// #endif