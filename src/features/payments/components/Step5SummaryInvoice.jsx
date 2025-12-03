import React from 'react';
import { DocumentCheckIcon, XCircleIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';

const Step5SummaryInvoice = ({ onBack, onFinalize, initialData }) => {
    const {
        customer,
        device,
        paymentPlan,
        initialPayment,
        signedContractFile,
        generatedInstallments
    } = initialData;

    const handleFinalizeClick = () => {
        onFinalize(initialData);
    };


    console.log('Datos iniciales paso 5:', device);
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Paso 5: Resumen y Factura</h2>

            <div className="bg-white shadow-md rounded-lg p-6 mb-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Resumen de la Venta</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 text-sm">
                    {/* Detalles del Cliente */}
                    <div>
                        <p><span className="font-medium">Cliente:</span> {customer ? `${customer.first_name} ${customer.last_name}` : 'N/A'}</p>
                        <p><span className="font-medium">DNI:</span> {customer ? customer.dni : 'N/A'}</p>
                        <p><span className="font-medium">Email:</span> {customer ? customer.email : 'N/A'}</p>
                        <p><span className="font-medium">Teléfono:</span> {customer ? `${customer.prefix} ${customer.phone}` : 'N/A'}</p>
                        <p><span className="font-medium">Dirección:</span> {customer ? customer.address : 'N/A'}</p>
                        <p><span className="font-medium">Ciudad:</span> {customer ? customer.city_id : 'N/A'}</p>
                    </div>
                    {/* Detalles del Dispositivo */}
                    <div>
                        <p><span className="font-medium">{device.device_id ? "Dispositivo:" : "Televisor:"}</span> {
                            device?.device_id ? `${device.brand} ${device.model} (${device.name})` : 
                            device?.television_id ? `${device.brand} ${device.model} (${device.name})` : 'N/A'
                        }</p>
                        <p><span className="font-medium">{device.device_id ? "IMEI:" : "Marca:"}</span> {
                            device?.device_id ? device.imei : 
                            device?.television_id ? device.brand : 'N/A'}
                        </p>
                        <p><span className="font-medium">Número de Serie:</span> {device ? device.serial_number : 'N/A'}</p>
                        <p><span className="font-medium">Valor Dispositivo:</span> ${device ? device.price_usd?.toLocaleString('es-CO') : '0,00'} COP</p>
                    </div>
                    {/* Detalles del Pago Inicial */}
                    <div>
                        <p><span className="font-medium">Pago Inicial:</span> ${initialPayment ? initialPayment.value?.toLocaleString('es-CO') : '0,00'} COP</p>
                        <p><span className="font-medium">Método:</span> {initialPayment ? initialPayment.method : 'N/A'}</p>
                        <p><span className="font-medium">Fecha Pago:</span> {initialPayment ? initialPayment.date : 'N/A'}</p>
                    </div>
                    {/* Detalles del Plan de Pagos */}
                    <div>
                        <p><span className="font-medium">Saldo a Financiar:</span> ${paymentPlan ? paymentPlan.balance_to_finance?.toLocaleString('es-CO') : '0,00'} COP</p>
                        <p><span className="font-medium">Plan:</span> {paymentPlan ? `${paymentPlan.cuotas} cuotas` : 'N/A'}</p>
                        <p><span className="font-medium">Monto Cuota:</span> ${paymentPlan ? paymentPlan.monto_cuota?.toLocaleString('es-CO') : '0,00'} COP</p>
                        <p><span className="font-medium">Frecuencia:</span> {paymentPlan ? `${paymentPlan.frecuencia_dias} días` : 'N/A'}</p>
                        <p><span className="font-medium">Inicio Plan:</span> {paymentPlan ? paymentPlan.initial_date : 'N/A'}</p>
                    </div>
                </div>

                {/* Tabla de cuotas generadas en el resumen */}
                {generatedInstallments && generatedInstallments.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Detalle de Cuotas Programadas</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Cuota
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Fecha Vencimiento
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Monto
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {generatedInstallments.map((installment) => (
                                        <tr key={installment.number}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {installment.number}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(installment.dueDate).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                ${installment.amount.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} COP
                                            </td>
                                        </tr>
                                    ))}
                                    <tr>
                                        <td colSpan="2" className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                                            Total a Financiar
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                            ${paymentPlan.balance_to_finance?.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} COP
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}


                <div className="mt-6 pt-4 border-t border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Estado del Contrato</h3>
                    {signedContractFile ? (
                        <div className="flex items-center text-green-600">
                            <DocumentCheckIcon className="h-6 w-6 mr-2" />
                            <p className="font-medium">Contrato firmado cargado: <span className="underline">{signedContractFile.name}</span></p>
                        </div>
                    ) : (
                        <div className="flex items-center text-red-600">
                            <XCircleIcon className="h-6 w-6 mr-2" />
                            <p className="font-medium">Aún no se ha cargado el contrato firmado.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-between mt-6">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <ChevronLeftIcon className="-ml-0.5 mr-2 h-5 w-5" />
                    Atrás
                </button>
                <button
                    type="button"
                    onClick={handleFinalizeClick}
                    disabled={!signedContractFile}
                    className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
                        ${!signedContractFile ? 'bg-green-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'}`}
                >
                    Finalizar Venta y Registrar Datos
                    <svg className="ml-2 -mr-0.5 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default Step5SummaryInvoice;