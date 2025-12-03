import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Layout
import Layout from '../components/layout/Layout';

// Pages
import Login from '../pages/Auth/Login';
import Dashboard from '../pages/Dashboard';
import RegistroColaboradores from '../pages/Colaboradores/Registro';
import TablaColaboradores from '../pages/Colaboradores/Tabla';
import CalendarioOnboardings from '../pages/Onboarding/Calendario';
import AlertasCorreo from '../pages/Notificaciones/Alertas';
import NotFound from '../pages/NotFound';

// Componente para rutas protegidas
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return user ? <>{children}</> : <Navigate to="/login" />;
};

const AppRouter = () => {
    return (
        <Routes>
            {/* Rutas públicas */}
            <Route path="/login" element={<Login />} />

            {/* Rutas protegidas */}
            <Route path="/" element={
                <PrivateRoute>
                    <Layout />
                </PrivateRoute>
            }>
                <Route index element={<Dashboard />} />
                <Route path="colaboradores">
                    <Route path="registro" element={<RegistroColaboradores />} />
                    <Route path="tabla" element={<TablaColaboradores />} />
                </Route>
                <Route path="onboarding">
                    <Route path="calendario" element={<CalendarioOnboardings />} />
                </Route>
                <Route path="notificaciones">
                    <Route path="alertas" element={<AlertasCorreo />} />
                </Route>
            </Route>

            {/* Ruta 404 */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};

export default AppRouter;