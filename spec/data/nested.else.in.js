var a=1;
/// #if version > 4
loadVersion4();
     /// #if OS === "android"
     android_Init_In_Version_4();
     /// #endif
/// #else
loadVersion2();
/// #endif
a=a+1;

var b=1;
/// #if version < 4
loadVersion2();
     /// #if OS === "ios"
     IOS_Init_In_Version_2();
     /// #else
     Init_General();
     /// #endif
/// #else
wontHappen();
/// #endif
b=a+1;
