import React, { createContext, useContext, useState, useEffect } from 'react';
import { signup as apiSignup, getProfile } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for stored user session on mount
        const loadUser = async () => {
            try {
                const storedUser = await AsyncStorage.getItem('user');
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
            } catch (error) {
                console.error('Failed to load user session', error);
            } finally {
                setLoading(false);
            }
        };
        loadUser();
    }, []);

    const login = async (email, password) => {
        setLoading(true);
        try {
            // Simulate a successful login
            // In a real app, you would verify credentials on the backend
            const role = email.includes('admin') ? 'admin' : (email.includes('barber') ? 'barber' : 'user');
            const mockUser = {
                id: 'user_' + email.replace(/[@.]/g, '_'),
                email: email,
                displayName: email.split('@')[0],
                role: role
            };

            setUser(mockUser);
            await AsyncStorage.setItem('user', JSON.stringify(mockUser));
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const signup = async (userData) => {
        setLoading(true);
        try {
            const { data } = await apiSignup(userData);
            // After signup, we can automatically log them in or ask to login
            return data;
        } catch (error) {
            console.error('Signup error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setUser(null);
        await AsyncStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, signup }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
