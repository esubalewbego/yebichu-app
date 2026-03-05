// This file runs before each test suite.
// It prevents Expo's winter runtime from registering the __ExpoImportMetaRegistry 
// global property getter that tries to `import` a native TS file (causes scope errors).
Object.defineProperty(global, '__ExpoImportMetaRegistry', {
    configurable: true,
    get: () => undefined,
    set: () => { },
});
