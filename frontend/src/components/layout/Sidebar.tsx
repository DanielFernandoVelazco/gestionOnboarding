import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = () => {
    const { user, logout } = useAuth();

    const navItems = [
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
                    {/* User info */}
                    <div className="flex items-center gap-3 p-2">
                        <div
                            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
                            style={{ backgroundImage: `url(${user?.avatarUrl || 'https://via.placeholder.com/40'})` }}
                        />
                        <div className="flex flex-col">
                            <h1 className="text-gray-900 dark:text-white text-base font-medium leading-normal">
                                {user?.nombre || 'Usuario'}
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">
                                {user?.rol === 'superadmin' ? 'Super Admin' : 'Admin'}
                            </p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex flex-col gap-2 mt-4">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
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

                {/* Logout */}
                <div className="flex flex-col gap-1">
                    <button
                        onClick={logout}
                        className="sidebar-link text-gray-500 dark:text-gray-300"
                    >
                        <span className="material-symbols-outlined text-gray-700 dark:text-gray-300">logout</span>
                        <p className="text-sm font-medium">Cerrar Sesión</p>
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;