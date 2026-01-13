// frontend/src/components/correo/EnviarCorreo.jsx
import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    Alert,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Snackbar,
    Card,
    CardContent,
    Divider
} from '@mui/material';
import {
    Send,
    Email,
    AttachFile,
    CheckCircle
} from '@mui/icons-material';
import correoService from '../../services/correoService';

const tiposCorreo = [
    { value: 'general', label: 'General' },
    { value: 'notificacion', label: 'Notificación' },
    { value: 'recordatorio', label: 'Recordatorio' },
    { value: 'bienvenida', label: 'Bienvenida' },
    { value: 'onboarding', label: 'Onboarding' },
    { value: 'calendario', label: 'Calendario' },
    { value: 'incidente', label: 'Incidente' },
];

const EnviarCorreo = () => {
    const [formData, setFormData] = useState({
        destinatario: '',
        asunto: '',
        cuerpo: '',
        tipo: 'general'
    });
    const [loading, setLoading] = useState(false);
    const [resultado, setResultado] = useState(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validaciones básicas
        if (!formData.destinatario || !formData.asunto || !formData.cuerpo) {
            setResultado({
                success: false,
                message: 'Por favor complete todos los campos requeridos'
            });
            return;
        }

        setLoading(true);
        setResultado(null);

        try {
            const resultado = await correoService.enviarYRegistrarCorreo(
                formData.destinatario,
                formData.asunto,
                formData.cuerpo,
                formData.tipo
            );

            setResultado(resultado);

            if (resultado.success) {
                // Limpiar formulario
                setFormData({
                    destinatario: '',
                    asunto: '',
                    cuerpo: '',
                    tipo: 'general'
                });
                setSnackbarOpen(true);
            }
        } catch (error) {
            setResultado({
                success: false,
                message: 'Error al enviar el correo',
                error: error.message
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };

    return (
        <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h5" component="h2" gutterBottom>
                <Email sx={{ mr: 1, verticalAlign: 'middle' }} />
                Enviar Correo
            </Typography>

            <Divider sx={{ my: 2 }} />

            <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Destinatario"
                            name="destinatario"
                            value={formData.destinatario}
                            onChange={handleChange}
                            required
                            type="email"
                            placeholder="ejemplo@empresa.com"
                            disabled={loading}
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth disabled={loading}>
                            <InputLabel>Tipo de Correo</InputLabel>
                            <Select
                                name="tipo"
                                value={formData.tipo}
                                onChange={handleChange}
                                label="Tipo de Correo"
                            >
                                {tiposCorreo.map((tipo) => (
                                    <MenuItem key={tipo.value} value={tipo.value}>
                                        {tipo.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Asunto"
                            name="asunto"
                            value={formData.asunto}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            placeholder="Ingrese el asunto del correo"
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Cuerpo del Mensaje"
                            name="cuerpo"
                            value={formData.cuerpo}
                            onChange={handleChange}
                            required
                            multiline
                            rows={6}
                            disabled={loading}
                            placeholder="Escriba el contenido del correo aquí..."
                            variant="outlined"
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                            <Button
                                variant="outlined"
                                onClick={() => setFormData({
                                    destinatario: '',
                                    asunto: '',
                                    cuerpo: '',
                                    tipo: 'general'
                                })}
                                disabled={loading}
                            >
                                Limpiar
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                startIcon={loading ? <CircularProgress size={20} /> : <Send />}
                                disabled={loading}
                                sx={{ minWidth: 120 }}
                            >
                                {loading ? 'Enviando...' : 'Enviar Correo'}
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </form>

            {resultado && (
                <Box sx={{ mt: 3 }}>
                    <Alert
                        severity={resultado.success ? "success" : "error"}
                        onClose={() => setResultado(null)}
                    >
                        {resultado.message}
                        {resultado.error && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                Detalle: {resultado.error}
                            </Typography>
                        )}
                    </Alert>
                </Box>
            )}

            {/* Panel de información */}
            <Card variant="outlined" sx={{ mt: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                        <CheckCircle sx={{ mr: 1, verticalAlign: 'middle' }} />
                        ¿Qué se registra?
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Cada correo enviado a través de este sistema se registra automáticamente en el historial,
                        incluyendo detalles como:
                    </Typography>
                    <Box component="ul" sx={{ pl: 2, mt: 1 }}>
                        <li><Typography variant="body2">Fecha y hora exacta de envío</Typography></li>
                        <li><Typography variant="body2">Estado (enviado o error)</Typography></li>
                        <li><Typography variant="body2">Tipo de correo</Typography></li>
                        <li><Typography variant="body2">Metadatos adicionales</Typography></li>
                        <li><Typography variant="body2">Fecha de lectura (si aplica)</Typography></li>
                    </Box>
                </CardContent>
            </Card>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                message="Correo enviado y registrado exitosamente"
            />
        </Paper>
    );
};

export default EnviarCorreo;