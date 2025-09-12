import React, { useState, useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { getMdmStatusClass } from './utils/shared-functions';
import { getPlanById } from '../../api/plans';

const ClientMakePaymentPage = () => {
    const location = useLocation();
    const { planId } = useParams();

    const [amount, setAmount] = useState('');
    const [plan, setPlan] = useState(null);
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [deviceSerial, setPlanSerial] = useState('');

    const allDummyDevices = [
        { id: 'dev1', serial: 'SP-DVC-001' },
        { id: 'dev2', serial: 'SP-DVC-002' },
        { id: 'dev3', serial: 'SP-DVC-003' },
        { id: 'dev4', serial: 'SP-DVC-004' },
    ];

    /**
    * Función para obtener detalles del plan por ID.
    * @param {string} planId - El ID del plan.
    */
    const getPlanDetails = async (planId) => {
        const item = await getPlanById(planId);
        console.log('Device details GET:', item);
        setPlan(item);
    }

    useEffect(() => {
        // Simulate fetching device details
        if (location.state?.plan) {
            console.log('Device from state:', location.state.plan);
            setPlan(location.state.plan);
        } else {
            getPlanDetails(planId);

        }


    }, [planId]);

    const handlePaymentSubmit = (e) => {
        e.preventDefault();
        setError(null);
        setPaymentProcessing(true);
        setPaymentSuccess(false);


        setTimeout(() => {
            if (parseFloat(amount) > 0) {
                setPaymentSuccess(true);
            } else {
                setError("El monto del pago debe ser mayor a cero.");
            }
            setPaymentProcessing(false);
        }, 2000);
    };

    if (plan) {
        console.log('Plan details:', plan.value);

    }

    if (paymentSuccess) {
        return (
            <div className="container mx-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
                <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md w-full">
                    <CheckCircleIcon className="h-20 w-20 text-green-500 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">¡Pago Exitoso!</h2>
                    <p className="text-gray-700 mb-6">Tu pago de **${parseFloat(amount).toFixed(2)}** para el dispositivo **{deviceSerial || planId}** ha sido procesado correctamente.</p>
                    <Link
                        to="/client/dashboard"
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Volver a Mis Dispositivos
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex flex-col">
            {/* Header elegante */}
            <header className="relative h-20 flex items-center justify-center border-b bg-white shadow-sm px-4 sm:px-6">
                <Link
                    to={planId ? `/client/dashboard` : "/client/dashboard"}
                    className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 transition"
                >
                    <ArrowLeftIcon className="-ml-0.5 mr-2 h-4 w-4" />
                    Volver
                </Link>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-800 tracking-tight text-center">
                    Realiza tu pago
                </h1>
            </header>

            {/* Contenido principal */}
            <main className="flex-grow flex justify-center items-start sm:items-center px-4 sm:px-6 lg:px-8 mb-20 mt-16 sm:mt-6">
                <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl p-6 sm:p-10 space-y-8 border border-gray-100">

                    {/* Sección título */}
                    <div className="text-center">
                        <h2 className="text-xl sm:text-2xl font-bold text-indigo-700">Confirmación de Pago</h2>
                        <p className="text-gray-600 mt-1 text-sm sm:text-base">Verifica los datos antes de continuar.</p>
                    </div>

                    {/* Datos del dispositivo */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-indigo-50 rounded-xl p-5 sm:p-6 shadow-inner border border-indigo-100">
                        <div className="space-y-3 text-sm sm:text-base">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <span className="text-indigo-600 font-medium">Serial:</span>
                                <span className="text-gray-800 break-all">{plan?.device?.serial_number}</span>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3">
                                <span className="text-indigo-600 font-medium">Modelo:</span>
                                <span className="text-gray-800">{plan?.device?.model}</span>
                            </div>
                            {plan?.period && (
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <span className="text-indigo-600 font-medium">Cuotas:</span>
                                    <span className="text-gray-800">{plan?.quotas}/{plan?.period}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col justify-center items-start sm:items-center space-y-2 sm:space-y-3">
                            <span className="text-indigo-600 font-medium">Estado MDM:</span>
                            <span className={`px-4 py-1 text-sm font-semibold rounded-full ${getMdmStatusClass(plan?.device?.state)}`}>
                                {plan?.device?.state}
                            </span>
                        </div>
                    </div>

                    {/* Mensaje de error */}
                    {error && (
                        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm sm:text-base" role="alert">
                            <strong className="font-bold">Error:</strong>
                            <span className="block sm:inline"> {error}</span>
                        </div>
                    )}

                    {/* Formulario */}
                    <form onSubmit={handlePaymentSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Monto a Pagar $:</label>
                            <input
                                type="text"
                                id="amount"
                                name="amount"
                                value={Number(plan?.value).toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                    useGrouping: true,
                                }) || 0}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                                min="0.01"
                                step="0.01"
                                disabled={paymentProcessing}
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 shadow-sm text-base sm:text-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={paymentProcessing}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg text-base sm:text-lg shadow-md transition duration-300"
                        >
                            {paymentProcessing ? 'Procesando Pago...' : 'Confirmar Pago'}
                        </button>
                    </form>
                </div>
            </main>
        </div>


    );
};

export default ClientMakePaymentPage;