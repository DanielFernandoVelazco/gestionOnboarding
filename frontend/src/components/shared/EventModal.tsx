import React from 'react';
import { Dialog } from '@headlessui/react';
import Button from '../ui/Button';

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: any;
}

const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, event }) => {
    if (!event) return null;

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="mx-auto max-w-md rounded-xl bg-white dark:bg-gray-800 p-6 shadow-lg">
                    <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {event.titulo}
                    </Dialog.Title>

                    <div className="space-y-3">
                        {event.descripcion && (
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {event.descripcion}
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">Fecha:</span>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {new Date(event.fechaInicio).toLocaleDateString('es-ES', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </p>
                            </div>

                            {event.ubicacion && (
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400">Ubicación:</span>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {event.ubicacion}
                                    </p>
                                </div>
                            )}

                            {event.enlaceVirtual && (
                                <div className="col-span-2">
                                    <span className="text-gray-500 dark:text-gray-400">Enlace:</span>
                                    <a
                                        href={event.enlaceVirtual}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-medium text-primary hover:text-primary-hover block truncate"
                                    >
                                        {event.enlaceVirtual}
                                    </a>
                                </div>
                            )}
                        </div>

                        {event.notas && (
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">Notas:</span>
                                <p className="text-gray-900 dark:text-white">{event.notas}</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <Button variant="secondary" onClick={onClose}>
                            Cerrar
                        </Button>
                        <Button variant="primary" onClick={() => {
                            console.log('Editar evento:', event.id);
                            onClose();
                        }}>
                            Editar
                        </Button>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};

export default EventModal;