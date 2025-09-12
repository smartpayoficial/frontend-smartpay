import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../common/context/AuthProvider';
import { DeviceTabletIcon, CreditCardIcon, InformationCircleIcon, ArrowLeftStartOnRectangleIcon } from '@heroicons/react/24/outline';
import { getPlans } from '../../api/plans';
import { getMdmStatusClass } from './utils/shared-functions';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { requestPasswordReset } from '../../api/auth';
import { handlePasswordReset, showNewUserAlert } from '../../common/utils/auth';
import { getPayments } from '../../api/payments';

const MySwal = withReactContent(Swal);

const ClientDashboardPage = () => {
    const { user, logout } = useAuth();
    const [customerDevices, setCustomerDevices] = useState([]);
    const [paymentsDevices, setPaymentsDevices] = useState([]);
    const [isNew, setIsNew] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /**
     * Metodo para resetar password
     */
    // const handlePasswordReset = async () => {
    //     if (user && user.dni) {
    //         const data = { dni: user.dni };

    //         // Mostrar alerta de "procesando..."
    //         MySwal.fire({
    //             title: 'Procesando...',
    //             text: 'Enviando el correo para restablecer la contraseña.',
    //             allowOutsideClick: false,
    //             allowEscapeKey: false,
    //             allowEnterKey: false,
    //             showConfirmButton: false,
    //             didOpen: () => {
    //                 MySwal.showLoading(); // Muestra el spinner
    //             },
    //         });

    //         try {
    //             await requestPasswordReset(data);

    //             // Luego de procesar, mostrar el de "Correo enviado"
    //             await MySwal.fire({
    //                 icon: 'success',
    //                 title: '¡Correo enviado!',
    //                 text: 'Vuelve a iniciar sesión cuando cambies tu contraseña.',
    //                 showConfirmButton: true,
    //                 allowOutsideClick: false,
    //                 allowEscapeKey: false,
    //                 allowEnterKey: false,
    //                 backdrop: true,
    //                 confirmButtonText: 'Ya he cambiado mi contraseña.',
    //             }).then(async (result) => {
    //                 if (result.isConfirmed) {
    //                     await logout();
    //                     setIsNew(false);
    //                 }
    //             });

    //         } catch (error) {
    //             await MySwal.fire({
    //                 icon: 'error',
    //                 title: 'Error',
    //                 text: 'No se pudo enviar el correo. Intenta de nuevo más tarde.',
    //                 confirmButtonText: 'Entendido',
    //             });
    //         }
    //     }
    // };

    const navigate = useNavigate();
    const fetchUserData = async () => {
        await showNewUserAlert(user, setIsNew, logout, navigate);
    }

    useEffect(() => {
        fetchUserData()
        setLoading(true);
        setError(null);

        setTimeout(() => {
            const currentCustomerId = user?.user_id;
            if (currentCustomerId) {
                // const filtered = allDummyDevices.filter(device => device.customerId === currentCustomerId);
                /** Cargar dispositivos del cliente */
                getPlantsInit();
            } else {
                setError("No se pudo obtener el ID del cliente. Asegúrate de estar logueado.");
                setCustomerDevices([]);
                setPaymentsDevices([]);
            }
        }, 500);
    }, []);

    /**
     * Función para obtener planes y sus dispositivos asociados.
     */
    const getPlantsInit = async () => {
        const data = await getPlans({ user_id: user.user_id });
        const resultados = [];

        if (Array.isArray(data) && data.length > 0) {
            for (const plan of data) {
                const params = { device_id: plan.device_id, state: 'Approved' };
                const paymentsResponse = await getPayments(params);
                resultados.push(paymentsResponse);
            };

        }

        console.log("data", resultados);
        setPaymentsDevices(resultados.flat());
        setCustomerDevices(data);
        setLoading(false);
    }

    const getPaymentQuotas = (deviceId) => {
        if (!Array.isArray(paymentsDevices) || paymentsDevices.length == 0) {
            return 0;
        }

        const result = paymentsDevices.filter(payment => payment.device_id == deviceId);
        return result.length;
    }

    function getEffectivePaymentDate(plan, deviceId, startDateStr, periodDays) {
        const pendingValue = getPendingValue(plan.device_id, plan.value)
        if (pendingValue <= 0) {
            return null;
        }

        if (!Array.isArray(paymentsDevices) || paymentsDevices.length == 0) {
            return 0;
        }

        const payments = paymentsDevices.filter(payment => payment.device_id == deviceId);

        const paidDates = payments
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

    const getPendingValue = (deviceId, value) => {
        if (!Array.isArray(paymentsDevices) || paymentsDevices.length == 0) {
            return 0;
        }

        const result = paymentsDevices.filter(payment => payment.device_id == deviceId);

        const total = result.reduce((sum, payment) => {
            return sum + parseFloat(payment.value);
        }, 0);
        return value - total;
    }

    const getStatusClass = (plan) => {
        const pendingValue = getPendingValue(plan.device_id, plan.value)
        if (pendingValue <= 0) {
            return 'bg-green-100 text-blue-800';
        }
        switch (plan.device.state) {
            case 'Active': return 'bg-green-100 text-green-800';
            case 'Inactive': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStateName = (plan) => {
        const pendingValue = getPendingValue(plan.device_id, plan.value)
        if (pendingValue <= 0) {
            return 'Pagado';
        }
        switch (plan.device.state) {
            case 'Active': return 'Activo';
            case 'Inactive': return 'Inactivo';
            default: return '';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[calc(100vh-80px)]">
                <p className="text-gray-600">Cargando tus dispositivos...</p>
            </div>
        );
    } else if (customerDevices.length === 0 && !isNew) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
                <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-2xl max-w-xl w-full text-center border border-blue-200">
                    <InformationCircleIcon className="h-16 w-16 text-blue-500 mx-auto mb-6 animate-pulse" />

                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">
                        No tienes dispositivos asociados
                    </h2>

                    <p className="text-gray-600 mb-6 text-base sm:text-lg">
                        Si crees que esto es un error, por favor contacta al soporte de <span className="font-semibold text-blue-600">SmartPay</span>.
                    </p>

                    <button
                        className="mt-4 inline-flex items-center justify-center gap-2 px-6 py-3 text-sm sm:text-base font-semibold text-white bg-red-500 hover:bg-red-600 rounded-full shadow-lg hover:shadow-xl transition duration-200 ease-in-out"
                        onClick={() => logout()}
                    >
                        <ArrowLeftStartOnRectangleIcon className="h-6 w-6" />
                        <span>Regresar</span>
                    </button>
                </div>
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

    return (
        <div className="bg-white min-h-screen">
            {/* Encabezado principal para el móvil */}
            <div className="bg-indigo-600 text-white p-4 shadow-md">
                <h1 className="text-xl font-bold text-center">{user?.store?.nombre || 'SmartPay'}</h1>
            </div>

            {/* Contenedor principal para el contenido */}
            <div className="container mx-auto px-4 pt-6 pb-20">

                {/* Tarjeta de bienvenida */}
                <div className="bg-indigo-100 text-black-800 p-6 rounded-2xl shadow-lg relative overflow-hidden">
                    {/* Contenido principal de la tarjeta */}
                    <h2 className="text-2xl font-bold mb-1 z-10">
                        ¡Hola <br />
                        <span className="text-indigo-600">{user?.name}!</span> 👋
                    </h2>
                    {/* <p className="text-sm font-semibold z-10">
                        Bienvenido a <span className="text-indigo-900">{user?.store?.nombre}</span>
                    </p> */}

                    {/* Figura decorativa */}
                    <img
                        src="/assets/figura.png" // Asegúrate de que esta ruta sea correcta
                        alt="Figura decorativa"
                        className="absolute bottom-0 right-4 w-26 h-32 opacity-40 transform translate-x-1/4 translate-y-1/4 z-0"
                    />
                </div>

                {/* Título de la sección de dispositivos */}
                <div className="mt-8 mb-4">
                    <h2 className="text-lg font-bold text-gray-800 ml-2">Mis Dispositivos</h2>
                </div>

                {/* Lista de dispositivos */}
                <div className="grid grid-cols-1 gap-6 m-2">
                    {/* Tu .map para customerDevices permanece aquí */}
                    {customerDevices.map((device) => (
                        <div
                            key={device.device.device_id}
                            className="bg-white p-6 rounded-2xl shadow-md transition-all duration-300"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-semibold text-gray-800">{device.device.model}</h3>
                                <span
                                    className={`px-3 py-1 text-xs font-bold uppercase rounded-full tracking-wide ${getStatusClass(device)}`}
                                >
                                    {getStateName(device)}
                                </span>
                            </div>

                            <div className="text-sm text-gray-700 space-y-1 border-t border-b py-4">
                                <div className="flex justify-between">
                                    <span className="font-medium">Serial:</span>
                                    <span>{device.device.serial_number}</span>
                                </div>
                                {device.period && (
                                    <div className="flex justify-between">
                                        <span className="font-medium">Cuotas:</span>
                                        <span>
                                            {getPaymentQuotas(device.device_id)}/{device.quotas}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="font-medium">Próximo Pago:</span>
                                    {device.initial_date ? (
                                        <span
                                            className={`font-semibold ${getEffectivePaymentDate(device, device.device_id, device.initial_date, device.period) < new Date()
                                                ? 'text-red-600'
                                                : 'text-green-600'
                                                }`}
                                        >
                                            {getEffectivePaymentDate(device, device.device_id, device.initial_date, device.period) || 'No aplica'}
                                        </span>
                                    ) : (
                                        <span>No aplica</span>
                                    )}
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Valor pendiente:</span>
                                    {Number(device.value) > 0 ? (
                                        <span className="text-red-600 font-bold">
                                            {Number(getPendingValue(device.device_id, device.value)).toLocaleString('es-CO', {
                                                style: 'currency',
                                                currency: 'COP',
                                            })}
                                        </span>
                                    ) : (
                                        <span>$0.00</span>
                                    )}
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Valor dispositivo:</span>
                                    {Number(device.value) > 0 ? (
                                        <span className="text-green-600 font-bold">
                                            {Number(device.value).toLocaleString('es-CO', {
                                                style: 'currency',
                                                currency: 'COP',
                                            })}
                                        </span>
                                    ) : (
                                        <span>$0.00</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 mt-4">
                                <Link
                                    to={`/client/devices/${device.plan_id}`}
                                    state={{ plan: device }}
                                    className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow"
                                >
                                    <DeviceTabletIcon className="h-5 w-5 mr-2" />
                                    Ver Detalles
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Botón flotante para cerrar sesión */}
            <button
                className="fixed bottom-4 right-4 z-50 w-14 h-14 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition duration-200 ease-in-out"
                onClick={() => logout()}
                title="Cerrar sesión"
            >
                <ArrowLeftStartOnRectangleIcon className="h-7 w-7" />
            </button>
        </div>

    );
};

export default ClientDashboardPage;