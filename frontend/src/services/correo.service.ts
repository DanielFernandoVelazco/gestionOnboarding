import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
    HistorialCorreo,
    CrearHistorialCorreoDto,
    CorreoStats,
    PaginatedHistorial
} from '../types/correo.types';

@Injectable({
    providedIn: 'root'
})
export class CorreoService {
    private apiUrl = `${environment.apiUrl}/correo`;

    constructor(private http: HttpClient) { }

    // Registrar un nuevo envío de correo
    registrarEnvio(datos: CrearHistorialCorreoDto): Observable<HistorialCorreo> {
        return this.http.post<HistorialCorreo>(`${this.apiUrl}/registrar`, datos);
    }

    // Obtener historial paginado
    obtenerHistorial(
        page: number = 1,
        limit: number = 20,
        filters?: {
            destinatario?: string;
            tipo?: string;
            enviado?: boolean;
            fechaDesde?: Date;
            fechaHasta?: Date;
        }
    ): Observable<PaginatedHistorial> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());

        if (filters) {
            if (filters.destinatario) {
                params = params.set('destinatario', filters.destinatario);
            }
            if (filters.tipo) {
                params = params.set('tipo', filters.tipo);
            }
            if (filters.enviado !== undefined) {
                params = params.set('enviado', filters.enviado.toString());
            }
            if (filters.fechaDesde) {
                params = params.set('fechaDesde', filters.fechaDesde.toISOString());
            }
            if (filters.fechaHasta) {
                params = params.set('fechaHasta', filters.fechaHasta.toISOString());
            }
        }

        return this.http.get<PaginatedHistorial>(`${this.apiUrl}/historial`, { params });
    }

    // Buscar por destinatario
    buscarPorDestinatario(email: string): Observable<HistorialCorreo[]> {
        return this.http.get<HistorialCorreo[]>(`${this.apiUrl}/destinatario/${encodeURIComponent(email)}`);
    }

    // Obtener por ID
    obtenerPorId(id: number): Observable<HistorialCorreo> {
        return this.http.get<HistorialCorreo>(`${this.apiUrl}/${id}`);
    }

    // Marcar como leído
    marcarComoLeido(id: number): Observable<HistorialCorreo> {
        return this.http.patch<HistorialCorreo>(`${this.apiUrl}/marcar-leido/${id}`, {});
    }

    // Obtener estadísticas
    obtenerEstadisticas(tipo?: string): Observable<CorreoStats> {
        const url = tipo
            ? `${this.apiUrl}/estadisticas/tipo/${tipo}`
            : `${this.apiUrl}/estadisticas`;

        return this.http.get<CorreoStats>(url);
    }

    // Eliminar historial
    eliminarHistorial(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    // Helper para registrar error de envío
    registrarError(destinatario: string, asunto: string, error: string, tipo?: string): Observable<HistorialCorreo> {
        const datos: CrearHistorialCorreoDto = {
            destinatario,
            asunto,
            enviado: false,
            error,
            tipo
        };

        return this.registrarEnvio(datos);
    }
}