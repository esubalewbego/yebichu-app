import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://10.18.47.33:5000/api'; // Use your computer's IP (detected: 10.18.47.33)
// Fallback for Android Emulator: http://10.0.2.2:5000/api

const api = axios.create({
    baseURL: API_BASE_URL,
});

// Add a request interceptor to attach the token
api.interceptors.request.use(
    async (config) => {
        try {
            const userStr = await AsyncStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                // In mock mode, we use a fake token. In real mode, use user.token
                const token = user.token || 'MOCK_TOKEN_' + (user.role || 'user').toUpperCase();
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
export const getProfile = (userId) => api.get(`/auth/profile/${userId}`);

// Packages
export const getPackages = () => api.get('/packages');
export const getStyles = () => api.get('/packages/styles');
export const createPackage = (data) => api.post('/packages', data);
export const updatePackage = (id, data) => api.put(`/packages/${id}`, data);
export const deletePackage = (id) => api.delete(`/packages/${id}`);

// Appointments
export const createAppointment = (data) => api.post('/appointments', data);
export const getUserAppointments = (userId) => api.get(`/appointments/user/${userId}`);
export const getBarberAppointments = (barberId) => api.get(`/appointments/barber/${barberId}`);
export const getAllAppointments = () => api.get('/appointments/admin/all');
export const getAdminAnalytics = () => api.get('/appointments/admin/analytics');
export const updateAppointmentStatus = (id, status) => api.patch(`/appointments/admin/${id}/status`, { status });

// Payments
export const initializePayment = (data) => api.post('/payments/initialize', data);
export const verifyPayment = (txRef) => api.get(`/payments/verify/${txRef}`);

export default api;
