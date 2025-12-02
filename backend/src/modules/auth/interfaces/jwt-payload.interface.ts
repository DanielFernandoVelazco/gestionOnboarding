export interface JwtPayload {
    sub: string; // userId
    email: string;
    rol: string;
    nombre: string;
}

export interface JwtResponse {
    access_token: string;
    user: {
        id: string;
        email: string;
        nombre: string;
        rol: string;
        avatarUrl?: string;
    };
}