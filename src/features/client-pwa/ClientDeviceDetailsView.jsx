import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { ArrowLeftIcon, DeviceTabletIcon, InformationCircleIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { getDeviceById } from '../../api/devices';
import { getPayments } from '../../api/payments';
import { getMdmStatusClass } from './utils/shared-functions';
import { getPlanById } from '../../api/plans';

const ClientDeviceDetailsView = () => {
  const { planId } = useParams();
  const location = useLocation();

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const getStatusClass = () => {
    const pendingValue = getPendingValue()
    if (pendingValue <= 0) {
      return 'bg-green-100 text-blue-800';
    }
    switch (plan.device.state) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStateName = () => {
    const pendingValue = getPendingValue()
    if (pendingValue <= 0) {
      return 'Pagado';
    }
    switch (plan.device.state) {
      case 'Active': return 'Activo';
      case 'Inactive': return 'Inactivo';
      default: return '';
    }
  };

  const getPaymentQuotas = () => {
    if (!Array.isArray(plan.paymentHistory) || plan.paymentHistory.length == 0) {
      return 0;
    }
    return plan.paymentHistory.length;
  }

  function getEffectivePaymentDate() {
    const pendingValue = getPendingValue()
    if (pendingValue <= 0) {
      return null;
    }

    if (!Array.isArray(plan.paymentHistory) || plan.paymentHistory.length == 0) {
      let currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + plan.period);
      return new Date(currentDate);
    }

    const paidDates = plan.paymentHistory
      .map(p => new Date(p.date).toISOString().split('T')[0]);

    const startDate = new Date(plan.initial_date);
    let currentDate = new Date(startDate);
    const todayStr = new Date().toISOString().split('T')[0];

    // 🚨 Avanzamos al primer período antes de empezar
    currentDate.setDate(currentDate.getDate() + plan.period);

    // Iterar hasta encontrar la primera fecha no pagada
    while (true) {
      const currentDateStr = currentDate.toISOString().split('T')[0];
      if (!paidDates.includes(currentDateStr)) {
        return currentDateStr;
      }
      currentDate.setDate(currentDate.getDate() + plan.period); // Avanzar al siguiente período

      if (currentDateStr > todayStr && (currentDate - startDate) / (1000 * 60 * 60 * 24) > 365) {
        throw new Error("No se encontró una fecha válida en el rango esperado.");
      }
    }
  }

  const getPendingValue = () => {
    if (!Array.isArray(plan.paymentHistory) || plan.paymentHistory.length == 0) {
      return 0;
    }

    const result = plan.paymentHistory.filter((payment) => payment.state == 'Approved');

    
    const total = result.reduce((sum, payment) => {
      return sum + parseFloat(payment.value);
    }, 0);

    return plan.value - total;
  }

  const getPaymentName = (state) => {
    switch (state) {
      case 'Approved': return 'Aprobado';
      case 'Pending': return 'Pendiente';
      case 'Rejected': return 'Rechazado';
      case 'Failed': return 'Fallido';
      case 'Returned': return 'Devuelto';
      default: return state;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[calc(100vh-80px)]">
        <p className="text-gray-600">Cargando detalles del dispositivo...</p>
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
        <p className="text-gray-600">No se pudo cargar el dispositivo. Vuelve a intentar.</p>
        <Link to="/client/dashboard" className="text-indigo-600 hover:underline mt-4 inline-block">Volver al Dashboard</Link>
      </div>
    );
  } else {
    console.log('Plan details:', plan);

  }

  // console.log('Device details:', device);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-10 py-14 space-y-20 min-h-[calc(100vh-160px)]">
      {/* ENCABEZADO */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6 border-b border-gray-200 pb-6">
        <Link
          to="/client/dashboard"
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2 text-gray-500" />
          Volver a Mis Dispositivos
        </Link>

        <div className="text-center">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight">
            Detalles de <span className="text-indigo-700">{plan.device.model}</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1 tracking-wide font-normal">
            ({plan.device.serial_number})
          </p>
        </div>

        <div className="hidden lg:block w-40" />
      </div>

      {/* SECCIÓN INFORMACIÓN Y PAGOS */}
      <div className="bg-white border border-gray-200 rounded-3xl shadow-2xl p-10 lg:p-14 grid grid-cols-1 lg:grid-cols-2 gap-16 relative min-h-[22rem]">
        <div className="hidden lg:block absolute left-1/2 top-10 bottom-10 w-px bg-gray-100" />

        {/* INFORMACIÓN DEL DISPOSITIVO */}
        <div className="relative z-10">
          <div className="absolute top-0 right-0 opacity-5 text-indigo-300 pointer-events-none">
            <DeviceTabletIcon className="h-36 w-36 rotate-12" />
          </div>

          <div className="flex items-center gap-4 mb-10">
            <div className="bg-indigo-100 text-indigo-600 p-4 rounded-xl shadow-sm">
              <DeviceTabletIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-indigo-700 uppercase tracking-wide">Información del Dispositivo</h2>
              <p className="text-sm text-gray-500">Detalles técnicos y estado actual</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm sm:text-base text-gray-700">
            <div>
              <p className="text-gray-500 font-medium">Serial</p>
              <p className="font-semibold">{plan.device.serial_number}</p>
            </div>
            <div>
              <p className="text-gray-500 font-medium">Modelo</p>
              <p className="font-semibold">{plan.device.model}</p>
            </div>
            <div>
              <p className="text-gray-500 font-medium">Estado MDM</p>
              <span className={`mt-1 inline-block px-3 py-1 text-xs font-semibold rounded-full ${getStatusClass()}`}>
                {getStateName()}
              </span>
            </div>
            {plan.period && (
              <div>
                <p className="text-gray-500 font-medium">Cuotas</p>
                <p className="font-semibold">{getPaymentQuotas()} de {plan.quotas}</p>
              </div>
            )}
            <div>
              <p className="text-gray-500 font-medium">Próximo Pago</p>
              <p className={`font-semibold ${getEffectivePaymentDate() < new Date() ? 'text-red-600' : 'text-gray-800'}`}>
                {getEffectivePaymentDate() || 'No aplica'}
              </p>
            </div>
            <div>
              <p className="text-gray-500 font-medium">Monto Pendiente</p>
              <p className="text-red-600 font-bold text-xl">
                ${plan?.value ? Number(getPendingValue()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
              </p>
            </div>
          </div>
        </div>

        {/* HISTORIAL DE PAGOS */}
        <div className="flex flex-col h-full relative z-10">
          <div className="relative mb-10">
            <div className="absolute top-0 right-0 opacity-5 text-green-300 pointer-events-none">
              <CreditCardIcon className="h-36 w-36 -rotate-12" />
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-green-100 text-green-600 p-4 rounded-xl shadow-sm">
                <CreditCardIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-green-700 uppercase tracking-wide">Historial de Pagos</h2>
                <p className="text-sm text-gray-500">Movimientos realizados hasta la fecha</p>
              </div>
            </div>
          </div>

          {plan.paymentHistory && plan.paymentHistory.length > 0 ? (
            <div className="flex-1 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
              <div className="overflow-y-auto max-h-[28rem]">
                <table className="min-w-full text-sm text-gray-700 divide-y divide-gray-200">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="px-6 py-3 text-left">Fecha</th>
                      <th className="px-6 py-3 text-left">Monto</th>
                      <th className="px-6 py-3 text-left">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {plan.paymentHistory.map(payment => (
                      <tr key={payment.payment_id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap">{payment.date.split("T")[0]}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          ${Number(payment.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${payment.state === 'Approved'
                            ? 'bg-green-100 text-green-800'
                            : payment.state === 'Atrasado'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                            }`}>
                            {getPaymentName(payment.state)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No hay historial de pagos disponible para este dispositivo.
            </div>
          )}

          {/* {plan.device.amountDue > 0 && ( */}
            <div className="mt-10 text-center">
              <Link
              to={`/client/make-payment/${plan.plan_id}?amount=${plan.value}`}
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white text-base font-medium rounded-xl shadow-lg hover:brightness-110 transition"
              >
                <CreditCardIcon className="h-5 w-5 mr-2" />
                Realizar Pago Ahora
              </Link>
            </div>
          {/* )} */}
        </div>
      </div>
    </div>


  );
};

export default ClientDeviceDetailsView;