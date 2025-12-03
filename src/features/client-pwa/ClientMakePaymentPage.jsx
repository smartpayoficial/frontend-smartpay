import React, { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeftIcon, ChatBubbleBottomCenterTextIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { getPlanById } from '../../api/plans';
import { getPayments } from '../../api/payments';
import { CurrencyDollarIcon, ChartPieIcon } from '@heroicons/react/24/outline';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

const ClientMakePaymentPage = () => {
    const location = useLocation();
    const { planId } = useParams();

    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCopied, setIsCopied] = useState(false);

    const accountNumber = '0000 0000 0000 0000';

    // Función para obtener las cuotas pagadas excluyendo el primer pago (cuota inicial)
    const getPaidQuotas = () => {
        if (!plan || !Array.isArray(plan.paymentHistory) || plan.paymentHistory.length <= 1) {
            return 0;
        }
        // slice(1) omite el primer elemento (la cuota inicial)
        return plan.paymentHistory.slice(1).filter(payment => payment.state === 'Approved').length;
    };

    // Calcula el valor total pagado de las cuotas de financiación (excluyendo la cuota inicial)
    const getTotalPaidFinancingValue = () => {
        if (!plan || !Array.isArray(plan.paymentHistory) || plan.paymentHistory.length <= 1) {
            return 0;
        }
        return plan.paymentHistory.slice(1)
            .filter(payment => payment.state === 'Approved')
            .reduce((sum, payment) => sum + parseFloat(payment.value), 0);
    };

    // Calcula el valor pendiente del plan de financiación
    const getPendingValue = () => {
        if (!plan) return 0;
        const initialPaymentValue = plan.paymentHistory && plan.paymentHistory.length > 0 ? parseFloat(plan.paymentHistory[0].value) : 0;
        const totalFinanced = plan.value - initialPaymentValue; // Valor total - cuota inicial
        const totalPaid = getTotalPaidFinancingValue();
        const pending = totalFinanced - totalPaid;
        return pending > 0 ? pending : 0;
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                let planData = location.state?.plan;
                if (!planData) {
                    planData = await getPlanById(planId);
                }
                const history = await getPayments({ device_id: planData.device_id });
                setPlan({ ...planData, paymentHistory: history });
            } catch (err) {
                console.error('Error fetching plan or history:', err);
                setError("No se pudo cargar la información del plan.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [planId, location.state?.plan]);

    const handleCopyClick = () => {
        navigator.clipboard.writeText(accountNumber);
        setIsCopied(true);
        setTimeout(() => {
            setIsCopied(false);
        }, 2000);
    };

    const generateWhatsappLink = () => {
        const phoneNumber = '573012345678'; // Reemplaza con el número de teléfono real
        const message = `Hola, he realizado un pago para el plan del dispositivo ${plan?.device?.model} (Serial: ${plan?.device?.serial_number}). Adjunto la captura del pago. El monto del pago es de $${Number(valueToPay).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        const encodedMessage = encodeURIComponent(message);
        return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[calc(100vh-80px)]">
                <p className="text-gray-600">Cargando detalles del plan...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mx-auto my-4 max-w-lg" role="alert">
                <strong className="font-bold">¡Error!</strong>
                <span className="block sm:inline"> {error}</span>
            </div>
        );
    }

    if (!plan) {
        return (
            <div className="bg-white p-6 rounded-lg shadow text-center mx-auto my-8 max-w-md">
                <InformationCircleIcon className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                <p className="text-gray-600">No se pudo cargar el plan. Vuelve a intentar.</p>
                <Link to="/client/dashboard" className="text-indigo-600 hover:underline mt-4 inline-block">Volver al Dashboard</Link>
            </div>
        );
    }

    const valueToPay = plan.quotas > 0 ? (plan.value - (plan.paymentHistory && plan.paymentHistory.length > 0 ? parseFloat(plan.paymentHistory[0].value) : 0)) / plan.quotas : 0;
    const paidQuotas = getPaidQuotas();
    const totalQuotas = plan.quotas;
    const pendingValue = getPendingValue();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans antialiased">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between max-w-xl mx-auto">
                    <Link
                        to={planId ? `/client/devices/${plan?.plan_id}` : "/client/dashboard"}
                        className="inline-flex items-center p-2 rounded-full text-gray-500 hover:bg-gray-100 transition"
                        aria-label="Volver"
                    >
                        <ArrowLeftIcon className="h-6 w-6" />
                    </Link>
                    <h1 className="text-xl font-bold text-gray-800 tracking-tight">
                        Realizar pago
                    </h1>
                    <div className="w-10"></div>
                </div>
            </header>
            <main className="flex-grow flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-3xl shadow-lg w-full max-w-xl p-6 sm:p-8 border border-gray-200 space-y-8">

                    {/* Sección de Resumen del Pago */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-800 text-center">
                            Resumen del pago
                        </h2>

                        {/* Valor de la Cuota (destacado) */}
                        <div className="bg-indigo-50 rounded-2xl p-6 text-center border border-indigo-100">
                            <p className="text-sm font-semibold text-indigo-700 uppercase tracking-wide">Valor a pagar (Cuota)</p>
                            <p className="mt-2 text-4xl sm:text-5xl font-extrabold text-indigo-900">
                                {`$${Number(valueToPay).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                            </p>
                        </div>

                        {/* Lista de detalles */}
                        <div className="space-y-4 text-gray-700">
                            {/* Valor Pendiente */}
                            <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                <div className="flex items-center">
                                    <CurrencyDollarIcon className="h-5 w-5 mr-3 text-indigo-400" />
                                    <span className="font-medium">Valor pendiente</span>
                                </div>
                                <span className="font-semibold">{`$${Number(pendingValue).toLocaleString('es-CO')}`}</span>
                            </div>

                            {/* Número de Cuotas */}
                            <div className="flex items-center justify-between py-2">
                                <div className="flex items-center">
                                    <ChartPieIcon className="h-5 w-5 mr-3 text-indigo-400" />
                                    <span className="font-medium">Cuotas pagadas</span>
                                </div>
                                <span className="font-semibold">{`${paidQuotas} / ${totalQuotas}`}</span>
                            </div>
                        </div>
                    </div>

                    {/* Línea divisoria */}
                    <hr className="border-t border-gray-200" />

                    {/* Sección de la Cuenta Bancaria */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-800 text-center">
                            Datos para la transferencia
                        </h2>
                        <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <span className="text-sm font-semibold text-gray-600">Bancolombia</span>
                            <div className="flex items-center justify-between w-full mt-2">
                                <span className="text-xl font-bold font-mono text-gray-900">{accountNumber}</span>
                                <button
                                    onClick={handleCopyClick}
                                    className="inline-flex items-center p-3 rounded-full text-gray-500 bg-white hover:bg-gray-100 border border-gray-300 transition active:scale-95"
                                >
                                    <DocumentDuplicateIcon className="h-5 w-5" />
                                </button>
                            </div>
                            {isCopied && (
                                <div className="mt-2 text-xs text-green-600 font-medium">
                                    ¡Número copiado!
                                </div>
                            )}
                        </div>
                    </div>

                    <h2 className="text-xl font-bold text-gray-800 text-center">
                        Envianos la captura del pago
                    </h2>

                    {/* Botón de WhatsApp */}
                    <a
                        href={generateWhatsappLink()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center bg-[#25D366] text-white font-bold py-3 px-6 rounded-full shadow-lg hover:bg-[#1DA851] hover:shadow-xl transition transform hover:-translate-y-0.5"
                    >
                        <ChatBubbleBottomCenterTextIcon className="h-6 w-6 mr-2" />
                        Abrir WhatsApp
                    </a>
                </div>
            </main>
        </div>
    );
};

export default ClientMakePaymentPage;