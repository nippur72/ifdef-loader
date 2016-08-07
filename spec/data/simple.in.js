var a=1;
// #if DEBUG
debug("hello");
// #endif
var b=2;
// #if OS === "android"
androidInit();
// #endif
var c=3;
// #if version > 4
loadVersion4();
// #endif

