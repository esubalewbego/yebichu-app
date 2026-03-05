// HomeScreen.test.js
// Mock everything before any imports to prevent native module initialization

jest.mock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => children,
}));

jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('../context/AuthContext', () => ({
    useAuth: () => ({
        user: { role: 'user', uid: 'test123', displayName: 'Test User' },
        logout: jest.fn(),
    }),
    AuthProvider: ({ children }) => children,
}));

jest.mock('../config/firebase', () => ({
    auth: {
        currentUser: null,
        onAuthStateChanged: jest.fn(() => () => { }),
    },
    app: {},
}));

// Mock the api service to prevent axios from making actual calls
jest.mock('../services/api', () => ({
    getPackages: jest.fn().mockResolvedValue({ data: [] }),
    getStyles: jest.fn().mockResolvedValue({ data: [] }),
}));

const React = require('react');
const { render } = require('@testing-library/react-native');
const HomeScreen = require('../screens/HomeScreen').default;

describe('HomeScreen Component', () => {
    it('renders correctly', () => {
        const { getByText } = render(<HomeScreen />);
        expect(getByText(/Extraordinary/i)).toBeTruthy();
    });
});
