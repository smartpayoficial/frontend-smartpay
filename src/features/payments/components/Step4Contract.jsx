import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
// Importa tu nuevo componente generador de PDF
import ContractPDFGenerator from '../contract/ContractPDFGenerator'; // ¡Asegúrate de que esta ruta sea correcta!
import { PDF_SIZE_CONTRACT } from '../../../common/utils/const';

const Step4Contract = ({ onNext, onBack, initialData }) => {
    const [contractFile, setContractFile] = useState(initialData.signedContractFile || null);
    // console.log("INITAL DATA USER 4: ", initialData)
    // Ya no necesitamos isLoadingContract ni contractUrl aquí, porque ContractPDFGenerator los manejará internamente.
    // Aunque, si quieres mostrar un loader o un link de descarga ANTES de que el usuario haga click en generar,
    // podríamos mantener un estado de URL aquí y pasar una prop para el link de descarga.
    // Por ahora, lo simplificaremos para que el botón y el link estén dentro de ContractPDFGenerator.

    // Desestructuramos los datos que pasaremos al generador de PDF
    const {
        customer,
        device,
        authenticatedUser, // Asumiendo que authenticatedUser contiene los datos del representante/vendedor
        paymentPlan,
        initialPayment,
        generatedInstallments // Importante pasar las cuotas generadas
    } = initialData;

    // Aquí ya no es necesario llamar a handleGenerateContract con un useEffect,
    // ya que el botón de generar estará en el ContractPDFGenerator.

    const handleFileChange = (event) => {
        // console.log('SIS PDDF');
        const file = event.target.files[0];
        if (file && file.type === "application/pdf") {
            // console.log('MUCHO PESOS');
            if (file.size > PDF_SIZE_CONTRACT) { // Límite de 10MB
                toast.error("El archivo excede el tamaño máximo de 10MB.");
                setContractFile(null);
            } else {
                // console.log('SELECCIONA CARGADP');

                setContractFile(file);
                toast.success(`Archivo "${file.name}" cargado correctamente.`);
            }
        } else {
            // console.log('ERROR PDF');
            setContractFile(null);
            toast.error("Por favor, selecciona un archivo PDF válido.");
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (contractFile) {
            onNext({ signedContractFile: contractFile });
        } else {
            toast.error("Debes cargar el contrato firmado para continuar.");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Paso 4: Contrato 📄</h2>

            <div className="bg-white shadow-md rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Generar y Descargar Contrato</h3>
                <p className="text-gray-600 mb-4 text-sm">
                    Haz clic en "Generar PDF del Contrato" para visualizar y descargar el contrato pre-llenado. Luego, imprímelo, fírmalo, escanéalo y súbelo en la sección de abajo.
                </p>

                {/* Renderiza el ContractPDFGenerator aquí */}
                {/* Asegúrate de pasar todas las props necesarias desde initialData */}
                <ContractPDFGenerator
                    // Datos de la compañía (pueden ser props o importar de una constante global si son fijos)
                    // ruc={companyInfo.ruc} // Si los tienes en initialData.company, úsalos
                    companyName={authenticatedUser?.store?.nombre.toUpperCase() || ''}
                    // ...etc.

                    // Datos del cliente (borrower)
                    borrowerName={`${customer.first_name || ''} ${customer.last_name || ''}`}
                    borrowerDNI={customer.dni}
                    borrowerPhone={customer.phone}
                    borrowerEmail={customer.email}
                    borrowerAddress={customer.address}

                    // Datos del dispositivo
                    equipment={{
                        brand: device.product_name,
                        model: device.model,
                        imei: device.imei
                    }}
                    devicePrice={device.price_usd} // Usa el valor numérico real del dispositivo

                    // Datos del plan de pagos
                    paymentPlan={paymentPlan} // Este objeto ya contiene quotas, frecuencia_dias, monto_cuota, balance_to_finance, currency
                    initialPayment={initialPayment} // Este objeto ya contiene value, method, date
                    generatedInstallments={initialData.generatedInstallments} // Las cuotas generadas del Paso 3

                    // Datos del vendedor (authenticatedUser)
                    representativeName={`${authenticatedUser.first_name} ${authenticatedUser.last_name}`}
                    representativeDNI={authenticatedUser.dni || 'N/A'} // Asumiendo que el usuario autenticado tiene DNI
                    representativePhone={authenticatedUser.phone || 'N/A'} // Asumiendo que tiene teléfono
                    representativeEmail={authenticatedUser.email}
                    representativeAccountBack={
                        Array.isArray(authenticatedUser?.store?.contacts)
                            ? authenticatedUser.store.contacts
                                .filter(
                                    contact =>
                                        contact?.account_type?.category === 'BANK_ACCOUNT'
                                )
                                .map(contact => ({
                                    name: contact?.account_type?.name || '--',
                                    value:
                                        contact?.contact_details?.phone_number ||
                                        contact?.contact_details?.account_number ||
                                        contact?.contact_details?.email ||
                                        '--'
                                }))
                            : []
                    }

                // contractDate ya se usa en ContractPDFGenerator como new Date() por defecto
                />
            </div>

            <div className="bg-white shadow-md rounded-lg p-6 mt-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Cargar Contrato Firmado</h3>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                        <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                            <label
                                htmlFor="file-upload"
                                className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <span>Cargar un archivo</span>
                                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf" />
                            </label>
                            <p className="pl-1">o arrastra y suelta</p>
                        </div>
                        <p className="text-xs text-gray-500">
                            Solo archivos PDF (máx. 10MB)
                        </p>
                        {contractFile && (
                            <p className="mt-2 text-sm text-gray-700">Archivo seleccionado: <span className="font-semibold">{contractFile.name}</span></p>
                        )}
                    </div>
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
                    type="submit"
                    disabled={!contractFile}
                    className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
                        ${!contractFile ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
                >
                    Continuar
                    <svg className="ml-2 -mr-0.5 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </form>
    );
};

export default Step4Contract;