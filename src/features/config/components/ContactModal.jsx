import React, { useState, useEffect, Fragment, useRef } from 'react';
import DynamicForm from '../../../common/components/ui/DynamicForm';
import { getCurrentStoreId } from '../../../common/utils/helpers';
import { Dialog, Transition } from '@headlessui/react';

function ContactModal({ isOpen, onClose, onSubmit, initialData, accountTypes }) {
    const [formData, setFormData] = useState({
        contact_details: {},
        description: null,
        store_id: null,
        account_type_id: null,
    });
    const [selectedAccountType, setSelectedAccountType] = useState(null);
    const cancelButtonRef = useRef(null);

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
            const accountType = accountTypes.find(at => at.id === initialData.account_type_id);
            setSelectedAccountType(accountType);
        } else {
            setFormData({
                contact_details: {},
                description: null,
                store_id: getCurrentStoreId(),
                account_type_id: null,
            });
            setSelectedAccountType(null);
        }
    }, [initialData, accountTypes]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            contact_details: {
                ...prev.contact_details,
                [name]: value
            }
        }));
    };

    const handleAccountTypeChange = (e) => {
        const accountTypeId = e.target.value;
        const accountType = accountTypes.find(at => at.id === parseInt(accountTypeId));
        setSelectedAccountType(accountType);
        setFormData(prev => ({ ...prev, account_type_id: accountTypeId }));
    };

    const handleSubmitWrapper = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    if (!isOpen) return null;

    const dynamicFields = selectedAccountType
        ? selectedAccountType.form_schema.map(field => ({
            ...field,
            value: formData.contact_details?.[field.name] || ""
        }))
        : [];

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose} initialFocus={cancelButtonRef}>
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
                            <Dialog.Panel className="w-full max-w-2xl transform rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                                    {initialData ? 'Editar Contacto' : 'Crear Contacto'}
                                </Dialog.Title>

                                <form onSubmit={handleSubmitWrapper} className="mt-4 grid grid-cols-1 gap-4">
                                    <div>
                                        <label htmlFor="account_type" className="block text-sm font-medium text-gray-700">
                                            Tipo de Cuenta
                                        </label>
                                        <select
                                            disabled={initialData}
                                            id="account_type"
                                            name="account_type_id"
                                            value={formData.account_type_id || ''}
                                            onChange={handleAccountTypeChange}
                                            required
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                        >
                                            <option value="">Seleccione un tipo de cuenta</option>
                                            {accountTypes.map(at => (
                                                <option key={at.id} value={at.id}>{at.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {selectedAccountType && (
                                        <DynamicForm
                                            fields={dynamicFields}
                                            formData={formData.contact_details || {}}
                                            handleInputChange={handleInputChange}
                                        />
                                    )}

                                    <div className="mt-6 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            ref={cancelButtonRef}
                                            className="inline-flex justify-center rounded-md border border-transparent bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                                            onClick={onClose}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

export default ContactModal;
