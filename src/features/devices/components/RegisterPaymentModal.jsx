import React, { useState, Fragment, } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Swal from 'sweetalert2';
import { XMarkIcon } from '@heroicons/react/24/outline';


const RegisterPaymentModal = ({ isOpen, onClose, onSubmit, plan, payments, isTelevision }) => {
    const date = getEffectivePaymentDate(payments, plan.initial_date, plan.period);
    const quotaValue = getQuotaValue(payments, plan);

    console.log("Value", quotaValue);

    const [formData, setFormData] = useState(() => ({
        value: quotaValue,
        method: '',
        state: 'Approved',
        date: date,
        reference: `PI-${Date.now()}`,
        ...(isTelevision 
            ? { television_id: plan.television_id } 
            : { device_id: plan.device_id }),
        plan_id: plan.plan_id
    }));

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const requiredFields = ['method', 'value', 'date'];
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
        console.log(formData);
        onSubmit(formData, isTelevision);
        onClose();
    };

    function getEffectivePaymentDate(payments, startDateStr, periodDays) {
        const paidDates = payments
            .filter(p => p.state === 'Approved')
            .map(p => new Date(p.date).toISOString().split('T')[0]);

        const startDate = new Date(startDateStr);
        let currentDate = new Date(startDate);
        const todayStr = new Date().toISOString().split('T')[0];

        // 🚨 Avanzamos al primer período antes de empezar
        currentDate.setDate(currentDate.getDate() + periodDays);

        // Iterar hasta encontrar la primera fecha no pagada
        while (true) {
            const currentDateStr = currentDate.toISOString().split('T')[0];
            if (!paidDates.includes(currentDateStr)) {
                return currentDateStr;
            }
            currentDate.setDate(currentDate.getDate() + periodDays);

            if (currentDateStr > todayStr && (currentDate - startDate) / (1000 * 60 * 60 * 24) > 365) {
                throw new Error("No se encontró una fecha válida en el rango esperado.");
            }
        }
    }

    function getQuotaValue(payments, plan) {
        var initialPayment = 0;
        if (Array.isArray(payments) && payments.length > 0) {
            initialPayment = payments[0].value;
        }

        const value = plan.value - initialPayment;
        const valorCuota = plan.quotas > 0 ? Math.round(value / Number(plan.quotas)).toFixed(2) : 0;
        return valorCuota;
    }

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog
                as="div"
                className="fixed inset-0 z-[9999] bg-gray-600 bg-opacity-50 flex items-center justify-center"
                onClose={onClose}
            >
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
                    <Dialog.Panel className="w-auto max-w-full transform overflow-visible rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                        <Dialog.Title
                        as="h3"
                        className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center"
                        >
                        Registrar Pago
                        <button
                            type="button"
                            className="inline-flex justify-center rounded-md border border-transparent bg-white text-sm font-medium text-gray-400 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                            onClick={onClose}
                        >
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                        </button>
                        </Dialog.Title>
                        <div className="mt-4">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                            <label
                                htmlFor="method"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Método de Pago *
                            </label>
                            <select
                                id="method"
                                name="method"
                                value={formData.method}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-72 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            >
                                <option value="">Selecciona un método</option>
                                <option value="Efectivo">Efectivo</option>
                                <option value="Transferencia">Transferencia Bancaria</option>
                                <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                                <option value="Consignación">Consignación Bancaria</option>
                            </select>
                            </div>

                            <div>
                            <label
                                htmlFor="value"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Monto del Pago *
                            </label>
                            <input
                                type="number"
                                id="value"
                                name="value"
                                value={parseInt(formData.value)}
                                onChange={handleChange}
                                required
                                min="1"
                                step="1"
                                className="mt-1 block w-72 shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                            </div>

                            <div>
                            <label
                                htmlFor="date"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Fecha de Pago *
                            </label>
                            <input
                                type="date"
                                name="date"
                                id="date"
                                disabled
                                value={formData.date}
                                onChange={handleChange}
                                className="mt-1 block w-72 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-100 cursor-not-allowed"
                            />
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Registrar Pago
                            </button>
                            </div>
                        </form>
                        </div>
                    </Dialog.Panel>
                    </Transition.Child>
                </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default RegisterPaymentModal;