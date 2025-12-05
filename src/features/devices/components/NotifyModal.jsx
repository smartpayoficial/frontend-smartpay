import React, { useState, Fragment, } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Swal from 'sweetalert2';
import { XMarkIcon } from '@heroicons/react/24/outline';


const NotifyModal = ({ isOpen, onClose, onSubmit, deviceId, isTelevision }) => {
    
    console.log("device", deviceId);
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        type: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const requiredFields = ['title', 'message', 'type'];
        for (const field of requiredFields) {
            if (!formData[field]) {
                Swal.fire({
                    icon: 'error',
                    title: 'Campos requeridos',
                    text: 'Por favor, completa todos los campos obligatorios (*).',
                });
                return;
            }
        }

        const dataToSubmit = { ...formData };
        onSubmit(deviceId, dataToSubmit, isTelevision);
        onClose();
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="fixed inset-0 z-[9999] bg-gray-600 bg-opacity-50 flex items-center justify-center" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-25" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-4xl transform overflow-visible rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title
                                    as="h3"
                                    className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center"
                                >
                                    Nueva notificación
                                    <button
                                        type="button"
                                        className="inline-flex justify-center rounded-md border border-transparent bg-white text-sm font-medium text-gray-400 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                                        onClick={onClose}
                                    >
                                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </Dialog.Title>
                                <div className="mt-4">
                                    <form onSubmit={handleSubmit}>
                                        <div className="col-span-3">
                                            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Título *</label>
                                            <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} autoComplete='off' required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                        </div>

                                        <div className="pt-4">
                                            <label htmlFor="message" className="block text-sm font-medium text-gray-700">Mensaje *</label>
                                            <textarea type="text" name="message" id="message" rows={5} value={formData.message} onChange={handleChange} autoComplete='off' required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                                        </div>

                                        <div className="col-span-3 mb-4 pt-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de notificación *</label>
                                            <div className="flex items-center gap-6">
                                                <label className="flex items-center text-sm text-gray-700">
                                                <input
                                                    type="radio"
                                                    name="type"
                                                    value="notification"
                                                    checked={formData.type === 'notification'}
                                                    onChange={handleChange}
                                                    className="mr-2"
                                                />
                                                Notificación Push
                                                </label>
                                                <label className="flex items-center text-sm text-gray-700">
                                                <input
                                                    type="radio"
                                                    name="type"
                                                    value="dialog"
                                                    checked={formData.type === 'dialog'}
                                                    onChange={handleChange}
                                                    className="mr-2"
                                                />
                                                Diálogo
                                                </label>
                                            </div>
                                        </div>
                                        <div className="mt-6 col-span-full flex justify-end gap-3">
                                            <button
                                                type="submit"
                                                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                                            >
                                                Enviar notificación
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div >
            </Dialog >
        </Transition >
    );
};

export default NotifyModal;