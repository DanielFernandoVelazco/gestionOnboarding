import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, RegisterCredentials, AuthResponse, AuthState } from '../types/auth.types';

interface AuthContextType extends AuthState {
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (credentials: RegisterCredentials) => Promise<void>;
    logout: () => void;
    updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
    | { type: 'LOGIN_REQUEST' }
    | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
    | { type: 'LOGIN_FAILURE'; payload: string }
    | { type: 'REGISTER_REQUEST' }
    | { type: 'REGISTER_SUCCESS'; payload: { user: User; token: string } }
    | { type: 'REGISTER_FAILURE'; payload: string }
    | { type: 'LOGOUT' }
    | { type: 'UPDATE_USER'; payload: Partial<User> };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
    switch (action.type) {
        case 'LOGIN_REQUEST':
        case 'REGISTER_REQUEST':
            return { ...state, isLoading: true, error: null };

        case 'LOGIN_SUCCESS':
        case 'REGISTER_SUCCESS':
            return {
                ...state,
                user: action.payload.user,
                token: action.payload.token,
                isLoading: false,
                error: null,
            };

        case 'LOGIN_FAILURE':
        case 'REGISTER_FAILURE':
            return {
                ...state,
                isLoading: false,
                error: action.payload,
                user: null,
                token: null,
            };

        case 'LOGOUT':
            return {
                ...state,
                user: null,
                token: null,
                isLoading: false,
                error: null,
            };

        case 'UPDATE_USER':
            return {
                ...state,
                user: state.user ? { ...state.user, ...action.payload } : null,
            };

        default:
            return state;
    }
};

const initialState: AuthState = {
    user: null,
    token: null,
    isLoading: false,
    error: null,
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    useEffect(() => {
        // Cargar datos de autenticación desde localStorage
        const token = localStorage.getItem('access_token');
        const userStr = localStorage.getItem('user');

        if (token && userStr) {
            try {
                const user = JSON.parse(userStr);
                dispatch({
                    type: 'LOGIN_SUCCESS',
                    payload: { user, token },
                });
            } catch (error) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('user');
            }
        }
    }, []);

    const login = async (credentials: LoginCredentials) => {
        dispatch({ type: 'LOGIN_REQUEST' });

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
            });

            const data: AuthResponse = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error en el login');
            }

            // Guardar en localStorage
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));

            dispatch({
                type: 'LOGIN_SUCCESS',
                payload: { user: data.user, token: data.access_token },
            });
        } catch (error) {
            dispatch({
                type: 'LOGIN_FAILURE',
                payload: error instanceof Error ? error.message : 'Error desconocido',
            });
            throw error;
        }
    };

    const register = async (credentials: RegisterCredentials) => {
        dispatch({ type: 'REGISTER_REQUEST' });

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error en el registro');
            }

            // Después de registrar, hacer login automático
            await login({ email: credentials.email, password: credentials.password });
        } catch (error) {
            dispatch({
                type: 'REGISTER_FAILURE',
                payload: error instanceof Error ? error.message : 'Error desconocido',
            });
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        dispatch({ type: 'LOGOUT' });
    };

    const updateUser = (user: Partial<User>) => {
        if (state.user) {
            const updatedUser = { ...state.user, ...user };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            dispatch({ type: 'UPDATE_USER', payload: user });
        }
    };

    const value = {
        ...state,
        login,
        register,
        logout,
        updateUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};