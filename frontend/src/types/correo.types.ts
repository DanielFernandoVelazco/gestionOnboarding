export interface HistorialCorreo {
    id: number;
    destinatario: string;
    asunto: string;
    cuerpo?: string;
    enviado: boolean;
    error?: string;
    tipo?: string;
    metadata?: any;
    fecha_envio: Date;
    fecha_lectura?: Date;
}

export interface CrearHistorialCorreoDto {
    destinatario: string;
    asunto: string;
    cuerpo?: string;
    enviado?: boolean;
    error?: string;
    tipo?: string;
    metadata?: any;
}

export interface CorreoStats {
    total: number;
    enviados: number;
    errores: number;
    porTipo: Record<string, number>;
}

export interface PaginatedHistorial {
    data: HistorialCorreo[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}