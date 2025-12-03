import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
            <div className="text-center">
                <h1 className="text-9xl font-bold text-primary mb-4">404</h1>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                    Página no encontrada
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                    Lo sentimos, la página que estás buscando no existe o ha sido movida.
                </p>
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-hover transition-colors"
                >
                    <span className="material-symbols-outlined">home</span>
                    Volver al inicio
                </Link>
            </div>
        </div>
    );
};

export default NotFound;