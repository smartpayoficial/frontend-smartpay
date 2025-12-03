// src/pages/payments/components/Step2DeviceProvisioning.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { QrCodeIcon, WifiIcon, CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'react-qr-code';
import Swal from 'sweetalert2';

import { createEnrolment, getDeviceByEnrolmentId, getProvisioningJson } from '../../../api/enrolments';

const Step2DeviceProvisioning = ({ onNext, onBack, initialData = {}, onDataChange }) => {
  const [qrGenerated, setQrGenerated] = useState(false);
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [deviceDetails, setDeviceDetails] = useState(initialData.device || null);
  const [loading, setLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [qrProvisioningData, setQrProvisioningData] = useState(null);
  const [currentEnrolmentId, setCurrentEnrolmentId] = useState(null);
  const hasStartedProvisioning = useRef(false);

  const [simulateDummyDevice, setSimulateDummyDevice] = useState(false);

  const checkDeviceConnection = useCallback(async (enrollmentId) => {
    let connected = false;
    let attempts = 0;
    const maxAttempts = 300;
    const delay = 3000;

    while (!connected && attempts < maxAttempts) {
      attempts++;
      try {
        console.log('x2 EnrollmentId:', enrollmentId);
        const response = await getDeviceByEnrolmentId(enrollmentId);
        console.log("Response step2", response);
        if (response) {
          setDeviceDetails(response);
          setDeviceConnected(true);
          toast.success('Dispositivo conectado y datos obtenidos.');
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
  }, []);

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
        vendor_id: initialData.authenticatedUser?.user_id
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

      onDataChange({ enrolment_id: enrollmentId, qrProvisioningData: provisioningJson });

      setQrGenerated(true);
      setLoading(false);
      setIsPolling(true);
      toast.success('QR generado. Escanea el código con el dispositivo.');
      toast.info('Esperando que el dispositivo establezca conexión...');

      setTimeout(() => checkDeviceConnection(enrollmentId), 1000);

    } catch (error) {
      console.error('Error durante el aprovisionamiento:', error);
      setLoading(false);
      setIsPolling(false);
      const msg = error.response?.data?.detail || error.message || "Hubo un error inesperado.";
      toast.error(`Error al iniciar aprovisionamiento: ${msg}`);
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
      onNext({ device: deviceDetails });
    } else {
      toast.error(simulateDummyDevice ? 'Esperando que la simulación finalice.' : 'Conecta el dispositivo para continuar.');
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
            onDataChange({ enrolment_id: null, qrProvisioningData: null, device: null });
            hasStartedProvisioning.current = false;
            startProvisioningProcess(true);
        }
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Paso 2: Aprovisionamiento de Dispositivo</h2>

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
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
      )}

      <div className="bg-gray-50 p-6 rounded-lg shadow-inner text-center">
        {loading && (
          <div className="text-center p-4">
            <ArrowPathIcon className="mx-auto h-24 w-24 text-blue-600 animate-spin" />
            <p className="mt-4 text-lg font-medium text-blue-700">
              {simulateDummyDevice ? 'Simulando aprovisionamiento...' : 'Iniciando aprovisionamiento...'}
            </p>
            <p className="text-sm text-gray-500">Esto puede tomar unos segundos.</p>
          </div>
        )}

        {!loading && qrGenerated && !deviceConnected && qrProvisioningData && isPolling && !simulateDummyDevice && (
          <div className="text-center p-4">
            <p className="text-lg font-medium text-gray-700">Escanea el siguiente QR:</p>
            <div className="mt-4 flex justify-center">
              <QRCode value={JSON.stringify(qrProvisioningData)} size={256} />
            </div>
            <p className="text-sm text-gray-500 mt-4">
              ID de Enrolamiento: <strong className="text-blue-600">{currentEnrolmentId}</strong>
            </p>
            <p className="mt-2 text-blue-500">
              <WifiIcon className="inline-block h-5 w-5 mr-1 animate-pulse" />
              Esperando conexión...
            </p>
            <button
              onClick={handleForceNewEnrolment}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700"
            >
              <ArrowPathIcon className="-ml-0.5 mr-2 h-5 w-5" />
              Generar nuevo enrolamiento
            </button>
          </div>
        )}

        {!loading && qrGenerated && !deviceConnected && !isPolling && !simulateDummyDevice && (
          <div className="text-center p-4 text-red-600">
            <QrCodeIcon className="mx-auto h-24 w-24 text-red-400" />
            <p className="mt-4 text-lg font-medium">Dispositivo no detectado.</p>
            <p className="text-sm">El tiempo de espera ha expirado. Intenta nuevamente.</p>
            <button
              onClick={() => startProvisioningProcess(true)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <ArrowPathIcon className="-ml-0.5 mr-2 h-5 w-5" />
              Reintentar
            </button>
          </div>
        )}

        {deviceConnected && deviceDetails && (
          <div className="mt-8 bg-green-50 border-l-4 border-green-400 p-4 shadow-md text-left">
            <div className="flex items-center">
              <CheckCircleIcon className="h-6 w-6 text-green-500" />
              <h3 className="ml-3 text-lg font-medium text-green-800">Dispositivo Conectado</h3>
            </div>
            <div className="mt-4 text-sm text-green-700 space-y-1">
              <p><strong>ID de Dispositivo:</strong> {deviceDetails.device_id}</p>
              <p><strong>ID de Enrolamiento:</strong> {deviceDetails.enrolment_id}</p>
              <p><strong>Nombre Comercial:</strong> {deviceDetails.product_name}</p>
              <p><strong>Marca:</strong> {deviceDetails.brand}</p>
              <p><strong>Modelo Técnico:</strong> {deviceDetails.model}</p>
              <p><strong>Número de Serie:</strong> {deviceDetails.serial_number}</p>
              <p><strong>IMEI (Principal):</strong> {deviceDetails.imei}</p>
              {deviceDetails.imei_two && <p><strong>IMEI (Secundario):</strong> {deviceDetails.imei_two}</p>}
              <p><strong>Estado:</strong> {deviceDetails.state}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between gap-3 mt-6">
        <button onClick={onBack} className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
          <ChevronLeftIcon className="-ml-0.5 mr-2 h-5 w-5" />
          Anterior
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!deviceDetails || loading || (isPolling && !simulateDummyDevice)}
          className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${(!deviceDetails || loading || (isPolling && !simulateDummyDevice)) ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          Siguiente Paso
          <ChevronRightIcon className="-mr-0.5 ml-2 h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default Step2DeviceProvisioning;