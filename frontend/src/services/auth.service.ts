import api from '../api/axios.config';
import { LoginCredentials, RegisterCredentials, AuthResponse } from '../types/auth.types';

export const authService = {
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    },

    register: async (credentials: RegisterCredentials) => {
        const response = await api.post('/auth/register', credentials);
        return response.data;
    },

    getProfile: async () => {
        const response = await api.get('/auth/profile');
        return response.data;
    },

    updateProfile: async (data: Partial<RegisterCredentials>) => {
        const response = await api.put('/auth/profile', data);
        return response.data;
    },

    changePassword: async (currentPassword: string, newPassword: string) => {
        const response = await api.post('/auth/change-password', {
            currentPassword,
            newPassword,
        });
        return response.data;
    },
};