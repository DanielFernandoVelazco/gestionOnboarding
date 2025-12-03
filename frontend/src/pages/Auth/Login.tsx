import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const Login = () => {
    const navigate = useNavigate();
    const { login, isLoading, error } = useAuth();
    const [credentials, setCredentials] = useState({
        email: '',
        password: '',
    });
    const [formError, setFormError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        if (!credentials.email || !credentials.password) {
            setFormError('Por favor, completa todos los campos');
            return;
        }

        try {
            await login(credentials);
            navigate('/');
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Error al iniciar sesión');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCredentials({
            ...credentials,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Gestión de Onboarding
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Inicia sesión para continuar
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <Input
                                label="Correo electrónico"
                                type="email"
                                name="email"
                                value={credentials.email}
                                onChange={handleChange}
                                placeholder="admin@onboarding.com"
                                required
                                icon={
                                    <span className="material-symbols-outlined">mail</span>
                                }
                            />
                        </div>

                        <div>
                            <Input
                                label="Contraseña"
                                type="password"
                                name="password"
                                value={credentials.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                                icon={
                                    <span className="material-symbols-outlined">lock</span>
                                }
                            />
                        </div>

                        {(error || formError) && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    {error || formError}
                                </p>
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="remember"
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <label htmlFor="remember" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                                    Recordarme
                                </label>
                            </div>
                            <button
                                type="button"
                                className="text-sm text-primary hover:text-primary-hover font-medium"
                            >
                                ¿Olvidaste tu contraseña?
                            </button>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            loading={isLoading}
                            className="w-full"
                        >
                            <span className="material-symbols-outlined mr-2">login</span>
                            Iniciar Sesión
                        </Button>

                        <div className="text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Credenciales por defecto: admin@onboarding.com / Admin123
                            </p>
                        </div>
                    </form>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        © {new Date().getFullYear()} Sistema de Gestión de Onboarding
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;