import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { CURRENCIES } from '../../../common/utils/currencies'; // Asegúrate de que la ruta sea correcta
import { formatDisplayDate, localDate } from '../../../common/utils/helpers';

const Step3PaymentPlan = ({ onNext, onBack, initialData }) => {
    console.log("INITAL DATA 3: ", { onNext, onBack, initialData });
    // Estados para los valores numéricos REALES (para cálculos y envío)
    // Se inicializan con Number(value || 0) para asegurar que sean números,
    // pero el valor inicial 0 NO se formatea en el input de inmediato.
    const [devicePrice, setDevicePrice] = useState(Number(initialData.device?.price_usd || initialData.paymentPlan?.value || 0));
    const [initialPaymentValue, setInitialPaymentValue] = useState(Number(initialData.initialPayment?.value || 0));

    // Estados para los valores de los inputs (strings).
    // SE INICIAN EN BLANCO para que el usuario pueda escribir desde cero.
    const [formattedDevicePrice, setFormattedDevicePrice] = useState('');
    const [formattedInitialPaymentValue, setFormattedInitialPaymentValue] = useState('');


    const [selectedCurrency, setSelectedCurrency] = useState(initialData.paymentPlan?.currency || initialData.device?.currency || 'COP');

    const [paymentPlan, setPaymentPlan] = useState(initialData.paymentPlan || {
        quotas: '',
        frecuencia_dias: '',
        initial_date: ''
    });

    const [initialPayment, setInitialPayment] = useState(initialData.initialPayment || {
        method: '',
        date: localDate()
    });

    const [errors, setErrors] = useState({});

    // Función para formatear el monto según la divisa seleccionada
    // Se mantiene como useCallback ya que depende de selectedCurrency
    const formatCurrency = useCallback((amount, currencyCode = selectedCurrency) => {
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount === 0) { // Modificación aquí: si es 0, también devuelve vacío
            return '';
        }

        const currencyConfig = CURRENCIES[currencyCode];
        if (!currencyConfig) {
            console.warn(`Configuración para la divisa ${currencyCode} no encontrada. Usando formato genérico.`);
            return new Intl.NumberFormat().format(numericAmount);
        }
        return new Intl.NumberFormat(currencyConfig.locale, {
            style: 'currency',
            currency: currencyConfig.symbol, // Usa el código ISO para currency
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(numericAmount);
    }, [selectedCurrency]);

    // Función para "desformatear" un valor de string a número
    const parseCurrency = useCallback((formattedValue) => {
        if (!formattedValue) return 0; // Si el input está vacío, el valor numérico es 0

        const currencyConfig = CURRENCIES[selectedCurrency];
        let cleanValue = formattedValue;

        // Eliminar el símbolo de la moneda si está presente, usando el símbolo configurado
        if (currencyConfig && currencyConfig.symbol) {
            // Escapar caracteres especiales en el símbolo de la moneda para la regex
            const escapedSymbol = currencyConfig.symbol.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            cleanValue = cleanValue.replace(new RegExp(escapedSymbol, 'g'), '');
        }

        // Obtener los separadores de miles y decimales del locale actual para eliminarlos
        let decimalSeparator = '.';
        let groupSeparator = ',';
        if (currencyConfig) {
            try {
                // Formatear un número de ejemplo para obtener los separadores del locale
                const partsExample = new Intl.NumberFormat(currencyConfig.locale).formatToParts(1000.50);
                decimalSeparator = partsExample.find(part => part.type === 'decimal')?.value || '.';
                groupSeparator = partsExample.find(part => part.type === 'group')?.value || ',';
            } catch (e) {
                console.error("Error al obtener separadores de locale:", e);
                // Fallback a los predeterminados si hay error
                decimalSeparator = '.';
                groupSeparator = ',';
            }
        }

        // Eliminar el separador de miles
        cleanValue = cleanValue.replace(new RegExp(`\\${groupSeparator}`, 'g'), '');

        // Reemplazar el separador decimal por un punto para que parseFloat funcione
        cleanValue = cleanValue.replace(decimalSeparator, '.');

        // Eliminar cualquier carácter que no sea dígito o un punto decimal
        cleanValue = cleanValue.replace(/[^0-9.]/g, '');

        // Asegurarse de que solo haya un punto decimal (si hay múltiples, solo el primero es válido)
        const partsOfCleanValue = cleanValue.split('.');
        if (partsOfCleanValue.length > 2) {
            cleanValue = partsOfCleanValue[0] + '.' + partsOfCleanValue.slice(1).join('');
        }

        const numericValue = parseFloat(cleanValue);
        return isNaN(numericValue) ? 0 : numericValue;

    }, [selectedCurrency]);


    // Efecto para inicializar los valores formateados al cargar el componente
    // Se ejecuta solo si initialData.device?.price_usd o initialData.initialPayment?.value tienen un valor diferente de 0.
    // Esto asegura que si vienen con un valor inicial, se muestren formateados.
    // Si vienen como 0, los campos de string se mantendrán en blanco.
    useEffect(() => {
        if (initialData.device?.price_usd) {
            setFormattedDevicePrice(formatCurrency(devicePrice));
        }
        if (initialData.initialPayment?.value) {
            setFormattedInitialPaymentValue(formatCurrency(initialPaymentValue));
        }
    }, [devicePrice, initialPaymentValue, formatCurrency, initialData]); // Depende de los valores numéricos, formatCurrency e initialData

    // Lógica para recalcular el saldo a financiar
    const balanceToFinance = useMemo(() => {
        const devPrice = devicePrice || 0;
        const initPay = initialPaymentValue || 0;
        return devPrice - initPay;
    }, [devicePrice, initialPaymentValue]);

    // Lógica para recalcular el monto por cuota
    const montoPorCuota = useMemo(() => {
        if (Number(paymentPlan.quotas) > 0 && balanceToFinance >= 0) {
            return balanceToFinance / Number(paymentPlan.quotas);
        }
        return 0;
    }, [balanceToFinance, paymentPlan.quotas]);

    // Lógica para generar las cuotas
    const generatedInstallments = useMemo(() => {
        const installments = [];
        const numCuotas = Number(paymentPlan.quotas);
        const freqDays = Number(paymentPlan.frecuencia_dias);
        const startDate = paymentPlan.initial_date;

        if (numCuotas > 0 && freqDays > 0 && startDate && balanceToFinance > 0) {
            const baseDate = new Date(startDate);

            // 1. Calcular valor base redondeado a 2 decimales
            const rawQuota = balanceToFinance / numCuotas;
            const quotaAmount = Math.round(rawQuota * 100) / 100;

            // 2. Calcular cuánto suman esas cuotas redondeadas
            // (Nota: multiplicamos por (numCuotas - 1) porque la última será diferente)
            const totalCoveredByNormalQuotas = quotaAmount * (numCuotas - 1);

            // 3. La última cuota asume el restante exacto para cuadrar el total
            // Math.round para evitar errores de punto flotante tipo 0.00000001
            const lastQuotaAmount = Math.round((balanceToFinance - totalCoveredByNormalQuotas) * 100) / 100;

            for (let i = 0; i < numCuotas; i++) {
                const dueDate = new Date(baseDate);
                dueDate.setDate(dueDate.getDate() + (i + 1) * freqDays);

                // Si es la última cuota, usa el monto de ajuste, si no, el normal
                const amount = (i === numCuotas - 1) ? lastQuotaAmount : quotaAmount;

                installments.push({
                    number: i + 1,
                    dueDate: dueDate.toISOString().split('T')[0],
                    amount: amount
                });
            }
        }
        return installments;
    }, [paymentPlan.quotas, paymentPlan.frecuencia_dias, paymentPlan.initial_date, balanceToFinance]);

    // Función de validación del formulario
    const validate = () => {
        let tempErrors = {};

        // Validación para devicePrice: debe ser numérico y mayor a 0
        if (!devicePrice || devicePrice <= 0) {
            tempErrors.devicePrice = "El valor del dispositivo es requerido y debe ser mayor a 0.";
        }

        if (initialPaymentValue != 0) {
            // Validación para initialPaymentValue: debe ser numérico
            if (initialPaymentValue < 0) tempErrors.initialValue = "El valor del pago inicial no puede ser negativo.";
            if (initialPaymentValue > devicePrice) tempErrors.initialValue = "El pago inicial no puede ser mayor que el valor del dispositivo.";
            if (!initialPayment.method) tempErrors.initialMethod = "El método de pago inicial es requerido.";
            if (!initialPayment.date) tempErrors.initialDate = "La fecha del pago inicial es requerida.";
        }
        
        if (balanceToFinance < 0) {
            tempErrors.balance = "El saldo a financiar no puede ser negativo. Ajusta el pago inicial.";
        } else if (balanceToFinance > 0) {
            if (!paymentPlan.quotas || Number(paymentPlan.quotas) <= 0) tempErrors.quotas = "Si hay saldo a financiar, el número de cuotas es requerido y debe ser mayor a 0.";
            if (!paymentPlan.frecuencia_dias || Number(paymentPlan.frecuencia_dias) <= 0) tempErrors.frecuencia_dias = "La frecuencia es requerida y debe ser mayor a 0.";
            if (!paymentPlan.initial_date) tempErrors.initial_date = "La fecha de inicio del plan es requerida.";
        } else { // balanceToFinance === 0
            if (Number(paymentPlan.quotas) > 0) tempErrors.quotas = "Si no hay saldo a financiar, el número de cuotas debería ser 0.";
            if (Number(paymentPlan.frecuencia_dias) > 0) tempErrors.frecuencia_dias = "Si no hay saldo a financiar, la frecuencia debería ser 0.";
        }

        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    // Manejador del envío del formulario
    const handleSubmit = (e) => {
        e.preventDefault();
        // Antes de validar, asegúrate de que los valores numéricos estén actualizados
        // Esto es especialmente importante si el usuario hace submit sin perder el foco en los inputs
        handleDevicePriceInputBlur(); // Fuerza el formateo y actualización del valor numérico
        handleInitialPaymentValueInputBlur(); // Fuerza el formateo y actualización del valor numérico

        // Pequeño delay para asegurar que los estados numéricos se actualicen antes de la validación
        // Esto es una solución temporal si React no garantiza la actualización sincrónica para 'submit'
        setTimeout(() => {
            if (validate()) {
                const deviceDataToSend = { ...(initialData.device || {}) };

                onNext({
                    device: {
                        ...deviceDataToSend,
                        price_usd: devicePrice, // Enviar el valor numérico real del dispositivo
                        currency: selectedCurrency, // Moneda del dispositivo
                    },
                    paymentPlan: {
                        ...paymentPlan,
                        value: devicePrice, // price_usd ahora es paymentPlan.value
                        monto_cuota: montoPorCuota,
                        balance_to_finance: balanceToFinance,
                        currency: selectedCurrency // Guardar la divisa seleccionada en paymentPlan
                    },
                    initialPayment: {
                        ...initialPayment,
                        value: initialPaymentValue // Enviar el valor numérico real del pago inicial
                    },
                    generatedInstallments
                });
            } else {
                toast.error("Por favor, corrige los errores en el formulario.");
            }
        }, 0); // Un pequeño delay para asegurar la actualización de estados
    };

    // Manejadores para los campos de plan de pago
    const handlePaymentPlanChange = (e) => {
        const { name, value } = e.target;
        setPaymentPlan(prev => ({ ...prev, [name]: ['quotas', 'frecuencia_dias'].includes(name) ? Number(value) : value }));
    };

    // Manejador para los campos de pago inicial (método y fecha)
    const handleInitialPaymentMethodChange = (e) => {
        const { name, value } = e.target;
        setInitialPayment(prev => ({ ...prev, [name]: value }));
    };

    // Manejador para el cambio de moneda
    const handleCurrencyChange = (e) => {
        const newCurrency = e.target.value;
        setSelectedCurrency(newCurrency);

        // Reformatear los valores de los inputs con la nueva moneda.
        // Si el valor numérico es 0, se mostrará en blanco.
        setFormattedDevicePrice(devicePrice !== 0 ? formatCurrency(devicePrice, newCurrency) : '');
        setFormattedInitialPaymentValue(initialPaymentValue !== 0 ? formatCurrency(initialPaymentValue, newCurrency) : '');
    };

    // --- MANEJADORES AJUSTADOS PARA INPUTS DE VALOR ---

    // Manejador del cambio de input de precio del dispositivo
    const handleDevicePriceInputChange = (e) => {
        let value = e.target.value;
        // Permite solo dígitos y un punto/coma decimal.
        // Elimina cualquier caracter que no sea número o decimal
        value = value.replace(/[^\d.,]/g, '');

        // Asegurarse de que solo haya un punto o coma decimal
        const parts = value.split(/[,.]/);
        if (parts.length > 2) {
            value = parts[0] + '.' + parts.slice(1).join(''); // Usa punto como el separador interno
        } else if (parts.length === 2 && value.includes(',')) {
            value = parts[0] + '.' + parts[1]; // Convierte coma a punto internamente
        }

        setFormattedDevicePrice(value); // Actualiza el estado del string del input
    };

    // Manejador cuando el input de precio del dispositivo pierde el foco (aquí se formatea)
    const handleDevicePriceInputBlur = () => {
        const numericValue = parseCurrency(formattedDevicePrice); // Obtiene el número real
        setDevicePrice(numericValue); // Actualiza el estado numérico
        // Si el valor numérico es 0, deja el campo formateado en blanco
        setFormattedDevicePrice(numericValue !== 0 ? formatCurrency(numericValue) : '');
    };

    // Manejador del cambio de input de pago inicial
    const handleInitialPaymentValueInputChange = (e) => {
        let value = e.target.value;
        // Permite solo dígitos y un punto/coma decimal.
        // Elimina cualquier caracter que no sea número o decimal
        value = value.replace(/[^\d.,]/g, '');

        // Asegurarse de que solo haya un punto o coma decimal
        const parts = value.split(/[,.]/);
        if (parts.length > 2) {
            value = parts[0] + '.' + parts.slice(1).join(''); // Usa punto como el separador interno
        } else if (parts.length === 2 && value.includes(',')) {
            value = parts[0] + '.' + parts[1]; // Convierte coma a punto internamente
        }

        setFormattedInitialPaymentValue(value); // Actualiza el estado del string del input
    };

    // Manejador cuando el input de pago inicial pierde el foco (aquí se formatea)
    const handleInitialPaymentValueInputBlur = () => {
        const numericValue = parseCurrency(formattedInitialPaymentValue); // Obtiene el número real
        setInitialPaymentValue(numericValue); // Actualiza el estado numérico
        // Si el valor numérico es 0, deja el campo formateado en blanco
        setFormattedInitialPaymentValue(numericValue !== 0 ? formatCurrency(numericValue) : '');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-900">Paso 3: Pago y Plan</h2>
                <div className="relative">
                    <label htmlFor="currency-select" className="sr-only">Seleccionar Moneda</label>
                    <select
                        id="currency-select"
                        name="currency"
                        value={selectedCurrency}
                        onChange={handleCurrencyChange}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
                    >
                        {Object.entries(CURRENCIES).map(([code, config]) => (
                            <option key={code} value={code}>
                                {config.name} ({code})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-white shadow-md rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Detalles de Valor y Saldo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="devicePrice" className="block text-sm font-medium text-gray-700">Valor del Dispositivo</label>
                        <div className="relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 w-14 pointer-events-none">
                                <span className="text-gray-500 sm:text-sm truncate">
                                    {formattedDevicePrice !== '' ? (CURRENCIES[selectedCurrency]?.symbol || '') : ''}
                                </span>
                            </div>
                            <input
                                type="text" // Sigue siendo 'text' para permitir la entrada flexible antes del formateo
                                name="devicePrice"
                                id="devicePrice"
                                value={formattedDevicePrice} // Usamos el estado del string
                                onChange={handleDevicePriceInputChange}
                                onBlur={handleDevicePriceInputBlur}
                                className="block w-full pl-16 pr-3 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2"
                                placeholder="0.00" // El placeholder ayuda visualmente cuando está vacío
                            />
                        </div>
                        {errors.devicePrice && <p className="mt-1 text-sm text-red-600">{errors.devicePrice}</p>}
                    </div>
                    <div>
                        <label htmlFor="initialValue" className="block text-sm font-medium text-gray-700">Valor Pago Inicial</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">
                                    {formattedInitialPaymentValue !== '' ? (CURRENCIES[selectedCurrency]?.symbol || '') : ''}
                                </span>
                            </div>
                            <input
                                type="text" // Sigue siendo 'text'
                                name="value"
                                id="initialValue"
                                value={formattedInitialPaymentValue} // Usamos el estado del string
                                onChange={handleInitialPaymentValueInputChange}
                                onBlur={handleInitialPaymentValueInputBlur}
                                className="block w-full pl-16 pr-3 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2"
                                placeholder="0.00" // El placeholder ayuda visualmente cuando está vacío
                            />
                        </div>
                        {errors.initialValue && <p className="mt-1 text-sm text-red-600">{errors.initialValue}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Saldo a Financiar</label>
                        <p className="mt-1 block w-full bg-gray-100 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-800 sm:text-sm">
                            {formatCurrency(balanceToFinance)}
                        </p>
                        {errors.balance && <p className="mt-1 text-sm text-red-600">{errors.balance}</p>}
                    </div>
                </div>
            </div>

            
                <div className="bg-white shadow-md rounded-lg p-6 mt-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Detalles del Plan de Pagos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="quotas" className="block text-sm font-medium text-gray-700">Número de Cuotas</label>
                        <input
                        type="number"
                        name="quotas"
                        id="quotas"
                        value={paymentPlan.quotas}
                        onChange={handlePaymentPlanChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        min="0"
                        />
                        {errors.quotas && <p className="mt-1 text-sm text-red-600">{errors.quotas}</p>}
                    </div>
                    <div>
                        <label htmlFor="frecuencia_dias" className="block text-sm font-medium text-gray-700">Frecuencia (días)</label>
                        <input
                        type="number"
                        name="frecuencia_dias"
                        id="frecuencia_dias"
                        value={paymentPlan.frecuencia_dias}
                        onChange={handlePaymentPlanChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        min="1"
                        />
                        {errors.frecuencia_dias && <p className="mt-1 text-sm text-red-600">{errors.frecuencia_dias}</p>}
                    </div>
                    <input
                        type="date"
                        name="initial_date"
                        id="initial_date"
                        value={paymentPlan.initial_date}
                        onChange={handlePaymentPlanChange}
                        min={localDate()}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    </div>
                </div>

            {formattedInitialPaymentValue != '' && (<div className="bg-white shadow-md rounded-lg p-6 mt-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Detalles del Pago Inicial</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="initialMethod" className="block text-sm font-medium text-gray-700">Método de Pago Inicial</label>
                        <select
                            name="method"
                            id="initialMethod"
                            value={initialPayment.method}
                            onChange={handleInitialPaymentMethodChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="">Selecciona un método</option>
                            <option value="Efectivo">Efectivo</option>
                            <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                            <option value="Tarjeta de Débito">Tarjeta de Débito</option>
                            <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                            <option value="PSE">PSE</option>
                        </select>
                        {errors.initialMethod && <p className="mt-1 text-sm text-red-600">{errors.initialMethod}</p>}
                    </div>
                    <div>
                        <label htmlFor="initialDate" className="block text-sm font-medium text-gray-700">Fecha de Pago Inicial</label>
                        <input
                            type="date"
                            name="date"
                            id="initialDate"
                            value={initialPayment.date}
                            onChange={handleInitialPaymentMethodChange}
                             min={localDate()}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        {errors.initialDate && <p className="mt-1 text-sm text-red-600">{errors.initialDate}</p>}
                    </div>
                </div>
            </div>)}

            {generatedInstallments.length > 0 && (
                <div className="bg-white shadow-md rounded-lg p-6 mt-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Detalle del Plan de Pagos Programado</h3>
                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Cuota
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Fecha Vencimiento
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Monto ({selectedCurrency})
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
                                            {formatDisplayDate(new Date(installment.dueDate))}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatCurrency(installment.amount)}
                                        </td>
                                    </tr>
                                ))}
                                <tr>
                                    <td colSpan="2" className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                                        Total a Financiar
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                        {formatCurrency(balanceToFinance)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

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
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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

export default Step3PaymentPlan;