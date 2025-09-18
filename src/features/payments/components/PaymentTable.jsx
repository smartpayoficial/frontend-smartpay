import React, { useState, useMemo } from 'react';
import { PAGE_SIZE } from '../../../common/utils/const';
import { useNavigate } from 'react-router-dom';

const PaymentTable = ({ payments = [] }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const navigate = useNavigate();

    const paginatedPayments = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return payments.slice(start, start + PAGE_SIZE);
    }, [payments, currentPage]);

    const totalPages = Math.ceil(payments.length / PAGE_SIZE);

    const onViewDetails = (paymentId) => {
        navigate(`/devices-management?deviceId=${paymentId}`);
    }

    return (
        <div className="overflow-x-auto shadow-lg sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Registro</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dispositivo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendido Por</th>
                        {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th> */}
                        {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th> */}
                        {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th> */}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedPayments.length > 0 ? (
                        paginatedPayments.map((payment) => (
                            <tr key={payment.plan_id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{`${payment.user.first_name} ${payment.user.middle_name} ${payment.user.last_name} ${payment.user.second_last_name}` || ''}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(payment.initial_date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {(() => {
                                        const rawValue = payment.value !== undefined && payment.value !== null ? payment.value : payment.amount;
                                        if (rawValue === undefined || rawValue === null) return 'N/A';
                                        const numericValue = parseFloat(rawValue);
                                        if (isNaN(numericValue)) return 'N/A';
                                        return new Intl.NumberFormat('es-CO', {
                                            style: 'currency',
                                            currency: 'COP',
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        }).format(numericValue);
                                    })()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {payment.device?.model || payment.device?.serial_number
                                        ? `${payment.device.model || ''} (${payment.device.serial_number || ''})`.trim()
                                        : 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{`${payment.vendor.first_name} ${payment.vendor.middle_name} ${payment.vendor.last_name} ${payment.vendor.second_last_name}` || ''}</td>
                                {/* <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => onViewDetails(payment.device.device_id)}
                                        className="text-blue-600 hover:text-blue-900 ml-4"
                                    >
                                        Ver Detalles
                                    </button>
                                </td> */}
                                {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.method || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        ['approved', 'active', 'completado'].includes(payment.state?.toLowerCase())
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {(() => {
                                            switch (payment.state?.toLowerCase()) {
                                                case 'pending': return 'Pendiente';
                                                case 'approved': return 'Aprobado';
                                                case 'rejected': return 'Rechazado';
                                                case 'failed': return 'Fallido';
                                                case 'returned': return 'Devuelto';
                                                case 'active': return 'Activo';
                                                case 'completado': return 'Completado';
                                                default: return 'Desconocido';
                                            }
                                        })()}
                                    </span>
                                </td> */}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                                No hay pagos para mostrar.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {totalPages > 1 && (
                <div className="flex justify-end items-center mt-4 space-x-4 m-2">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded disabled:opacity-50"
                    >
                        Anterior
                    </button>
                    <span className="text-sm text-gray-700">
                        Página {currentPage} de {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded disabled:opacity-50"
                    >
                        Siguiente
                    </button>
                </div>
            )}
        </div>
    );
};

export default PaymentTable;
