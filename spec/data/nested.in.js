var a=1;
/// #if version > 4
loadVersion4();
     /// #if OS === "android"
     android_Init_In_Version_4();
     /// #endif
/// #endif
a=a+1;

var b=1;
/// #if version < 4
loadVersion2();
     /// #if OS === "ios"
     IOS_Init_In_Version_2();
     /// #endif
/// #endif
b=a+1;
