var a=-1;
/// #if version < 4
var os=null;
     /// #if OS === "ios"
     os = 'ios';
     /// #elif OS === "android"
     os = 'android';
          /// #if true /* nested */
          log('android');
          /// #endif
     /// #else
     os = '???';
     /// #endif
log(os);
/// #elif version < 6
a=6;
/// #else
a=7;
/// #endif
/// test
