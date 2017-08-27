/// #if DEBUG
assert(DEBUG === true)
/// #endif

/// #if version < 2
assert(version < 2)
///   #endif

/// #if !DEBUG
assert(DEBUG === undefined || DEBUG == false)
/// #endif

/// #if version > 2
assert(version > 2)
/// #endif

