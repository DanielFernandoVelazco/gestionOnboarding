import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
    const { isDarkMode, toggleTheme } = useTheme();
    const { user } = useAuth();

    return (
        <header className="sticky top-0 z-10 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-background-dark/80 backdrop-blur-sm">
            <div className="flex items-center justify-between px-8 py-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Bienvenido, {user?.nombre || 'Administrador'}
                    </h2>
                    <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="material-symbols-outlined text-xs">calendar_today</span>
                        {new Date().toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Botón de notificaciones */}
                    <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative">
                        <span className="material-symbols-outlined">notifications</span>
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                            0
                        </span>
                    </button>

                    {/* Separador */}
                    <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>

                    {/* Botón de tema */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                    >
                        {isDarkMode ? (
                            <span className="material-symbols-outlined text-yellow-500">light_mode</span>
                        ) : (
                            <span className="material-symbols-outlined text-gray-600">dark_mode</span>
                        )}
                    </button>

                    {/* Separador */}
                    <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>

                    {/* Perfil de usuario */}
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {user?.nombre || 'Usuario'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {user?.rol === 'superadmin' ? 'Super Admin' : 'Admin'}
                            </p>
                        </div>
                        <div
                            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border-2 border-gray-200 dark:border-gray-700"
                            style={{ backgroundImage: `url(${user?.avatarUrl || 'https://via.placeholder.com/40'})` }}
                        />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;