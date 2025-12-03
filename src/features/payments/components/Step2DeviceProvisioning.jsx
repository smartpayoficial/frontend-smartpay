// src/pages/payments/components/Step2DeviceProvisioning.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { QrCodeIcon, WifiIcon, CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-toastify';
import QRCode from 'react-qr-code';

import {
  createEnrolment,
  getDeviceByEnrolmentId,
  getTelevisorByEnrolmentId,
  getProvisioningJson,
} from '../../../api/enrolments';

const Step2DeviceProvisioning = ({ onNext, onBack, initialData = {} }) => {
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

  // 🔑 Ref para leer el tipo actual en el polling
  const deviceTypeRef = useRef(deviceType);
  useEffect(() => {
    deviceTypeRef.current = deviceType;
  }, [deviceType]);

  const startProvisioningProcess = useCallback(async () => {
    if (initialData.device) {
      setDeviceDetails(initialData.device);
      setDeviceConnected(true);
      setQrGenerated(true);
      setCurrentEnrolmentId(initialData.device.enrolment_id);
      setLoading(false);
      setIsPolling(false);
      return;
    }

    setLoading(true);
    setQrGenerated(false);
    setDeviceConnected(false);
    setDeviceDetails(null);
    setQrProvisioningData(null);
    setCurrentEnrolmentId(null);
    setIsPolling(false);

    try {
      toast.info('Generando QR y preparando enrolamiento...');

      const enrolmentPayload = {
        user_id: initialData.customer?.user_id,
        vendor_id: initialData.authenticatedUser?.user_id,
      };

      const enrolmentCreationResponse = await createEnrolment(enrolmentPayload);
      const enrollmentId = enrolmentCreationResponse?.enrolment_id;
      setCurrentEnrolmentId(enrollmentId);

      const storedUser = localStorage.getItem('user');
      let storeId = null;
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          storeId = user.store?.id;
        } catch (err) {
          console.error('Error al parsear usuario del localStorage', err);
        }
      }

      const provisioningJson = await getProvisioningJson(enrollmentId, storeId, false);
      setQrProvisioningData(provisioningJson);

      setQrGenerated(true);
      setLoading(false);
      setIsPolling(true);
      toast.success('QR generado. Escanea el código con el dispositivo.');
      toast.info('Esperando que el dispositivo establezca conexión...');

      const checkDeviceConnection = async (enrollmentId) => {
        let connected = false;
        let attempts = 0;
        const maxAttempts = 300 ;
        const delay = 3000;

        while (!connected && attempts < maxAttempts) {
          attempts++;
          try {
            // 👇 leer siempre el valor más reciente
            const currentDeviceType = deviceTypeRef.current;
            console.log('DeviceType actual:', currentDeviceType);

            if (currentDeviceType) {
              // Caso dispositivo móvil
              const response = await getDeviceByEnrolmentId(enrollmentId);
              if (response) {
                setDeviceDetails(response);
                setDeviceConnected(true);
                toast.success('Dispositivo conectado.');
                connected = true;
                break;
              }
            } else {
              // Caso televisor
              const response = await getTelevisorByEnrolmentId(enrollmentId);
              if (response) {
                setDeviceDetails(response);
                setDeviceConnected(true);
                toast.success('Televisor conectado.');
                connected = true;
                break;
              }
            }
          } catch (error) {
            if (error.response?.status !== 404) {
              console.error('Error en polling:', error);
              toast.warn(`Error servidor: ${error.response?.status}`);
            }
          }
          if (!connected) {
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }

        if (!connected) {
          toast.error('Tiempo de espera agotado. No se conectó ningún dispositivo.');
        }
        setIsPolling(false);
      };

      setTimeout(() => checkDeviceConnection(enrollmentId), 1000);
    } catch (error) {
      console.error('Error en aprovisionamiento:', error);
      setLoading(false);
      setIsPolling(false);
      toast.error(`Error: ${error.message}`);
    }
  }, [initialData, simulateDummyDevice]);

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
      toast.error(
        simulateDummyDevice
          ? 'Esperando que la simulación finalice.'
          : 'Conecta el dispositivo para continuar.'
      );
    }
  };

  const handleRetryProvisioning = () => {
    hasStartedProvisioning.current = false;
    setDeviceDetails(null);
    setDeviceConnected(false);
    setQrGenerated(false);
    setQrProvisioningData(null);
    setCurrentEnrolmentId(null);
    setLoading(true);
    setIsPolling(false);
    startProvisioningProcess();
  };

  console.log('Datos provis', deviceDetails);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">Paso 2: Aprovisionamiento</h2>

      {/* Toggle tipo de dispositivo */}
      <div className="flex items-center gap-3">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only"
            checked={!deviceType}
            onChange={(e) => setDeviceType(!e.target.checked)}
          />
          <div className="w-14 h-7 bg-gray-200 rounded-full peer-checked:bg-blue-600 transition-all"></div>
          <span className="ml-3">{deviceType ? 'Dispositivo' : 'Televisor'}</span>
        </label>
      </div>

      {/* QR o estados */}
      <div className="bg-gray-50 p-6 rounded-lg shadow-inner text-center">
        {loading && (
          <div className="text-center p-4">
            <ArrowPathIcon className="mx-auto h-24 w-24 text-blue-600 animate-spin" />
            <p className="mt-2 text-blue-600">Iniciando aprovisionamiento...</p>
          </div>
        )}

        {!loading && qrGenerated && !deviceConnected && qrProvisioningData && isPolling && (
          <div className="text-center p-4">
            <p className="text-lg font-medium text-gray-700">Escanea este QR:</p>
            <div className="mt-4 flex justify-center">
              <QRCode value={JSON.stringify(qrProvisioningData)} size={200} />
            </div>
            <p className="text-sm text-gray-500 mt-4">
              ID Enrolamiento: <strong className="text-blue-600">{currentEnrolmentId}</strong>
            </p>
            <p className="mt-2 text-blue-500">
              <WifiIcon className="inline-block h-5 w-5 mr-1 animate-pulse" />
              Esperando conexión...
            </p>
          </div>
        )}

         {!loading && qrGenerated && !deviceConnected && !isPolling && !simulateDummyDevice && (
          <div className="text-center p-4 text-red-600">
            <QrCodeIcon className="mx-auto h-24 w-24 text-red-400" />
            <p className="mt-4 text-lg font-medium">Dispositivo no detectado.</p>
            <p className="text-sm">El tiempo de espera ha expirado. Intenta nuevamente.</p>
            <button
              onClick={handleRetryProvisioning}
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
              <p><strong>{deviceDetails.device_id ? "ID de Dispositivo:" : "ID de Televisor:"}</strong> {deviceDetails.device_id || deviceDetails.television_id}</p>
              <p><strong>ID de Enrolamiento:</strong> {currentEnrolmentId}</p>
              {deviceDetails.device_id && <p><strong>Nombre Comercial:</strong> {deviceDetails.product_name}</p> }
              <p><strong>Marca:</strong> {deviceDetails.brand}</p>
              {deviceDetails.board && <p><strong>Board:</strong> {deviceDetails.board}</p> }
              <p><strong>Modelo Técnico:</strong> {deviceDetails.model}</p>
              <p><strong>Número de Serie:</strong> {deviceDetails.serial_number}</p>
              {deviceDetails.device_id && <p><strong>IMEI (Principal):</strong> {deviceDetails.imei}</p> }
              {deviceDetails.imei_two && <p><strong>IMEI (Secundario):</strong> {deviceDetails.imei_two}</p>}
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