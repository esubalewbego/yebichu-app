/** @type {import('jest').Config} */
module.exports = {
    preset: 'jest-expo',
    setupFiles: ['<rootDir>/__mocks__/jestSetup.js'],
    transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|firebase|@firebase|lucide-react-native)',
    ],
    moduleNameMapper: {
        '^expo-image-picker$': '<rootDir>/__mocks__/expo-image-picker.js',
        '^expo/src/winter/(.*)$': '<rootDir>/__mocks__/empty.js',
    },
};
