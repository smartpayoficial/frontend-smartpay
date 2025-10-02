import React, { useState, useEffect, useCallback } from 'react';
import { PlusIcon, LockClosedIcon, MagnifyingGlassIcon, InformationCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

import { getFactoryReset, deleteAccount } from '../../api/factory_reset_protection';
import { getConfigurations, updateConfiguration } from '../../api/configuration';

import AccountTable from './components/AccountTable';
import ConfigurationTable from './components/ConfigurationTable';
import ConfigurationModal from './components/ConfigurationModal';
import BankContacts from './components/BankContacts';
import { SettingsIcon } from 'lucide-react';
import Swal from 'sweetalert2';

function ConfigurationPage() {
    const CLIENT_ID = "631597337466-dt7qitq7tg2022rhje5ib5sk0eua6t79.apps.googleusercontent.com";
    const REDIRECT_URI = "https://smartpay-oficial.com:9443/api/v1/google/auth/callback";
    const SCOPE = "profile email https://www.googleapis.com/auth/userinfo.profile";

    const [accounts, setAccounts] = useState([]);
    const [configurations, setConfigurations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingConfiguration, setEditingConfiguration] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [searchAccounts, setSearchAccounts] = useState('');
    const [searchConfig, setSearchConfig] = useState('');

    const fetchAccounts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getFactoryReset();
            setAccounts(data);
        } catch (err) {
            console.error('Error al cargar cuentas:', err);
            setError('No se pudieron cargar las cuentas para Factory Reset. Inténtalo de nuevo más tarde.');
            toast.error('Error al cargar cuentas.');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchConfigurations = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getConfigurations();
            setConfigurations(data);
        } catch (err) {
            console.error('Error al cargar configuraciones:', err);
            setError('No se pudieron cargar las configuraciones. Inténtalo de nuevo más tarde.');
            toast.error('Error al cargar configuraciones.');
        } finally {
            setLoading(false);
        }
    }, []);

    // Este useEffect se encargará de cargar los clientes y roles solo una vez al montar el componente.
    useEffect(() => {
        fetchAccounts();
        fetchConfigurations();
    }, [fetchAccounts, fetchConfigurations]);

    const handleOpenModal = (configuration = null) => {
        console.error("Data", configuration);
        setEditingConfiguration(configuration);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingConfiguration(null);
    };

    const handleSubmitConfiguration = async (configuration) => {
        Swal.fire({
            title: 'Actualizando configuracion...',
            text: 'Por favor espera',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            const dataToUpdate = { ...configuration };
            await updateConfiguration(editingConfiguration.configuration_id, dataToUpdate);
            Swal.close();
            Swal.fire({
                icon: 'success',
                title: '¡Actualizado!',
                text: `La configuracion ${configuration.key} ha sido actualizada.`,
                timer: 2500,
                timerProgressBar: true,
                showConfirmButton: false
            });
            fetchConfigurations(); // Vuelve a cargar los clientes después de una operación CRUD
        } catch (err) {
            Swal.close();
            console.error("Error saving configuration:", err);
            const errorMessage = err.response?.data?.detail || err.message || "Hubo un error al actualizar la configuración.";
            Swal.fire({
                icon: 'error',
                title: 'Error al actualizar',
                text: errorMessage,
                confirmButtonText: 'Ok'
            });
            toast.error(`Error al actualizar la configuración: ${errorMessage}`);
        } finally {
            handleCloseModal();
        }
    };

    const login = () => {
        const storedUser = localStorage.getItem("user"); // Usa la clave con la que guardaste el objeto
        if (!storedUser) {
            console.log("No se encontró el datos del usuario en el localStorage");
            return;
        }

        var storeId = null;
        try {
            const user = JSON.parse(storedUser); // Convertir de JSON a objeto
            storeId = user.store?.id; // Acceder al ID del store (usa optional chaining por seguridad)
            console.log("Store ID:", storeId);
        } catch (error) {
            console.error("Error al parsear el objeto del localStorage", error);
        }

        const state = encodeURIComponent(JSON.stringify({ storeId }));
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${encodeURIComponent(SCOPE)}&access_type=offline&prompt=consent&state=${state}`;
        window.location.href = authUrl;
    };

    const onDeleteAccount = async (factory_reset_protection_id) => {
        console.log("Llegue aqui");
        const confirmUnblock = window.confirm('¿Estás seguro de que quieres eliminar esta cuenta para el factory reset?');
        if (!confirmUnblock) return;
        try {
            await deleteAccount(factory_reset_protection_id);
            toast.success('Cuenta eliminada correctamente.');

            const newAccounts = accounts.filter(item => item.factory_reset_protection_id !== factory_reset_protection_id);
            setAccounts(newAccounts);
        } catch (err) {
            console.error('Error al desbloquear dispositivo:', err);
            const errorMessage = err.response?.data?.detail || err.message || 'Error desconocido';
            toast.error(`Error al desbloquear dispositivo: ${errorMessage}`);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto p-4 sm:p-6 lg:p-8 flex justify-center items-center h-screen">
                <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="ml-3 text-lg text-gray-700">Cargando cuentas...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-center text-red-600 bg-red-50 border border-red-200 rounded-lg shadow-md">
                <ExclamationCircleIcon className="mx-auto h-12 w-12 text-red-500 mb-3" />
                <h3 className="text-xl font-semibold mb-2">Error al cargar datos</h3>
                <p className="text-base">{error}</p>
                <button
                    onClick={fetchAccounts}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    // FILTRADO: Ahora el filtrado se realiza sobre el array `accounts` que ya está en el estado
    const filteredAccounts = accounts.filter(account => {
        const searchLower = searchAccounts.toLowerCase();

        return (account.email.toLowerCase().includes(searchLower) || account.name.toLowerCase().includes(searchLower) || account.account_id.toLowerCase().includes(searchLower));
    });

    const filteredConfigurations = configurations.filter(configuration => {
        const searchLower = searchConfig.toLowerCase();

        return (configuration.key.toLowerCase().includes(searchLower) || configuration.description.toLowerCase().includes(searchLower) || configuration.value.toLowerCase().includes(searchLower));
    });

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                    <LockClosedIcon className="h-8 w-8 mr-2 text-blue-600" />
                    Cuentas Factory Reset Protection
                </h1>
                <button
                    onClick={() => login()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <PlusIcon className="-ml-0.5 mr-2 h-5 w-5" />
                    Añadir Nueva cuenta
                </button>
            </div>

            <div className="mb-6">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                        type="text"
                        name="search"
                        id="search"
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500"
                        placeholder="Buscar cuenta por accountId, Nombre, Email..."
                        value={searchAccounts}
                        onChange={(e) => setSearchAccounts(e.target.value)}
                    />
                </div>
            </div>

            {filteredAccounts.length === 0 && !searchAccounts ? (
                <div className="p-6 text-center text-gray-500 bg-white shadow sm:rounded-lg">
                    <InformationCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No hay cuentas para mostrar</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Añade una nueva cuenta para empezar.
                    </p>
                    <div className="mt-6">
                        <button
                            onClick={() => login()}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <PlusIcon className="-ml-0.5 mr-2 h-5 w-5" />
                            Añadir Primera Cuenta
                        </button>
                    </div>
                </div>
            ) : filteredAccounts.length === 0 && searchAccounts ? (
                <div className="p-6 text-center text-gray-500 bg-white shadow sm:rounded-lg">
                    <InformationCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron cuentas</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Tu búsqueda de "<span className="font-semibold text-blue-600">{searchAccounts}</span>" no arrojó resultados. Intenta con otro término.
                    </p>
                </div>
            ) : (
                <AccountTable
                    accounts={filteredAccounts}
                    onDelete={onDeleteAccount}
                />
            )}

            <div className="flex justify-between items-center mb-6 border-b pb-4 pt-16">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                    <SettingsIcon className="h-8 w-8 mr-2 text-blue-600" />
                    Configuraciones
                </h1>
            </div>

            <div className="mb-6">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                        type="text"
                        name="search"
                        id="search"
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500"
                        placeholder="Buscar llave, descripción, valor"
                        value={searchConfig}
                        onChange={(e) => setSearchConfig(e.target.value)}
                    />
                </div>

                {filteredConfigurations.length === 0 && searchConfig ? (
                    <div className="p-6 text-center text-gray-500 bg-white shadow sm:rounded-lg">
                        <InformationCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron configuraciones</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Tu búsqueda de "<span className="font-semibold text-blue-600">{searchConfig}</span>" no arrojó resultados. Intenta con otro término.
                        </p>
                    </div>
                ) : (
                    <div className="pt-6">
                        <ConfigurationTable
                            configurations={filteredConfigurations}
                            onEdit={handleOpenModal}
                        />
                    </div>
                )}

                <ConfigurationModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    initialData={editingConfiguration}
                    onSubmit={handleSubmitConfiguration}
                />
            </div>

            <div className="pt-16">
                <BankContacts />
            </div>
        </div>

    );
}

export default ConfigurationPage;
