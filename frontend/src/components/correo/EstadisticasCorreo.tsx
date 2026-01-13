// frontend/src/components/correo/EstadisticasCorreo.jsx
import React, { useState, useEffect } from 'react';
import {
    Paper,
    Typography,
    Grid,
    Box,
    Card,
    CardContent,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip
} from '@mui/material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import correoService from '../../services/correoService';
import dayjs from 'dayjs';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const EstadisticasCorreo = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [periodo, setPeriodo] = useState('mes');
    const [datos, setDatos] = useState({
        porTipo: [],
        porDia: [],
        resumen: {}
    });

    const cargarEstadisticas = async () => {
        try {
            setLoading(true);
            // Aquí cargarías los datos reales del backend
            // Por ahora usamos datos de ejemplo
            const datosEjemplo = {
                porTipo: [
                    { tipo: 'notificacion', cantidad: 45, exitosos: 40 },
                    { tipo: 'recordatorio', cantidad: 30, exitosos: 28 },
                    { tipo: 'bienvenida', cantidad: 25, exitosos: 24 },
                    { tipo: 'onboarding', cantidad: 50, exitosos: 48 },
                    { tipo: 'general', cantidad: 20, exitosos: 18 }
                ],
                porDia: Array.from({ length: 30 }, (_, i) => ({
                    fecha: dayjs().subtract(29 - i, 'day').format('DD/MM'),
                    cantidad: Math.floor(Math.random() * 20) + 5,
                    exitosos: Math.floor(Math.random() * 18) + 4
                })),
                resumen: {
                    total: 170,
                    enviados: 158,
                    errores: 12,
                    tasaExito: 92.9,
                    promedioDiario: 5.7
                }
            };

            setDatos(datosEjemplo);
            setError(null);
        } catch (err) {
            setError('Error al cargar estadísticas');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarEstadisticas();
    }, [periodo]);

    const handlePeriodoChange = (event) => {
        setPeriodo(event.target.value);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Selector de período */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                <FormControl sx={{ minWidth: 120 }} size="small">
                    <InputLabel>Período</InputLabel>
                    <Select
                        value={periodo}
                        label="Período"
                        onChange={handlePeriodoChange}
                    >
                        <MenuItem value="dia">Último día</MenuItem>
                        <MenuItem value="semana">Última semana</MenuItem>
                        <MenuItem value="mes">Último mes</MenuItem>
                        <MenuItem value="anio">Último año</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {/* Gráficos */}
            <Grid container spacing={3}>
                {/* Gráfico de barras por tipo */}
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Envíos por Tipo de Correo
                            </Typography>
                            <Box sx={{ height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={datos.porTipo}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="tipo" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="cantidad" name="Total Envíos" fill="#8884d8" />
                                        <Bar dataKey="exitosos" name="Exitosos" fill="#82ca9d" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Gráfico de pastel */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Distribución por Tipo
                            </Typography>
                            <Box sx={{ height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={datos.porTipo}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={(entry) => `${entry.tipo}: ${entry.cantidad}`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="cantidad"
                                        >
                                            {datos.porTipo.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Gráfico de tendencia diaria */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Tendencia de Envíos Diarios
                            </Typography>
                            <Box sx={{ height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={datos.porDia}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="fecha" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="cantidad" name="Total Diario" fill="#0088FE" />
                                        <Bar dataKey="exitosos" name="Exitosos" fill="#00C49F" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Tabla de resumen */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Resumen Estadístico
                            </Typography>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Tipo</TableCell>
                                            <TableCell align="right">Total</TableCell>
                                            <TableCell align="right">Exitosos</TableCell>
                                            <TableCell align="right">Errores</TableCell>
                                            <TableCell align="right">Tasa Éxito</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {datos.porTipo.map((item) => (
                                            <TableRow key={item.tipo}>
                                                <TableCell>
                                                    <Chip
                                                        label={item.tipo}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                                <TableCell align="right">{item.cantidad}</TableCell>
                                                <TableCell align="right">{item.exitosos}</TableCell>
                                                <TableCell align="right">{item.cantidad - item.exitosos}</TableCell>
                                                <TableCell align="right">
                                                    {((item.exitosos / item.cantidad) * 100).toFixed(1)}%
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default EstadisticasCorreo;