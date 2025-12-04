import { createContext, useContext, useState, ReactNode } from 'react';

interface Toast {
    id: number;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}

interface ToastContextType {
    showToast: (toast: Omit<Toast, 'id'>) => void;
    hideToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast debe ser usado dentro de ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = (toast: Omit<Toast, 'id'>) => {
        const id = Date.now();
        const newToast = { ...toast, id };

        setToasts(prev => [...prev, newToast]);

        // Auto-remove toast after duration
        const duration = toast.duration || 5000;
        setTimeout(() => {
            hideToast(id);
        }, duration);
    };

    const hideToast = (id: number) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast, hideToast }}>
            {children}

            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-50 space-y-2">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 ${toast.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
                            toast.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
                                toast.type === 'warning' ? 'bg-yellow-50 border border-yellow-200 text-yellow-800' :
                                    'bg-blue-50 border border-blue-200 text-blue-800'
                            }`}
                    >
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined">
                                {toast.type === 'success' ? 'check_circle' :
                                    toast.type === 'error' ? 'error' :
                                        toast.type === 'warning' ? 'warning' : 'info'}
                            </span>
                            <div className="flex-1">
                                <h4 className="font-medium">{toast.title}</h4>
                                <p className="text-sm mt-1">{toast.message}</p>
                                {toast.action && (
                                    <button
                                        onClick={toast.action.onClick}
                                        className="text-sm font-medium mt-2 hover:underline"
                                    >
                                        {toast.action.label}
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={() => hideToast(toast.id)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};