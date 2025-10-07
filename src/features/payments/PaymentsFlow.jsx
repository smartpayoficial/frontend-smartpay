// src/pages/payments/PaymentsFlow.jsx
import React, { useState, useEffect } from 'react';
import Step1Customer from './components/Step1Customer';
import Step2DeviceProvisioning from './components/Step2DeviceProvisioning';
import Step3PaymentPlan from './components/Step3PaymentPlan';
import Step4Contract from './components/Step4Contract';
import Step5SummaryInvoice from './components/Step5SummaryInvoice';
import Swal from 'sweetalert2';

import Stepper from './components/Stepper';

// import { toast } from 'react-toastify';
import { useAuth } from '../../common/context/AuthProvider';
import { ChevronLeftIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const PaymentsFlow = ({ initialData: initialFlowData, onFinalize, onBackToParent, onReset, customers: propCustomers }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState(initialFlowData || {});
    const [customers, setCustomers] = useState(propCustomers || []);
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);


    const stepNames = [
        'Info Cliente',
        'Aprov. Dispositivo',
        'Pago y Plan',
        'Contrato',
        'Resumen y Factura'
    ];
    const totalSteps = stepNames.length;

    useEffect(() => {
        const savedState = localStorage.getItem('paymentFlowState');
        if (savedState) {
            const { step, data } = JSON.parse(savedState);
            setCurrentStep(step);
            setFormData(data);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (user && !formData.authenticatedUser) {
            setFormData(prevData => ({ ...prevData, authenticatedUser: user }));
        }
    }, [user, formData.authenticatedUser]);

    useEffect(() => {
        if (!isLoading) {
            if (currentStep >= 2) {
                const stateToSave = { step: currentStep, data: formData };
                localStorage.setItem('paymentFlowState', JSON.stringify(stateToSave));
            } else {
                localStorage.removeItem('paymentFlowState');
            }
        }
    }, [currentStep, formData, isLoading]);

    const handleNext = (data) => {
        setFormData(prevData => {
            const updatedData = { ...prevData, ...data };
            console.log(`Datos acumulados después de Paso ${currentStep}:`, updatedData);
            return updatedData;
        });
        setCurrentStep(prevStep => prevStep + 1);
    };

    const handleDataChange = (data) => {
        setFormData(prevData => ({ ...prevData, ...data }));
    };

    const handleBack = () => {
        if (currentStep === 1) {
            onBackToParent();
        } else {
            setCurrentStep(prevStep => prevStep - 1);
        }
    };

    const handleReset = () => {
        Swal.fire({
            title: '¿Está seguro?',
            text: "¡Todo el progreso se perderá!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, reiniciar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                setCurrentStep(1);
                setFormData(initialFlowData || { authenticatedUser: user });
                localStorage.removeItem('paymentFlowState');
                if (onReset) {
                    onReset();
                }
                Swal.fire(
                    '¡Reiniciado!',
                    'El proceso ha sido reiniciado.',
                    'success'
                )
            }
        });
    };


    const handleFinalize = (finalData) => {
        if (onFinalize) {
            onFinalize({ ...formData, ...finalData });
        }
        localStorage.removeItem('paymentFlowState');
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return <Step1Customer onNext={handleNext} onBack={handleBack} initialData={formData} customers={customers} />;
            case 2:
                // Asegúrate de que Step2DeviceProvisioning pase el objeto 'device' correctamente
                return <Step2DeviceProvisioning onNext={handleNext} onBack={handleBack} initialData={formData} onDataChange={handleDataChange} />;
            case 3:
                // Aquí, formData.device ya debería estar disponible
                return <Step3PaymentPlan onNext={handleNext} onBack={handleBack} initialData={formData} />;
            case 4:
                return <Step4Contract onNext={handleNext} onBack={handleBack} initialData={formData} />;
            case 5:
                return <Step5SummaryInvoice onBack={handleBack} onFinalize={handleFinalize} initialData={formData} />;
            default:
                return <div>Flujo de pagos completo.</div>;
        }
    };

    return (
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                    <button
                        onClick={handleBack}
                        className="mr-3 p-2 rounded-full hover:bg-gray-200 transition-colors duration-200"
                        title="Volver al paso anterior"
                    >
                        <ChevronLeftIcon className="h-6 w-6 text-gray-600" />
                    </button>
                    Registrar Nueva Factura de Venta
                </h1>
                {currentStep > 1 && (
                    <button
                        onClick={handleReset}
                        className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        title="Reiniciar proceso"
                    >
                        <ArrowPathIcon className="h-5 w-5 mr-2" />
                        Reiniciar
                    </button>
                )}
            </div>
            <Stepper
                currentStep={currentStep}
                totalSteps={totalSteps}
                stepNames={stepNames}
            />

            {renderStep()}
        </div>
    );
};

export default PaymentsFlow;