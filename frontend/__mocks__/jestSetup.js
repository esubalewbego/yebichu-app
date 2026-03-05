// This file runs before each test suite.
// It prevents Expo's winter runtime from registering the __ExpoImportMetaRegistry 

global.structuredClone = (val) => JSON.parse(JSON.stringify(val));

Object.defineProperty(global, '__ExpoImportMetaRegistry', {
    configurable: true,
    get: () => undefined,
    set: () => { },
});
