import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://10.18.47.33:5000/api'; // Use your computer's IP (detected: 10.18.47.33)
// Fallback for Android Emulator: http://10.0.2.2:5000/api

const api = axios.create({
    baseURL: API_BASE_URL,
});

import { auth } from '../config/firebase';

// Add a request interceptor to attach the token
api.interceptors.request.use(
    async (config) => {
        try {
            if (auth.currentUser) {
                const token = await auth.currentUser.getIdToken();
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Interceptor error:', error);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Auth
export const signup = (data) => api.post('/auth/signup', data);
export const loginIdentifier = (identifier) => api.post('/auth/login-identifier', { identifier });
export const getProfile = (userId) => api.get(`/auth/profile/${userId}`);

// Packages
export const getPackages = () => api.get('/packages');
export const getStyles = () => api.get('/packages/styles');
export const createPackage = (data) => api.post('/packages', data);
export const updatePackage = (id, data) => api.put(`/packages/${id}`, data);
export const deletePackage = (id) => api.delete(`/packages/${id}`);

export const createStyle = (data) => api.post('/packages/styles', data);
export const updateStyle = (id, data) => api.put(`/packages/styles/${id}`, data);
export const deleteStyle = (id) => api.delete(`/packages/styles/${id}`);

// Categories
export const getCategories = () => api.get('/packages/categories');
export const createCategory = (data) => api.post('/packages/categories', data);
export const updateCategory = (id, data) => api.put(`/packages/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/packages/categories/${id}`);
export const uploadImage = async (formData) => {
    try {
        const token = await auth.currentUser?.getIdToken();
        const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                // Important: Do NOT set Content-Type header on FormData fetch
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `Upload failed with status ${response.status}`);
        }

        const data = await response.json();
        return { data };
    } catch (error) {
        console.error('Fetch Upload Error:', error);
        throw error;
    }
};

// Appointments
export const createAppointment = (data) => api.post('/appointments', data);
export const getUserAppointments = (userId) => api.get(`/appointments/user/${userId}`);
export const getBarberAppointments = (barberId) => api.get(`/appointments/barber/${barberId}`);
export const getAllAppointments = () => api.get('/appointments/admin/all');
export const getAdminAnalytics = () => api.get('/appointments/admin/analytics');
export const recordCashPayment = (id) => api.patch(`/appointments/admin/${id}/status`, {
    status: 'completed',
    paymentStatus: 'paid',
    paymentMethod: 'cash'
});
export const deleteAppointment = (id) => api.delete(`/appointments/admin/${id}`);
export const updateAppointmentStatus = (id, status) => api.patch(`/appointments/admin/${id}/status`, { status });
export const getAdminInfo = () => api.get('/auth/admin-info');
export const toggleWishlist = (id) => api.post('/auth/wishlist/toggle', { id });

export const getBarbersList = () => api.get('/auth/barbers');

// Admin User Management
export const getAllUsers = () => api.get('/auth/users');
export const updateUserRole = (id, role) => api.patch(`/auth/users/${id}/role`, { role });
export const deleteUserById = (id) => api.delete(`/auth/users/${id}`);
export const getUserProfile = (uid) => api.get(`/auth/profile/${uid}`);

export const initializePayment = (data) => api.post('/payments/initialize', data);
export const verifyPayment = (txRef) => api.get(`/payments/verify/${txRef}`);

// Chat
export const sendMessage = (data) => api.post('/chat/send', data);
export const getConversations = () => api.get('/chat/conversations');
export const getMessages = (conversationId) => api.get(`/chat/messages/${conversationId}`);

// Ratings
export const rateStyle = (id, data) => api.post(`/packages/styles/${id}/rate`, data);

export default api;
