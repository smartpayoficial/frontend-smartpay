// src/pages/payments/components/Step2DeviceProvisioning.jsx
import React, {useState, useEffect, useCallback, useRef} from 'react';
import {QrCodeIcon, WifiIcon, CheckCircleIcon, ArrowPathIcon, ClipboardIcon, CheckIcon} from '@heroicons/react/24/outline';
import {ChevronLeftIcon, ChevronRightIcon} from '@heroicons/react/24/solid';
import {toast} from 'react-toastify';
import QRCode from 'react-qr-code';
import Swal from 'sweetalert2';

import {
    createEnrolment,
    getDeviceByEnrolmentId,
    getTelevisorByEnrolmentId,
    getProvisioningJson,
} from '../../../api/enrolments';
import {useAuth} from "../../../common/context/AuthProvider.jsx";
import PlatformDropdown from "../utils/PlatformDropdown.jsx";
import downloadFile from "../utils/DownloadFile.jsx";
import generateFile from "../utils/GenerateFile.jsx";
import downloadFileFromUrl from "../utils/DownloadFileFromUrl.jsx";

const Step2DeviceProvisioning = ({onNext, onBack, initialData = {}, onDataChange}) => {
    const [qrGenerated, setQrGenerated] = useState(false);
    const [deviceConnected, setDeviceConnected] = useState(false);
    const [deviceDetails, setDeviceDetails] = useState(initialData.device || null);
    const [deviceType, setDeviceType] = useState(true); // true = device, false = television
    const [loading, setLoading] = useState(true);
    const [isPolling, setIsPolling] = useState(false);
    const [qrProvisioningData, setQrProvisioningData] = useState(null);
    const [currentEnrolmentId, setCurrentEnrolmentId] = useState(null);
    const hasStartedProvisioning = useRef(false);

    const [simulateDummyDevice, setSimulateDummyDevice] = useState(false);

    const deviceTypeRef = useRef(deviceType);
    const [isCopied, setIsCopied] = useState(false);
    const user = useAuth().user;

    // 2. Función para copiar el ID
    const copyToClipboard = () => {
        if (currentEnrolmentId) {
            navigator.clipboard.writeText(currentEnrolmentId).then(() => {
                // Muestra la confirmación de copiado
                setIsCopied(true);
                // Restablece el estado de copiado después de 2 segundos (2000 ms)
                setTimeout(() => setIsCopied(false), 2000);
            }).catch(err => {
                console.error('No se pudo copiar el texto: ', err);
            });
        }
    };

    useEffect(() => {
        deviceTypeRef.current = deviceType;
    }, [deviceType]);

    const checkDeviceConnection = useCallback(async (enrollmentId) => {
        let connected = false;
        let attempts = 0;
        const maxAttempts = 300;
        const delay = 3000;

        while (!connected && attempts < maxAttempts) {
            attempts++;
            try {
                console.log('x2 EnrollmentId:', enrollmentId);

                const currentDeviceType = deviceTypeRef.current;
                console.log('DeviceType actual:', currentDeviceType);


                const response = currentDeviceType ? await getDeviceByEnrolmentId(enrollmentId) : await getTelevisorByEnrolmentId(enrollmentId);
                console.log("Response step2", response);
                if (response) {
                    setDeviceDetails(response);
                    setDeviceConnected(true);
                    toast.success(`${deviceType ? "Dispositivo" : "Televisor"} conectado y datos obtenidos.`);
                    connected = true;
                    break;
                }
            } catch (error) {
                if (error.response?.status !== 404) {
                    console.error(`Error en polling:`, error);
                    toast.warn(`Error del servidor (código ${error.response?.status}). Intento ${attempts}.`);
                }
            }
            if (!connected) {
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }

        if (!connected) {
            toast.error('Tiempo de espera agotado. El dispositivo no se conectó.');
        }
        setIsPolling(false);
    }, [initialData]);

    const startProvisioningProcess = useCallback(async (forceNew = false) => {
        if (initialData.device && !forceNew) {
            setDeviceDetails(initialData.device);
            setDeviceConnected(true);
            setQrGenerated(true);
            setCurrentEnrolmentId(initialData.device.enrolment_id);
            setLoading(false);
            setIsPolling(false);
            return;
        }

        if (initialData.enrolment_id && initialData.qrProvisioningData && !forceNew) {
            setQrProvisioningData(initialData.qrProvisioningData);
            setCurrentEnrolmentId(initialData.enrolment_id);
            setQrGenerated(true);
            setLoading(false);
            setIsPolling(true);
            toast.success('QR recuperado. Escanea el código con el dispositivo.');
            toast.info('Esperando que el dispositivo establezca conexión...');
            setTimeout(() => checkDeviceConnection(initialData.enrolment_id), 1000);
            return;
        }

        setLoading(true);
        setQrGenerated(false);
        setDeviceConnected(false);
        setDeviceDetails(null);
        setQrProvisioningData(null);
        setCurrentEnrolmentId(null);
        setIsPolling(false);

        if (simulateDummyDevice) {
            toast.info('Simulando aprovisionamiento de dispositivo dummy...');
            const timer = setTimeout(() => {
                const dummyDeviceId = '40b42af7-10e5-4773-98e6-f8ef60342494';
                const dummyEnrolmentId = initialData.customer?.user_id ? `ENR-${initialData.customer.user_id.substring(0, 8)}-${Date.now()}` : `ENR-${uuidv4().substring(0, 8)}-${Date.now()}`;

                const dummyDevice = {
                    device_id: dummyDeviceId,
                    enrolment_id: dummyEnrolmentId,
                    product_name: "SmartPOS T-800 Simulada",
                    brand: "OlimpoTech Sim.",
                    model: "T800-SP-PRO-Sim",
                    serial_number: `SN-${Date.now().toString().slice(-8)}`,
                    imei: `IMEI-${Math.floor(Math.random() * 1000000000000000)}`,
                    imei_two: `IMEI2-${Math.floor(Math.random() * 1000000000000000)}`,
                    state: "Activo",
                };

                setDeviceDetails(dummyDevice);
                setDeviceConnected(true);
                setLoading(false);
                setIsPolling(false);
                toast.success('Dispositivo dummy aprovisionado y listo para continuar.');
            }, 1500);

            return () => clearTimeout(timer);
        }

        try {
            toast.info('Generando QR y preparando enrolamiento...');

            const enrolmentPayload = {
                user_id: initialData.customer?.user_id,
                vendor_id: initialData.authenticatedUser?.user_id,
            };

            const enrolmentCreationResponse = await createEnrolment(enrolmentPayload);
            const enrollmentId = enrolmentCreationResponse?.enrolment_id;
            setCurrentEnrolmentId(enrollmentId);

            const storedUser = localStorage.getItem("user");
            if (!storedUser) {
                console.log("No se encontró el datos del usuario en el localStorage");
                return;
            }

            var storeId = null;
            try {
                const user = JSON.parse(storedUser);
                storeId = user.store?.id;
            } catch (error) {
                console.error("Error al parsear el objeto del localStorage", error);
            }

            const provisioningJson = await getProvisioningJson(enrollmentId, storeId, false);
            setQrProvisioningData(provisioningJson);

            onDataChange({enrolment_id: enrollmentId, qrProvisioningData: provisioningJson});

            setQrGenerated(true);
            setLoading(false);
            setIsPolling(true);
            toast.success('QR generado. Escanea el código con el dispositivo.');
            toast.info('Esperando que el dispositivo establezca conexión...');

            setTimeout(() => checkDeviceConnection(enrollmentId), 1000);
        } catch (error) {
            console.error('Error en aprovisionamiento:', error);
            setLoading(false);
            setIsPolling(false);
            toast.error(`Error: ${error.message}`);
        }
    }, [initialData, simulateDummyDevice, onDataChange, checkDeviceConnection]);

    useEffect(() => {
        if (!initialData.device && !hasStartedProvisioning.current) {
            hasStartedProvisioning.current = true;
            startProvisioningProcess();
        } else if (initialData.device) {
            setDeviceDetails(initialData.device);
            setDeviceConnected(true);
            setLoading(false);
        }
    }, [startProvisioningProcess, initialData.device]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (deviceDetails) {
            onNext({device: deviceDetails});
        } else {
            toast.error(
                simulateDummyDevice
                    ? 'Esperando que la simulación finalice.'
                    : 'Conecta el dispositivo para continuar.'
            );
        }
    };

    const handleForceNewEnrolment = () => {
        Swal.fire({
            title: '¿Generar nuevo enrolamiento?',
            text: "Usarse si el enrolamiento anterior falló.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, generar nuevo',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                onDataChange({enrolment_id: null, qrProvisioningData: null, device: null});
                hasStartedProvisioning.current = false;
                startProvisioningProcess(true);
            }
        });
    };

    const handleBat = (platform) => {
        if (platform === 'Windows') {
            const scriptContent = generateFile(currentEnrolmentId, user.store.id);
            downloadFile(scriptContent, 'install_smartpay.bat', 'application/bat');
        } else if (platform === 'Linux') {
            console.log("Iniciando lógica para Linux...");
            // Lógica para Linux...
            // Por ejemplo: const linuxScriptContent = createLinuxScript(user.store.id);
        }
        // Puedes añadir más lógica si agregas más plataformas al dropdown
    };

    const handleABD = (platform) => {
        if (platform === 'Windows') {
            const ADB_ZIP_URL = "https://appincdevs.com/enterprise/television/windows/adb.zip";
            downloadFileFromUrl(ADB_ZIP_URL, "adb.zip");
        } else if (platform === 'Linux') {
            console.log("Iniciando lógica para Linux...");
            // Lógica para Linux...
            // Por ejemplo: const linuxScriptContent = createLinuxScript(user.store.id);
        }
        // Puedes añadir más lógica si agregas más plataformas al dropdown
    };

    console.log('Datos provis', deviceDetails);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">Paso 2: Aprovisionamiento</h2>

            {import.meta.env.VITE_DEVELOPMENT_MODE === 'true' && (
                <div className="flex items-center justify-end mb-4">
          <span className="mr-3 text-sm font-medium text-gray-900">
            Modo de Simulación Dummy
          </span>
                    <label
                        htmlFor="toggle-dummy"
                        className="relative inline-flex items-center cursor-pointer"
                    >
                        <input
                            type="checkbox"
                            id="toggle-dummy"
                            className="sr-only peer"
                            checked={simulateDummyDevice}
                            onChange={(e) => {
                                setSimulateDummyDevice(e.target.checked);
                                handleForceNewEnrolment();
                            }}
                        />
                        <div
                            className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                </div>
            )}

            <div className="flex items-center gap-3">
                <label className="relative flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={deviceType}
                        onChange={(e) => setDeviceType(e.target.checked)}
                    />

                    {/* Fondo del switch */}
                    <div
                        className="
                            w-14 h-7 rounded-full
                            bg-gray-300 peer-checked:bg-blue-600
                            transition-all duration-300
                          "></div>

                    {/* Bolita blanca */}
                    <span
                        className="
        absolute top-1 left-1
        w-5 h-5 bg-white rounded-full shadow
        transition-transform duration-300
        translate-x-0 peer-checked:translate-x-7
      "
                    ></span>

                    <span className="ml-3">
      {deviceType ? 'Dispositivo' : 'Televisor'}
    </span>
                </label>
            </div>


            {/* QR o estados */}
            <div className="bg-gray-50 p-6 rounded-lg shadow-inner text-center">
                {loading && (
                    <div className="text-center p-4">
                        <ArrowPathIcon className="mx-auto h-24 w-24 text-blue-600 animate-spin"/>
                        <p className="mt-2 text-blue-600">Iniciando aprovisionamiento...</p>
                    </div>
                )}

                {!loading && qrGenerated && !deviceConnected && qrProvisioningData && isPolling && (
                    <div className="text-center p-4">
                        <p className="text-lg font-medium text-gray-700">Escanea este QR:</p>
                        <div className="mt-4 flex justify-center">
                            {/* Asegúrate de que QRCode esté disponible en este scope */}
                            <QRCode value={JSON.stringify(qrProvisioningData)} size={200}/>
                        </div>

                        {/* --- SECCIÓN MODIFICADA (Botón de Copiado como botón azul) --- */}
                        <div className="mt-4 flex items-center justify-center space-x-2">
                            <p className="text-sm text-gray-500">
                                ID Enrolamiento: <strong className="text-blue-600">{currentEnrolmentId}</strong>
                            </p>
                            {!deviceType && (
                                <button
                                    onClick={copyToClipboard}
                                    className={`
                                    inline-flex items-center justify-center 
                                    p-1.5 rounded-md shadow-sm text-white 
                                    transition-all duration-300 ease-in-out
                                    ${isCopied
                                        ? 'bg-green-500 hover:bg-green-600' // Estilo para el estado 'copiado' (verde)
                                        : 'bg-blue-600 hover:bg-blue-700'  // Estilo para el estado 'normal' (azul)
                                    }
                                `}
                                    title={isCopied ? "¡Copiado!" : "Copiar ID de Enrolamiento"}
                                >
                                    {isCopied ? (
                                        // Icono de verificación cuando está copiado
                                        <CheckIcon className="h-4 w-4"/>
                                    ) : (
                                        // Icono de portapapeles en estado normal
                                        <ClipboardIcon className="h-4 w-4"/>
                                    )}
                                </button>
                            )}
                        </div>
                        {/* --------------------------- */}

                        <p className="mt-2 text-blue-500">
                            <WifiIcon className="inline-block h-5 w-5 mr-1 animate-pulse"/>
                            Esperando conexión...
                        </p>
                        <div className="flex flex-col items-center mt-4 space-y-4">
                            <button
                                onClick={handleForceNewEnrolment}
                                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700"
                            >
                                <ArrowPathIcon className="-ml-0.5 mr-2 h-5 w-5"/>
                                Generar nuevo enrolamiento
                            </button>

                            <div className="flex justify-center space-x-4">

                                {/* Primer Botón Dropdown */}
                                <PlatformDropdown text={"Descargar ADB"} onPlatformSelect={handleABD} />

                                {/* Segundo Botón Dropdown */}
                                <PlatformDropdown text={"Descargar .BAT"} onPlatformSelect={handleBat} />

                            </div>

                        </div>
                    </div>
                )}

                {!loading && qrGenerated && !deviceConnected && !isPolling && !simulateDummyDevice && (
                    <div className="text-center p-4 text-red-600">
                        <QrCodeIcon className="mx-auto h-24 w-24 text-red-400"/>
                        <p className="mt-4 text-lg font-medium">Dispositivo no detectado.</p>
                        <p className="text-sm">El tiempo de espera ha expirado. Intenta nuevamente.</p>
                        <button
                            onClick={() => startProvisioningProcess(true)}
                            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                        >
                            <ArrowPathIcon className="-ml-0.5 mr-2 h-5 w-5"/>
                            Reintentar
                        </button>
                    </div>
                )}

                {deviceConnected && deviceDetails && (
                    <div className="mt-8 bg-green-50 border-l-4 border-green-400 p-4 shadow-md text-left">
                        <div className="flex items-center">
                            <CheckCircleIcon className="h-6 w-6 text-green-500"/>
                            <h3 className="ml-3 text-lg font-medium text-green-800">Dispositivo Conectado</h3>
                        </div>
                        <div className="mt-4 text-sm text-green-700 space-y-1">
                            <p>
                                <strong>{deviceDetails.device_id ? "ID de Dispositivo:" : "ID de Televisor:"}</strong> {deviceDetails.device_id || deviceDetails.television_id}
                            </p>
                            <p><strong>ID de Enrolamiento:</strong> {currentEnrolmentId}</p>
                            {deviceDetails.device_id &&
                                <p><strong>Nombre Comercial:</strong> {deviceDetails.product_name}</p>}
                            <p><strong>Marca:</strong> {deviceDetails.brand}</p>
                            {deviceDetails.board && <p><strong>Board:</strong> {deviceDetails.board}</p>}
                            <p><strong>Modelo Técnico:</strong> {deviceDetails.model}</p>
                            <p><strong>Número de Serie:</strong> {deviceDetails.serial_number}</p>
                            {deviceDetails.device_id && <p><strong>IMEI (Principal):</strong> {deviceDetails.imei}</p>}
                            {deviceDetails.imei_two &&
                                <p><strong>IMEI (Secundario):</strong> {deviceDetails.imei_two}</p>}
                            <p><strong>Estado:</strong> {deviceDetails.state}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Botones */}
            <div className="flex justify-between">
                <button onClick={onBack} className="px-4 py-2 bg-gray-200 rounded">
                    Anterior
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={!deviceDetails || loading || (isPolling && !simulateDummyDevice)}
                    className={`px-4 py-2 rounded text-white ${
                        !deviceDetails || loading || (isPolling && !simulateDummyDevice)
                            ? 'bg-blue-300 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                >
                    Siguiente
                </button>
            </div>
        </div>
    );
};

export default Step2DeviceProvisioning;