import React, { useState, useEffect } from 'react';
import SimManagementModal from '../components/SimManagementModal';
import ContractViewModal from '../components/ContractViewModal';
import RegisterPaymentModal from '../components/RegisterPaymentModal';
import DeviceMapComponent from '../components/DeviceMapComponent';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

import { approveDeviceSim, removeDeviceSim, getSims } from '../../../api/devices';
import NotifyModal from '../components/NotifyModal';
import { downloadContract } from '../../../api/plans';
import { formatDisplayDate } from '../../../common/utils/helpers';
import ReEnrollmentModal from '../components/ReEnrollmentModal';

import { getProvisioningJson } from '../../../api/enrolments';

const DeviceDetailsView = ({
    plan,
    location,
    payments,
    actionsHistory,
    onBackToList,
    onBlock,
    onSubmitPayment,
    onUnblock,
    onLocate,
    onRelease,
    onUpdateDevice,
    onNotification,
    userRole,
    onDeviceUpdate,
    isPolling
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [localSims, setLocalSims] = useState([]);

    const [isSimModalOpen, setIsSimModalOpen] = useState(false);
    const [isReEnrollmentOpen, setIsReEnrollmentOpen] = useState(false);
    const [qrCode, setQrCode] = useState(null);
    const [isContractModalOpen, setIsContractModalOpen] = useState(false);
    const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isPaid, setIsPaid] = useState(false);
    const [contractUrl, setContractUrl] = useState(null);

    const dummyContractUrl = 'https://www.africau.edu/images/default/sample.pdf';

    useEffect(() => {
        if (plan.device) {
            const newFormData = {
                name: plan.device.name || '',
                description: plan.device.description || '',
                imei: plan.value || '',
                imei2: plan.device.imei2 || '',
                serial_number: plan.device.serial_number || '',
                model: plan.device.model || '',
                brand: 'sdasdsadsdads',
                price: plan.value || 0,
                purchase_date: plan.initial_date || '',
                state: plan.device.state || 'Active'
            };
            setFormData(newFormData);
            // console.log('AAA')
            getLastBlockState();
        }
    }, [plan.device]);
    
    useEffect(() => {
        const paymentsValue = payments
            .filter(payment => payment.state === 'Approved')
            .reduce((total, payment) => total + parseFloat(payment.value), 0);

        // Redondear a 2 decimales por seguridad
        const roundedPaymentsValue = parseFloat(paymentsValue.toFixed(2));
        const planValue = parseFloat(plan.value);
        setIsPaid(roundedPaymentsValue >= planValue);
    }, [payments]);


    /**
     * Metodo para obtener el ultimo estado de la acción ejecutada al dispositivo
     * @param {*} e 
     */
    const getLastBlockState = () => {
        if (!Array.isArray(actionsHistory)) return null;

        const filtered = actionsHistory.filter(action =>
            action.action === 'block' || action.action === 'unblock'
        );

        if (filtered.length === 0) return 'unblock';

        const sorted = filtered.sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );

        // console.log('ESTADO: ', sorted[0].action);

        return sorted[0].action; // devuelve "block" o "unblock"
    };



    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const data = {
                ...formData,
                purchase_date: formData.purchase_date ? new Date(formData.purchase_date).toISOString() : null,
                warranty_end_date: formData.warranty_end_date ? new Date(formData.warranty_end_date).toISOString() : null,
            };

            const dataToSend = {
                name: data.name,
                state: data.state,

            }

            await onUpdateDevice(plan.device_id, dataToSend);
            setIsEditing(false);
            if (onDeviceUpdate) {
                onDeviceUpdate();
            }
        } catch (error) {
            // console.error("Failed to save device:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleOpenSimModal = async () => {
        const toasId = toast.loading(`Obteniendo sims.`);

        try {
            const simsResponse = await getSims(plan.device_id);
            setLocalSims(simsResponse);
            toast.dismiss(toasId);
            setIsSimModalOpen(true);
        } catch (err) {
            // console.error('Error al cargar detalles de la sim:', err);
            setError('Error al cargar los detalles de la sim.');
        }
    };

    const handleCloseSimModal = () => {
        setIsSimModalOpen(false);
        if (onDeviceUpdate) {
            onDeviceUpdate();
        }
    };

     const handleReEnrollmentOpen = async () => {
        toast.success('Obteniendo QR...')
        try {
            // Obtener el objeto del localStorage
            const storedUser = localStorage.getItem("user"); // Usa la clave con la que guardaste el objeto
            if (!storedUser) {
                // console.log("No se encontró el datos del usuario en el localStorage");
                return;  
            }
            
            var storeId = null;
            try {
                const user = JSON.parse(storedUser); // Convertir de JSON a objeto
                storeId = user.store?.id; // Acceder al ID del store (usa optional chaining por seguridad)
                // console.log("Store ID:", storeId);
            } catch (error) {
                // console.error("Error al parsear el objeto del localStorage", error);
            }

            const qrCode = await getProvisioningJson(plan.device.enrolment_id, storeId, true);
            setQrCode(qrCode);
            setIsReEnrollmentOpen(true);   
        } catch (error) {
            toast.error('Error cargando Qr...')
        }
    };

    const handleReEnrollmentClose = () => {
        setIsReEnrollmentOpen(false);
        if (onDeviceUpdate) {
            onDeviceUpdate();
        }
    };

    const handleOpenContractModal = async () => {
        toast.success('Cargando contrato...')
        try {
            const blob = await downloadContract(plan.plan_id);
            const blobUrl = URL.createObjectURL(blob);
            setContractUrl(blobUrl);
            setIsContractModalOpen(true);
        } catch (error) {
            toast.error('Error cargando contrato...')
        }
    };


    const handleCloseContractModal = () => {
        setIsContractModalOpen(false);
    };

    const handleOpenNotifyModal = () => {
        setIsNotifyModalOpen(true);
    };

    const handleCloseNotifyModal = () => {
        setIsNotifyModalOpen(false);
    };

    const handleOpenPaymentModal = () => {
        setIsPaymentModalOpen(true);
    };

    const handleClosePaymentModal = () => {
        setIsPaymentModalOpen(false);
    };


    const handleApproveSim = async (simId, iccId) => {
        try {
            const updatedSim = await approveDeviceSim(plan.device.device_id, simId);

            setLocalSims(prev =>
                prev.map(sim => sim.icc_id === iccId ? updatedSim : sim)
            );
            toast.success(`SIM ${iccId} aprobada con éxito.`);
            return true;
        } catch (error) {
            const errorMessage = error.response?.data?.detail || error.message || 'Error desconocido al aprobar SIM';
            Swal.fire('Error', `Error al aprobar SIM ${iccId}: ${errorMessage}`, 'error');
            // console.error('Error al aprobar SIM:', error);
            return false;
        }
    };

    const handleRemoveSim = async (simId, iccId) => {
        try {
            const updatedSim = await removeDeviceSim(plan.device.device_id, simId);
            setLocalSims(prev =>
                prev.map(sim => sim.icc_id === iccId ? updatedSim : sim)
            );
            toast.success(`SIM ${iccId} desvinculada con éxito.`);
            return true;
        } catch (error) {
            const errorMessage = error.response?.data?.detail || error.message || 'Error desconocido al desvincular SIM';
            Swal.fire('Error', `Error al desvincular SIM ${iccId}: ${errorMessage}`, 'error');
            // console.error('Error al desvincular SIM:', error);
            return false;
        }
    };



    if (!plan.device) {
        return <div className="text-center py-8">Cargando detalles del dispositivo...</div>;
    }

    const getStatusClass = (status) => {
        if (isPaid) {
            return 'bg-green-100 text-blue-800';
        }
        switch (status) {
            case 'Active': return 'bg-green-100 text-green-800';
            case 'Inactive': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStateName = (status) => {
        if (isPaid) {
            return 'Pagado';
        }
        switch (status) {
            case 'Active': return 'Activo';
            case 'Inactive': return 'Inactivo';
            default: return '';
        }
    };

    const getDescription = (index) => {
        if (index == 0) {
            return `Cuota inicial`;
        }
        return `Cuota ${index} de ${plan.quotas}`
    };

    const isSuperAdmin = userRole === 'superadmin';

    const generalInfoFields = [
        { key: 'product_name', label: 'Nombre' }, { key: 'serial_number', label: 'Serial' },
        { key: 'model', label: 'Modelo' }, { key: 'brand', label: 'Marca' },
        { key: 'imei', label: 'IMEI 1' }, { key: 'imei2', label: 'IMEI 2' },
        { key: 'state', label: 'Estado' }, { key: 'price', label: 'Precio', type: 'number' },
        { key: 'purchase_date', label: 'Fecha de Compra', type: 'date' },
        { key: 'period', label: 'Periodo (días)', type: 'number' },
        { key: 'user', label: 'Cliente' },
        { key: 'location', label: 'Ubicación' },
        // { key: 'created_at', label: 'Creado el' }, { key: 'updated_at', label: 'Última Actualización' },
    ];

    const fieldsToExcludeFromDirectEdit = [
        'device_id',
        'serial_number',
        'model',
        'brand',
        'imei',
        'product_name',
        'imei_two',
        'created_at',
        'updated_at',
        'location',
        'purchase_date',
        'vendor',
        'period',
        'user'
    ];

    if (isPaid) {
        fieldsToExcludeFromDirectEdit.push('state'); // reemplaza 'new_field_name' con el que quieras agregar
    }

    const actionLabels = {
        block: "Bloqueo",
        unblock: "Desbloqueo",
        locate: "Ubicación",
        notify: "Notificación",
        unenroll: "Liberado",
        block_sim: "Bloqueo de Sim",
        unblock_sim: "Desbloqueo de Sim"
    };

    const stateLabels = {
        pending: "Pendiente por ejecutar",
        failed: "Fallida",
        applied: "Aplicada"
    };

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // o cualquier cantidad que quieras mostrar
    const totalPages = Math.ceil(actionsHistory?.length / itemsPerPage) || 1;

    const paginatedActions = actionsHistory.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="bg-white p-6 rounded-lg shadow-xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={onBackToList}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg inline-flex items-center transition duration-200 ease-in-out"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    Volver
                </button>
                <h2 className="text-3xl font-extrabold text-gray-900">
                    Detalles del Dispositivo: {plan.device.name}
                </h2>
                <div className="w-24"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Columna Izquierda: Información General */}
                
                <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-4">Información General</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {generalInfoFields.map(({ key, label, type }) => {
                            const isEditableField = !fieldsToExcludeFromDirectEdit.includes(key);

                            return (
                                <div key={key} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                                    <label className="block text-xs font-medium text-gray-700">
                                        {label}
                                    </label>
                                    {isEditing && isEditableField ? (
                                        key === 'state' ? (
                                            <select
                                                name="state"
                                                value={formData.state}
                                                onChange={handleChange}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                            >
                                                <option value="Active">Activo</option>
                                                <option value="Inactive">Inactivo</option>
                                            </select>
                                        ) : type === 'textarea' ? (
                                            <textarea
                                                name={key}
                                                value={formData[key]}
                                                onChange={handleChange}
                                                rows="3"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                            ></textarea>
                                        ) : (
                                            <input
                                                type={type || 'text'}
                                                name={key}
                                                value={formData[key]}
                                                onChange={handleChange}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                            />
                                        )
                                    ) : (
                                        <p className="mt-1 text-sm text-gray-900 font-semibold">
                                            {key === 'state' ? (
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(plan.device.state)}`}>
                                                    {getStateName(plan.device.state) || 'N/A'}
                                                </span>
                                            ) : (
                                                (key === 'purchase_date') ? plan.initial_date :
                                                    (key === 'price') ? (new Intl.NumberFormat('es-CO', {
                                                        style: 'currency',
                                                        currency: 'COP',
                                                        minimumFractionDigits: 0
                                                    }).format(Number(plan.value))) :
                                                        (key === 'location') ? (location
                                                            ? `${location.latitude}, ${location.longitude}`
                                                            : 'N/A') :
                                                            (key === 'user') ? ([plan.user?.first_name, plan.user?.middle_name, plan.user?.last_name, plan.user?.second_last_name]
                                                                .filter(Boolean)
                                                                .join(' ') || 'N/A'
                                                            ) :
                                                                (key === 'created_at' || key === 'updated_at')
                                                                    ? (new Date(plan.device[key]).toLocaleString() || 'N/A')
                                                                    : (plan.device[key] || plan[key] || 'N/A')
                                            )}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                        {/* New: Ver Contrato button */}
                        {!isEditing && isSuperAdmin && (
                            <div className="col-span-full sm:col-span-1 lg:col-span-1 flex justify-center items-center">
                                <button
                                    onClick={handleOpenContractModal}
                                    className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition duration-200 ease-in-out w-full"
                                >
                                    Ver Contrato
                                </button>
                            </div>
                        )}
                        {/* SIM button moved next to Ver Contrato */}
                        {!isEditing && isSuperAdmin && (
                            <div className="col-span-full sm:col-span-1 lg:col-span-1 flex justify-center items-center">
                                <button
                                    onClick={handleOpenSimModal}
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition duration-200 ease-in-out w-full"
                                >
                                    Ver SIM
                                </button>
                            </div>
                        )}

                        {/* New: Mensaje button */}
                        {!isEditing && isSuperAdmin && (
                            <div className="col-span-full sm:col-span-1 lg:col-span-1 flex justify-center items-center">
                                <button
                                    onClick={handleOpenNotifyModal}
                                    className={`bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition duration-200 ease-in-out w-full`}
                                >
                                    Enviar mensaje
                                </button>
                            </div>
                        )}

                        {/* New: Mensaje button */}
                        {!isEditing && isSuperAdmin && (
                            <div className="col-span-full sm:col-span-1 lg:col-span-1 flex justify-center items-center">
                                <button
                                    onClick={handleReEnrollmentOpen}
                                    className={`bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition duration-200 ease-in-out w-full`}
                                >
                                    ReEnrolar
                                </button>
                            </div>
                        )}


                        {isEditing && (
                            <>
                                <div className="col-span-full sm:col-span-1 lg:col-span-1 flex justify-end items-end">
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className={`bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition duration-200 ease-in-out w-full ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {isSaving ? 'Guardando...' : 'Guardar'}
                                    </button>
                                </div>
                                <div className="col-span-full sm:col-span-1 lg:col-span-1 flex justify-end items-end">
                                    <button
                                        onClick={() => {
                                            setIsEditing(false);
                                            setFormData({
                                                name: plan.device.name || '', description: plan.device.description || '',
                                                imei: plan.device.imei || '', imei2: plan.device.imei2 || '',
                                                serial_number: plan.device.serial_number || '', model: plan.device.model || '',
                                                brand: plan.device.brand || '', price: plan.device.price || 0,
                                                purchase_date: plan.device.purchase_date ? plan.device.purchase_date.split('T')[0] : '',
                                                warranty_end_date: plan.device.warranty_end_date ? plan.device.warranty_end_date.split('T')[0] : '',
                                                assigned_to_user_id: plan.device.assigned_to_user_id || '',
                                                state: plan.device.state || 'Active', location: plan.device.location || '',
                                                notes: plan.device.notes || '', created_at: plan.device.created_at || '',
                                                updated_at: plan.device.updated_at || '',
                                                last_location_latitude: plan.device.last_location_latitude || '',
                                                last_location_longitude: plan.device.last_location_longitude || '',
                                            });
                                        }}
                                        className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition duration-200 ease-in-out w-full"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Columna Derecha: Ubicación y Acciones */}
                <div className="flex flex-col gap-6">
                    {/* Ubicación del Dispositivo */}
                    <div className="bg-gray-50 p-6 rounded-lg shadow-inner flex-grow z-0">
                        <h3 className="text-2xl font-semibold text-gray-800 mb-4">Ubicación del Dispositivo</h3>
                        {/* Aquí integramos el DeviceMapComponent */}
                        <DeviceMapComponent
                            latitude={location?.latitude ?? 0}
                            longitude={location?.longitude ?? 0}
                            deviceSerial={plan.device.serial_number || plan.device.name} // Usar serial o nombre para el popup
                        />
                        {/* Botón Localizar: siempre habilitado */}
                        {isSuperAdmin && (
                            <button
                                onClick={() => onLocate(plan.device.device_id, false)}
                                className={`mt-4 bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200 ease-in-out w-full ${isPolling ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                Notificar Ubicación
                            </button>
                        )}
                    </div>

                    {/* Acciones del Dispositivo */}
                    <div className="bg-gray-50 p-6 rounded-lg shadow-inner flex-grow">
                        <h3 className="text-2xl font-semibold text-gray-800 mb-4">Acciones del Dispositivo</h3>
                        <div className="mb-4">
                            {isSuperAdmin && getLastBlockState() == 'unblock' && (
                                <button
                                    onClick={() => onBlock(plan.device.device_id, false)}
                                    className={`bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200 ease-in-out w-full`}
                                >
                                    Bloquear
                                </button>
                            )}
                            {isSuperAdmin && getLastBlockState() == 'block' && (
                                <button
                                    onClick={() => onUnblock(plan.device.device_id, false)}
                                    className={`bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200 ease-in-out w-full`}
                                >
                                    Desbloquear
                                </button>
                            )}
                        </div>
                        {/* <div className="mb-4 flex flex-col sm:flex-row gap-2"> */}
                            {/* Botón de Bloquear */}
                            {/* {isSuperAdmin && (
                                <button
                                    onClick={() => onBlock(plan.device.device_id)}
                                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200 ease-in-out w-full"
                                >
                                    Bloquear
                                </button>
                            )} */}

                            {/* Botón de Desbloquear */}
                            {/* {isSuperAdmin && (
                                <button
                                    onClick={() => onUnblock(plan.device.device_id)}
                                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200 ease-in-out w-full"
                                >
                                    Desbloquear
                                </button>
                            )} */}
                        {/* </div> */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                            {isSuperAdmin && (
                                <button
                                    onClick={handleOpenPaymentModal}
                                    disabled={isPaid}
                                    className={`bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200 ease-in-out w-full ${(isPaid) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    Registrar Pago
                                </button>
                            )}
                            {isSuperAdmin && (
                                <button
                                    onClick={() => onRelease(plan.device.device_id)}
                                    disabled={!isPaid}
                                    className={`bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200 ease-in-out w-full ${(!isPaid) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    Liberar
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Historial de Acciones (debajo de las columnas principales) */}
            <div className="mt-8 bg-gray-50 p-6 rounded-lg shadow-inner">
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">Historial de Acciones</h3>
                {Array.isArray(actionsHistory) && actionsHistory.length > 0 ? (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha/Hora</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aplicado por</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {paginatedActions.map((action, index) => {
                                        const key = action.id || `${action.action}-${action.created_at}-${index}`;

                                        return (
                                            <tr key={key}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {actionLabels[action.action] || action.action}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {stateLabels[action.state] || action.state}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDisplayDate(action.created_at, true, false)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {action.applied_by
                                                        ? [
                                                            action.applied_by.first_name,
                                                            action.applied_by.middle_name,
                                                            action.applied_by.last_name,
                                                            action.applied_by.second_last_name,
                                                        ]
                                                            .filter(Boolean)
                                                            .join(' ')
                                                        : '—'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginación */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center mt-4 space-x-2">
                                <button
                                    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    Anterior
                                </button>
                                <span className="text-sm text-gray-700">
                                    Página {currentPage} de {totalPages}
                                </span>
                                <button
                                    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                >
                                    Siguiente
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <p className="text-gray-600">No hay historial de acciones disponible.</p>
                )}
            </div>

            {/* Historial de Pagos (debajo del historial de acciones) */}
            <div className="mt-8 bg-gray-50 p-6 rounded-lg shadow-inner">
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">Historial de Pagos</h3>
                {payments.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metodo</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {payments.map((payment, index) => (
                                    <tr key={payment.payment_id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getDescription(index)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.date.split("T")[0]}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.method}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${payment.value}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-gray-600">No hay historial de pagos disponible.</p>
                )}
            </div>

            {/* Modal de Gestión de SIMs */}
            {isSimModalOpen && (
                <SimManagementModal
                    sims={localSims}
                    isOpen={isSimModalOpen}
                    onClose={handleCloseSimModal}
                    device={plan.device}
                    onApproveSim={handleApproveSim}
                    onRemoveSim={handleRemoveSim}
                />
            )}

            {/* Modal para Ver Contrato */}
            {isContractModalOpen && (
                <ContractViewModal
                    isOpen={isContractModalOpen}
                    onClose={handleCloseContractModal}
                    contractUrl={contractUrl} // Pass the contract URL here
                />
            )}

            {/* Modal para Ver Contrato */}
            {isNotifyModalOpen && (
                <NotifyModal
                    isOpen={isNotifyModalOpen}
                    onClose={handleCloseNotifyModal}
                    onSubmit={onNotification}
                    deviceId={plan.device_id}
                    isTelevision={false}
                />
            )}

            {/* Modal para Ver Contrato */}
            {isPaymentModalOpen && (
                <RegisterPaymentModal
                    isOpen={isPaymentModalOpen}
                    onClose={handleClosePaymentModal}
                    onSubmit={onSubmitPayment}
                    plan={plan}
                    payments={payments}
                />
            )}

             {/* Modal para ReEnrolar */}
            {isReEnrollmentOpen && (
                <ReEnrollmentModal
                    isOpen={isReEnrollmentOpen}
                    onClose={handleReEnrollmentClose}
                    enrollmentId={plan.device.enrolment_id}
                    qrCode={qrCode}
                />
            )}
        </div>
    );
};

export default DeviceDetailsView;