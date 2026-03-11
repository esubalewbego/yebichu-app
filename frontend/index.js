import 'react-native-gesture-handler';
import { NativeModules } from 'react-native';

// Safer compatibility fix for SDK 55 / RN 0.83+ 
// Avoids direct assignment to NativeModules proxy to prevent bridge conflicts
(function () {
    const mockEmitter = {
        addListener: () => ({ remove: () => { } }),
        removeListeners: () => { },
        removeAllListeners: () => { },
        emit: () => { },
    };

    // Polyfill globally for legacy modules that look for it
    if (typeof global.EventEmitter === 'undefined') {
        global.EventEmitter = mockEmitter;
    }

    // Only attempt to supplement NativeModules if the property isn't defined
    // and use defineProperty to be safer with Proxies
    try {
        if (NativeModules && typeof NativeModules.EventEmitter === 'undefined') {
            Object.defineProperty(NativeModules, 'EventEmitter', {
                value: mockEmitter,
                writable: true,
                configurable: true,
                enumerable: true
            });
        }
    } catch (e) {
        console.log('Safe-polyfilling NativeModules.EventEmitter skipped: bridge is restricted.');
    }
})();

import { registerRootComponent } from 'expo';
import { LogBox } from 'react-native';

const originalWarn = console.warn;
console.warn = (...args) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('InteractionManager has been deprecated')) {
        return;
    }
    originalWarn(...args);
};

// Ignore specific deprecation and dev-client errors
LogBox.ignoreLogs([
    'InteractionManager has been deprecated',
    "Error: Call to function 'ExpoKeepAwake.activate' has been rejected",
]);

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
