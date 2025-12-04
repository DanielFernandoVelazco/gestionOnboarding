import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const navItems = [
        {
            name: 'Dashboard',
            path: '/',
            icon: 'dashboard',
            exact: true,
        },
        {
            name: 'Registro de Colaboradores',
            path: '/colaboradores/registro',
            icon: 'person_add',
        },
        {
            name: 'Tabla de Colaboradores',
            path: '/colaboradores/tabla',
            icon: 'table_view',
        },
        {
            name: 'Calendario de Onboardings',
            path: '/onboarding/calendario',
            icon: 'calendar_month',
        },
        {
            name: 'Alertas de Correo',
            path: '/notificaciones/alertas',
            icon: 'mark_email_unread',
        },
    ];

    return (
        <aside className="flex w-64 flex-col gap-y-6 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-4">
            <div className="flex h-full flex-col justify-between p-4">
                <div className="flex flex-col gap-4">
                    {/* Logo y Nombre de la App - Clickable para ir al Dashboard */}
                    <div
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer mb-2"
                        onClick={() => navigate('/')}
                    >
                        <div
                            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 flex items-center justify-center bg-primary"
                            style={{
                                backgroundImage: `url(${user?.avatarUrl || 'https://via.placeholder.com/40'})`,
                                backgroundColor: '#00448D'
                            }}
                        >
                            <span className="material-symbols-outlined text-white text-lg">rocket_launch</span>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-gray-900 dark:text-white text-base font-medium leading-normal">
                                {user?.nombre || 'Usuario'}
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">
                                Sistema de Onboarding
                            </p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex flex-col gap-2">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.exact}
                                className={({ isActive }) =>
                                    `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
                                }
                            >
                                <span className="material-symbols-outlined">{item.icon}</span>
                                <p className="text-sm font-medium leading-normal">{item.name}</p>
                            </NavLink>
                        ))}
                    </nav>
                </div>

                {/* Logout y Configuración */}
                <div className="flex flex-col gap-1">
                    <div className="h-px bg-gray-200 dark:bg-gray-700 my-2"></div>
                    <button
                        onClick={logout}
                        className="sidebar-link text-gray-500 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
                    >
                        <span className="material-symbols-outlined">logout</span>
                        <p className="text-sm font-medium">Cerrar Sesión</p>
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;