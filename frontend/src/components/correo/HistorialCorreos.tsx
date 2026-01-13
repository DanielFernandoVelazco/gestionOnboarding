// frontend/src/components/correo/HistorialCorreos.jsx
import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    TextField,
    Button,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    CircularProgress,
    Alert,
    Tooltip,
    Pagination
} from '@mui/material';
import {
    Visibility,
    Email,
    CheckCircle,
    Error as ErrorIcon,
    Search,
    Refresh,
    FilterList
} from '@mui/icons-material';
import correoService from '../../services/correoService';
import dayjs from 'dayjs';

const HistorialCorreos = () => {
    const [historial, setHistorial] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filtroEmail, setFiltroEmail] = useState('');
    const [correoDetalle, setCorreoDetalle] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const itemsPorPagina = 10;

    const cargarHistorial = async (pagina = 1) => {
        try {
            setLoading(true);
            const offset = (pagina - 1) * itemsPorPagina;
            const data = await correoService.obtenerHistorial(itemsPorPagina, offset);
            setHistorial(data);
            setTotalPaginas(Math.ceil(data.length / itemsPorPagina));
            setError(null);
        } catch (err) {
            setError('Error al cargar el historial de correos');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const buscarPorDestinatario = async () => {
        if (!filtroEmail.trim()) {
            cargarHistorial();
            return;
        }

        try {
            setLoading(true);
            const data = await correoService.buscarPorDestinatario(filtroEmail);
            setHistorial(data);
            setError(null);
        } catch (err) {
            setError('Error al buscar correos');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const verDetalle = async (id) => {
        try {
            const correo = historial.find(c => c.id === id);
            if (correo) {
                setCorreoDetalle(correo);
                setDialogOpen(true);

                // Si no está marcado como leído, marcarlo
                if (!correo.fecha_lectura) {
                    await correoService.marcarComoLeido(id);
                    // Actualizar en el estado local
                    setHistorial(prev => prev.map(c =>
                        c.id === id ? { ...c, fecha_lectura: new Date().toISOString() } : c
                    ));
                }
            }
        } catch (err) {
            console.error('Error al ver detalle:', err);
        }
    };

    useEffect(() => {
        cargarHistorial();
    }, []);

    const handlePageChange = (event, value) => {
        setPage(value);
        cargarHistorial(value);
    };

    const getEstadoChip = (enviado, error) => {
        if (enviado) {
            return (
                <Chip
                    icon={<CheckCircle />}
                    label="Enviado"
                    color="success"
                    size="small"
                    variant="outlined"
                />
            );
        } else {
            return (
                <Chip
                    icon={<ErrorIcon />}
                    label={`Error: ${error?.substring(0, 20)}...`}
                    color="error"
                    size="small"
                />
            );
        }
    };

    return (
        <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h2">
                    <Email sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Historial de Correos
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                        size="small"
                        placeholder="Filtrar por email..."
                        value={filtroEmail}
                        onChange={(e) => setFiltroEmail(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && buscarPorDestinatario()}
                        InputProps={{
                            startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
                        }}
                    />
                    <Button
                        variant="outlined"
                        startIcon={<FilterList />}
                        onClick={buscarPorDestinatario}
                    >
                        Buscar
                    </Button>
                    <Tooltip title="Refrescar">
                        <IconButton onClick={() => cargarHistorial(page)}>
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Destinatario</TableCell>
                                    <TableCell>Asunto</TableCell>
                                    <TableCell>Tipo</TableCell>
                                    <TableCell>Fecha Envío</TableCell>
                                    <TableCell>Estado</TableCell>
                                    <TableCell>Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {historial.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center">
                                            No hay registros de correos
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    historial.map((correo) => (
                                        <TableRow key={correo.id} hover>
                                            <TableCell>{correo.id}</TableCell>
                                            <TableCell>{correo.destinatario}</TableCell>
                                            <TableCell>
                                                <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                                                    {correo.asunto}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={correo.tipo || 'General'}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {dayjs(correo.fecha_envio).format('DD/MM/YYYY HH:mm')}
                                            </TableCell>
                                            <TableCell>
                                                {getEstadoChip(correo.enviado, correo.error)}
                                            </TableCell>
                                            <TableCell>
                                                <Tooltip title="Ver detalles">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => verDetalle(correo.id)}
                                                        color="primary"
                                                    >
                                                        <Visibility />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {totalPaginas > 1 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                            <Pagination
                                count={totalPaginas}
                                page={page}
                                onChange={handlePageChange}
                                color="primary"
                            />
                        </Box>
                    )}
                </>
            )}

            {/* Diálogo de detalle */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
                {correoDetalle && (
                    <>
                        <DialogTitle>
                            Detalle del Correo #{correoDetalle.id}
                            <Chip
                                label={correoDetalle.tipo || 'General'}
                                color="primary"
                                size="small"
                                sx={{ ml: 2 }}
                            />
                        </DialogTitle>
                        <DialogContent dividers>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    Destinatario:
                                </Typography>
                                <Typography variant="body1">
                                    {correoDetalle.destinatario}
                                </Typography>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    Asunto:
                                </Typography>
                                <Typography variant="body1">
                                    {correoDetalle.asunto}
                                </Typography>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    Cuerpo del mensaje:
                                </Typography>
                                <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'grey.50' }}>
                                    <Typography variant="body2" whiteSpace="pre-wrap">
                                        {correoDetalle.cuerpo || 'Sin contenido'}
                                    </Typography>
                                </Paper>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
                                <Box>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Fecha de envío:
                                    </Typography>
                                    <Typography variant="body2">
                                        {dayjs(correoDetalle.fecha_envio).format('DD/MM/YYYY HH:mm:ss')}
                                    </Typography>
                                </Box>

                                {correoDetalle.fecha_lectura && (
                                    <Box>
                                        <Typography variant="subtitle2" color="textSecondary">
                                            Fecha de lectura:
                                        </Typography>
                                        <Typography variant="body2">
                                            {dayjs(correoDetalle.fecha_lectura).format('DD/MM/YYYY HH:mm:ss')}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>

                            {correoDetalle.error && (
                                <Box>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Error:
                                    </Typography>
                                    <Alert severity="error" sx={{ mt: 1 }}>
                                        {correoDetalle.error}
                                    </Alert>
                                </Box>
                            )}

                            {correoDetalle.metadata && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Metadatos:
                                    </Typography>
                                    <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                                        <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                                            {JSON.stringify(correoDetalle.metadata, null, 2)}
                                        </pre>
                                    </Paper>
                                </Box>
                            )}
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setDialogOpen(false)} color="primary">
                                Cerrar
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Paper>
    );
};

export default HistorialCorreos;