import 'react-native-gesture-handler';
import { NativeModules } from 'react-native';

// Critical polyfill for React Native 0.76+ compatibility with legacy modules
if (NativeModules && !NativeModules.EventEmitter) {
    NativeModules.EventEmitter = {
        addListener: () => ({ remove: () => { } }),
        removeListeners: () => { },
        removeAllListeners: () => { },
        emit: () => { },
    };
}

import { registerRootComponent } from 'expo';
import { LogBox } from 'react-native';

const originalWarn = console.warn;
console.warn = (...args) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('InteractionManager has been deprecated')) {
        return;
    }
    originalWarn(...args);
};

// Ignore via LogBox as well just in case
LogBox.ignoreLogs(['InteractionManager has been deprecated']);

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
