export interface User {
    id: string;
    nombre: string;
    email: string;
    rol: string;
    avatarUrl?: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials {
    nombre: string;
    email: string;
    password: string;
    avatarUrl?: string;
}

export interface AuthResponse {
    access_token: string;
    user: User;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    error: string | null;
}