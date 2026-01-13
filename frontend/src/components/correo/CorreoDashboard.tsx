// frontend/src/components/correo/CorreoDashboard.jsx
import React, { useState } from 'react';
import {
    Box,
    Tabs,
    Tab,
    Typography,
    Container,
    Grid,
    Paper,
    Card,
    CardContent,
    CardHeader,
    Avatar,
    LinearProgress
} from '@mui/material';
import {
    Email,
    History,
    Send,
    BarChart,
    CheckCircle,
    Error as ErrorIcon
} from '@mui/icons-material';
import HistorialCorreos from './HistorialCorreos';
import EnviarCorreo from './EnviarCorreo';
import EstadisticasCorreo from './EstadisticasCorreo';
import correoService from '../../services/correoService';

const CorreoDashboard = () => {
    const [tabValue, setTabValue] = useState(0);
    const [estadisticas, setEstadisticas] = useState({
        total: 0,
        enviados: 0,
        errores: 0,
        tasaExito: 0
    });

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const TabPanel = ({ children, value, index, ...other }) => {
        return (
            <div
                role="tabpanel"
                hidden={value !== index}
                {...other}
            >
                {value === index && (
                    <Box sx={{ pt: 3 }}>
                        {children}
                    </Box>
                )}
            </div>
        );
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            {/* Encabezado */}
            <Paper elevation={3} sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ mr: 2, bgcolor: 'white', color: 'primary.main' }}>
                        <Email />
                    </Avatar>
                    <Box>
                        <Typography variant="h4" component="h1">
                            Sistema de Gestión de Correos
                        </Typography>
                        <Typography variant="subtitle1">
                            Registro y seguimiento de todos los correos enviados
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            {/* Estadísticas rápidas */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardHeader
                            avatar={
                                <Avatar sx={{ bgcolor: 'primary.main' }}>
                                    <Email />
                                </Avatar>
                            }
                            title="Total Envíos"
                            subheader="Registros totales"
                        />
                        <CardContent>
                            <Typography variant="h4" align="center">
                                {estadisticas.total}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardHeader
                            avatar={
                                <Avatar sx={{ bgcolor: 'success.main' }}>
                                    <CheckCircle />
                                </Avatar>
                            }
                            title="Envíos Exitosos"
                            subheader="Correos enviados"
                        />
                        <CardContent>
                            <Typography variant="h4" align="center" color="success.main">
                                {estadisticas.enviados}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardHeader
                            avatar={
                                <Avatar sx={{ bgcolor: 'error.main' }}>
                                    <ErrorIcon />
                                </Avatar>
                            }
                            title="Errores"
                            subheader="Envíos fallidos"
                        />
                        <CardContent>
                            <Typography variant="h4" align="center" color="error.main">
                                {estadisticas.errores}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardHeader
                            avatar={
                                <Avatar sx={{ bgcolor: 'info.main' }}>
                                    <BarChart />
                                </Avatar>
                            }
                            title="Tasa de Éxito"
                            subheader="Porcentaje exitoso"
                        />
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Box sx={{ width: '100%', mr: 1 }}>
                                    <LinearProgress
                                        variant="determinate"
                                        value={estadisticas.tasaExito}
                                        color={estadisticas.tasaExito > 80 ? "success" : "warning"}
                                    />
                                </Box>
                                <Box sx={{ minWidth: 35 }}>
                                    <Typography variant="body2" color="textSecondary">
                                        {`${Math.round(estadisticas.tasaExito)}%`}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Tabs principales */}
            <Paper elevation={3}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        variant="scrollable"
                        scrollButtons="auto"
                    >
                        <Tab
                            icon={<Send />}
                            iconPosition="start"
                            label="Enviar Correo"
                        />
                        <Tab
                            icon={<History />}
                            iconPosition="start"
                            label="Historial"
                        />
                        <Tab
                            icon={<BarChart />}
                            iconPosition="start"
                            label="Estadísticas"
                        />
                    </Tabs>
                </Box>

                <TabPanel value={tabValue} index={0}>
                    <EnviarCorreo />
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    <HistorialCorreos />
                </TabPanel>

                <TabPanel value={tabValue} index={2}>
                    <EstadisticasCorreo />
                </TabPanel>
            </Paper>
        </Container>
    );
};

export default CorreoDashboard;