import React, { useState, useEffect, useCallback } from 'react';
import PaymentTable from './components/PaymentTable.jsx';
import PaymentsFlow from './PaymentsFlow.jsx';

import { PlusIcon, ExclamationCircleIcon, LifebuoyIcon } from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';

import { getPayments, createPayment } from '../../api/payments';
import { getUsers } from '../../api/users';
import { getPlans, createPlan, uploadContract } from '../../api/plans';
import { getStoreById } from '../../api/stores';
import { getCurrentUser } from '../../common/utils/helpers.js';

const PaymentManagementPage = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [newInvoiceData, setNewInvoiceData] = useState({});
    const [customers, setCustomers] = useState([]);
    const [plans, setPlans] = useState([]);

    // Nuevos estados para la gestión de licencias
    const [tokensAvailable, setTokensAvailable] = useState(0);
    const [devicesUsed, setDevicesUsed] = useState(0);
    const [loadingLicenses, setLoadingLicenses] = useState(true);
    const [isSaleInProgress, setIsSaleInProgress] = useState(false);
    const [initLoading, setInitLoading] = useState(true);

    const fetchPayments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getPayments();
            setPayments(data);
        } catch (err) {
            console.error('Error al cargar pagos:', err);
            setError('No se pudieron cargar los pagos. Inténtalo de nuevo más tarde.');
            toast.error('Error al cargar pagos.');
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Método para cargar planes 
     */
    const fetchPlans = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
              const plans = await getPlans();
            setPlans(plans);
            // Dispositivos usados segun cantidad de planes (evita carrera con fetchLicenses)
            setDevicesUsed(Array.isArray(plans) ? plans.length : 0);
        } catch (err) {
            console.error('Error al cargar pagos:', err);
            setError('No se pudieron cargar los pagos. Inténtalo de nuevo más tarde.');
            toast.error('Error al cargar pagos.');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchCustomers = useCallback(async () => {
        try {
            const data = await getUsers({ role_name: 'Cliente' });
            setCustomers(data);
        } catch (err) {
            console.error('Error al cargar clientes para facturación:', err);
            toast.error('Error al cargar la lista de clientes.');
        } 
    }, []);

    const fetchLicenses = useCallback(async () => {
        setLoadingLicenses(true);
        try {
            const currentUser = getCurrentUser();
            const storeId = currentUser?.store?.id;

            if (storeId) {
                const store = await getStoreById(storeId);
                setTokensAvailable(store.tokens_disponibles);
            }
        } catch (err) {
            console.error('Error al cargar licencias:', err);
        } finally {
            setLoadingLicenses(false);
        }
    }, []);

    useEffect(() => {
        const checkSaleStatus = () => {
            const savedState = localStorage.getItem('paymentFlowState');
            setIsSaleInProgress(!!savedState);
        };

        checkSaleStatus();

        const handleStorageChange = (e) => {
            if (e.key === 'paymentFlowState') {
                checkSaleStatus();
            }
        };

        window.addEventListener('storage', handleStorageChange);

        // Inicialización secuencial para asegurar validación antes de renderizar
        (async () => {
            setInitLoading(true);
            try {
                await fetchPlans();
                await fetchCustomers();
                await fetchLicenses();
            } finally {
                setInitLoading(false);
            }
        })();

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [fetchPlans, fetchCustomers, fetchLicenses]);

    const handleStartNewInvoice = () => {
        setNewInvoiceData({});
        setCurrentStep(1);
    };

    const handleBackToTable = () => {
        setCurrentStep(0);
        setNewInvoiceData({});
        localStorage.removeItem('paymentFlowState');
        setIsSaleInProgress(false);
    };

    const handleFlowReset = () => {
        localStorage.removeItem('paymentFlowState');
        setIsSaleInProgress(false);
    }

    const handleContactSupport = () => {
        window.open('https://wa.me/51933392072', '_blank', 'noopener,noreferrer');
    };

    const handlePaymentsFlowFinalize = async (finalData) => {
        console.log('FINAL DATA:;', finalData);

        Swal.fire({
            title: 'Registrando venta completa...',
            text: 'Por favor espera, esto puede tardar unos segundos.',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            const { customer, authenticatedUser, paymentPlan, initialPayment, signedContractFile } = finalData;
            
            const deviceId = finalData?.device?.device_id;
            const televisionId = finalData?.device?.television_id;

            const planPayload = {
                initial_date: paymentPlan.initial_date,
                quotas: paymentPlan.quotas,
                period: paymentPlan.frecuencia_dias,
                value: paymentPlan.value,
                contract: "Contrato digital generado",
                device_id: deviceId,
                television_id: televisionId,
                user_id: customer.user_id,
                vendor_id: authenticatedUser.user_id
            };
            console.log('Sending Plan Payload:', JSON.stringify(planPayload, null, 2));

            const planResponse = await createPlan(planPayload);
            console.log('Plan created:', planResponse);

            const planId = planResponse.plan_id;
            if (planResponse && planId) {
                const formData = new FormData();
                formData.append('plan_id', planResponse.plan_id);
                formData.append('file', signedContractFile);

                console.log(formData);


                await uploadContract(formData);
            }
            console.log('Plan created with ID:', planId);

            // --- Initial Payment Payload ---
            if (initialPayment.value !== null && initialPayment.value !== undefined && initialPayment.value !== '' && initialPayment.value > 0) {
                const initialPaymentPayload = {
                    value: initialPayment.value,
                    method: initialPayment.method,
                    state: initialPayment.state || 'Approved',
                    date: initialPayment.date,
                    reference: initialPayment.reference || `PI-${Date.now()}`,
                    device_id: deviceId,
                    television_id: televisionId,
                    plan_id: planId
                };

                console.log('Sending Initial Payment Payload:', JSON.stringify(initialPaymentPayload, null, 2));
                const paymentResponse = await createPayment(initialPaymentPayload);
                console.log('Initial Payment created:', paymentResponse);
            }

            Swal.close();
            Swal.fire({
                icon: 'success',
                title: '¡Venta Registrada con Éxito!',
                text: 'El dispositivo, el plan de pagos y el pago inicial han sido guardados.',
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false
            });

            fetchPlans();
            setCurrentStep(0);
            setNewInvoiceData({});
            localStorage.removeItem('paymentFlowState');
            setIsSaleInProgress(false);

        } catch (err) {
            Swal.close();
            console.error("Error al registrar la venta completa:", err);
            const errorMessage = err.response?.data?.detail || err.message || "Hubo un error inesperado al registrar la venta.";
            Swal.fire({
                icon: 'error',
                title: 'Error al Registrar Venta',
                text: `Detalle: ${errorMessage}`,
                confirmButtonText: 'Ok'
            });
            toast.error(`Error al registrar venta: ${errorMessage}`);
        }
    };

    const realTokensAvailable = tokensAvailable - devicesUsed;

    const renderHeader = () => {
        const canRegister = realTokensAvailable > 0;

        return (
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                    <span className="mr-2">💰</span> Ventas Realizadas
                </h1>
                {loadingLicenses ? (
                    <p className="text-gray-500">Cargando licencias...</p>
                ) : (
                    <>
                        {canRegister ? (
                            isSaleInProgress ? (
                                <button
                                    onClick={handleStartNewInvoice}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                    <PlusIcon className="-ml-0.5 mr-2 h-5 w-5" />
                                    Venta en Proceso... (Continuar)
                                </button>
                            ) : (
                                <button
                                    onClick={handleStartNewInvoice}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    <PlusIcon className="-ml-0.5 mr-2 h-5 w-5" />
                                    Registrar Nueva Factura de Venta
                                </button>
                            )
                        ) : (
                            <button
                                onClick={handleContactSupport}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400"
                            >
                                <LifebuoyIcon className="-ml-0.5 mr-2 h-5 w-5" />
                                Contacta a soporte para más licencias
                            </button>
                        )}
                    </>
                )}
            </div>
        );
    };

    const renderContent = () => {
        switch (currentStep) {
            case 0:
                if (loading) {
                    return (
                        <div className="flex justify-center items-center h-64">
                            <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="ml-3 text-lg text-gray-700">Cargando pagos...</p>
                        </div>
                    );
                }
                if (error) {
                    return (
                        <div className="text-center text-red-600 bg-red-50 border border-red-200 rounded-lg shadow-md p-6">
                            <ExclamationCircleIcon className="mx-auto h-12 w-12 text-red-500 mb-3" />
                            <h3 className="text-xl font-semibold mb-2">Error al cargar datos</h3>
                            <p className="text-base">{error}</p>
                            <button
                                onClick={fetchPlans}
                                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                Reintentar
                            </button>
                        </div>
                    );
                }
                return (
                    <>
                        {renderHeader()}
                        <PaymentTable payments={plans} />
                        {/* Mensaje condicional de licencias */}
                        {realTokensAvailable <= 0 && (
                            <div className="mt-8 p-6 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg shadow-md">
                                <h3 className="text-xl font-bold mb-2">¡Atención: Licencias Agotadas! ⚠️</h3>
                                <p className="text-lg">
                                    Para registrar más ventas, por favor contacta a soporte de SmartPay.
                                    {realTokensAvailable < 0 && (
                                        <> Si tienes licencias en negativo, por favor ponte al día con tus pagos.</>
                                    )}
                                </p>
                            </div>
                        )}
                    </>
                );
            case 1:
                return (
                    <PaymentsFlow
                        initialData={newInvoiceData}
                        onFinalize={handlePaymentsFlowFinalize}
                        onBackToParent={handleBackToTable}
                        onReset={handleFlowReset}
                        customers={customers}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="container bg-white rounded-xl mx-auto p-4 sm:p-6 lg:p-8">
            {/* Loader de inicialización del módulo */}
            {initLoading ? (
                <div className="flex flex-col justify-center items-center h-64">
                    <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-3 text-lg text-gray-700">Se está cargando el módulo...</p>
                </div>
            ) : realTokensAvailable <= 0 ? (
                // Pantalla de validación de licencias insuficientes
                <div className="max-w-2xl mx-auto text-center p-8 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <h2 className="text-2xl font-bold text-yellow-800 mb-2">Necesitas obtener más licencias</h2>
                    <p className="text-yellow-700 mb-6">No cuentas con licencias disponibles para registrar nuevas ventas. Por favor adquiere más licencias para continuar.</p>
                    <div className="flex items-center justify-center space-x-3">
                        <button
                            onClick={handleContactSupport}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400"
                        >
                            <LifebuoyIcon className="-ml-0.5 mr-2 h-5 w-5" />
                            Contactar soporte para licencias
                        </button>
                    </div>
                </div>
            ) : (
                renderContent()
            )}
        </div>
    );
};

export default PaymentManagementPage;