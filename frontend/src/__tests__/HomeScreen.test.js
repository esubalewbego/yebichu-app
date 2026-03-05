import React from 'react';
import { render } from '@testing-library/react-native';
import HomeScreen from '../screens/HomeScreen';
import { AuthProvider } from '../context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Mocking useSafeAreaInsets
jest.mock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    SafeAreaProvider: ({ children }) => <>{children}</>,
}));

// Mocking AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('HomeScreen Component', () => {
    it('renders correctly', () => {
        // We wrap in providers because the component uses useAuth and useSafeAreaInsets
        const { getByText } = render(
            <SafeAreaProvider>
                <AuthProvider>
                    <HomeScreen />
                </AuthProvider>
            </SafeAreaProvider>
        );

        // Check for some text that should be on the landing page
        expect(getByText(/Extraordinary/i)).toBeTruthy();
    });
});
