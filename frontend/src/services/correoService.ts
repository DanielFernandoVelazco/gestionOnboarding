// frontend/src/services/correoService.js
import axios from 'axios';

const API_URL = 'http://localhost:3001/api/correo';

const correoService = {
    // Registrar un nuevo envío de correo
    registrarEnvio: async (correoData) => {
        try {
            const response = await axios.post(`${API_URL}/registrar`, correoData);
            return response.data;
        } catch (error) {
            console.error('Error al registrar envío de correo:', error);
            throw error;
        }
    },

    // Obtener historial de correos
    obtenerHistorial: async (limit = 50, offset = 0) => {
        try {
            const response = await axios.get(`${API_URL}/historial`, {
                params: { limit, offset }
            });
            return response.data;
        } catch (error) {
            console.error('Error al obtener historial de correos:', error);
            throw error;
        }
    },

    // Buscar correos por destinatario
    buscarPorDestinatario: async (email) => {
        try {
            const response = await axios.get(`${API_URL}/destinatario/${email}`);
            return response.data;
        } catch (error) {
            console.error('Error al buscar correos por destinatario:', error);
            throw error;
        }
    },

    // Marcar correo como leído
    marcarComoLeido: async (id) => {
        try {
            const response = await axios.patch(`${API_URL}/marcar-leido/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error al marcar correo como leído:', error);
            throw error;
        }
    },

    // Obtener estadísticas por tipo
    obtenerEstadisticasPorTipo: async (tipo) => {
        try {
            const response = await axios.get(`${API_URL}/estadisticas/tipo/${tipo}`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            throw error;
        }
    },

    // Enviar correo y registrar (función combinada)
    enviarYRegistrarCorreo: async (destinatario, asunto, cuerpo, tipo = 'general') => {
        try {
            // Aquí integrarías con tu servicio real de envío de correos
            // Por ahora solo registramos en el historial
            const registro = await correoService.registrarEnvio({
                destinatario,
                asunto,
                cuerpo,
                tipo,
                enviado: true
            });

            // Aquí iría la lógica real de envío usando tu servicio de correo
            // await mailService.enviarCorreo(destinatario, asunto, cuerpo);

            return {
                success: true,
                message: 'Correo enviado y registrado exitosamente',
                data: registro
            };
        } catch (error) {
            // Registrar error
            await correoService.registrarEnvio({
                destinatario,
                asunto,
                cuerpo,
                tipo,
                enviado: false,
                error: error.message
            });

            return {
                success: false,
                message: 'Error al enviar el correo',
                error: error.message
            };
        }
    }
};

export default correoService;