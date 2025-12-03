import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';

interface ToastProps {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, duration = 5000, onClose }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const typeConfig = {
        success: {
            icon: 'check_circle',
            bgColor: 'bg-green-100 dark:bg-green-900/30',
            textColor: 'text-green-800 dark:text-green-300',
            borderColor: 'border-green-200 dark:border-green-800',
        },
        error: {
            icon: 'error',
            bgColor: 'bg-red-100 dark:bg-red-900/30',
            textColor: 'text-red-800 dark:text-red-300',
            borderColor: 'border-red-200 dark:border-red-800',
        },
        info: {
            icon: 'info',
            bgColor: 'bg-blue-100 dark:bg-blue-900/30',
            textColor: 'text-blue-800 dark:text-blue-300',
            borderColor: 'border-blue-200 dark:border-blue-800',
        },
        warning: {
            icon: 'warning',
            bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
            textColor: 'text-yellow-800 dark:text-yellow-300',
            borderColor: 'border-yellow-200 dark:border-yellow-800',
        },
    };

    const config = typeConfig[type];

    return (
        <div
            className={clsx(
                'fixed top-4 right-4 z-50 max-w-sm w-full transform transition-all duration-300',
                isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
            )}
        >
            <div
                className={clsx(
                    'rounded-lg border p-4 shadow-lg',
                    config.bgColor,
                    config.borderColor
                )}
            >
                <div className="flex items-start">
                    <span className={`material-symbols-outlined mr-3 ${config.textColor}`}>
                        {config.icon}
                    </span>
                    <div className="flex-1">
                        <p className={clsx('text-sm font-medium', config.textColor)}>
                            {message}
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setIsVisible(false);
                            setTimeout(onClose, 300);
                        }}
                        className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Toast;