import React, { createContext, useContext, useState, useEffect } from 'react';
import { signup as apiSignup, getUserProfile } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Listen for Firebase Auth state changes
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
                if (firebaseUser) {
                    console.log('Firebase User detected, fetching profile for:', firebaseUser.uid);
                    // Fetch additional role data from our backend
                    const { data } = await getUserProfile(firebaseUser.uid);
                    console.log('User Role Resolved:', data.role);
                    setUser({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        role: data.role || 'user',
                        ...data
                    });
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error('Failed to resolve user session', error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    const login = async (email, password) => {
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // onAuthStateChanged will trigger and handle setting the user state and loading(false)
        } catch (error) {
            setLoading(false); // Only set to false on error, otherwise let the listener handle it
            console.error('Login error:', error);
            throw error;
        }
    };

    const signup = async (userData) => {
        setLoading(true);
        try {
            const { data } = await apiSignup(userData);
            return data;
        } catch (error) {
            console.error('Signup error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            await signOut(auth);
            setUser(null);
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setLoading(false);
        }
    };

    const forgotPassword = async (email) => {
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error) {
            console.error('Password reset error:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, signup, forgotPassword }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
