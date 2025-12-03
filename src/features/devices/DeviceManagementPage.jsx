import React, { useState, useEffect, useRef } from 'react';
import {
  getLastLocation,
  getActionsHistory,
  updateDevice,
  blockDevice,
  unblockDevice,
  locateDevice,
  releaseDevice,
  sendNotification
} from '../../api/devices';
import { getPayments, createPayment } from '../../api/payments';
import { getPlanByDeviceId, getPlans } from '../../api/plans';
import DeviceTable from './components/DeviceTable';
import DeviceDetailsView from './views/DeviceDetailsView';
import DeviceDetailsViewTv from './views/DeviceDetailsViewTv';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { getValueByPath } from '../../common/utils/helpers';
import { useSearchParams } from 'react-router-dom';
import Swal from 'sweetalert2';

const DeviceManagementPage = () => {
  const [devices, setDevices] = useState([]);
  const [isDevice, setIsDevice] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectPlan, setSelectedPlan] = useState(null);
  const [payments, setPayments] = useState([]);
  const [lastLocation, setLastLocation] = useState(null);
  const [actionsHistory, setActionsHistory] = useState([]);
  const [isPolling, setIsPolling] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const didMount = useRef(false);

  // 🔑 Llaves NEUTRAS para filtros (incluye 'type')
  const [columnFilters, setColumnFilters] = useState({
    type: '',
    name: '',
    serial_number: '',
    model: '',
    brand: '',
    imei: '',
    state: '',
    // Si quieres filtrar por cliente, podrías añadir:
    // 'user.first_name': ''
  });

  const userRole = 'superadmin';

  useEffect(() => {
    if (didMount.current) return;
    didMount.current = true;

    let deviceId = searchParams.get('deviceId');
    let isDevice = true;
    if (!deviceId) {
      deviceId = searchParams.get('televisionId');
      isDevice = false
    }

    if (deviceId) {
      handleViewDetails(isDevice, deviceId);
    } else {
      fetchDevices();
    }
  }, []);

  function mapPlansWithLatestAction(plans, actions) {
    console.log("Plan", plans);
    console.log("Actions", actions)

    return plans.map((plan) => {
      let relevant = actions.filter(
        (a) =>
          (a.television_id === plan.television_id) &&
          (a.action === 'block' || a.action === 'unblock' || a.action === 'unenroll')
      );
      const latest = relevant.reduce((acc, cur) => {
        return !acc || new Date(cur.created_at) > new Date(acc.created_at) ? cur : acc;
      }, null);

      return { ...plan, status_actions: latest || null };
    });
  }

  const fetchDevices = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPlans();
      const actions = await getActionsHistory();
      const enriched = mapPlansWithLatestAction(data, actions);
      setDevices(enriched);
    } catch (err) {
      setError('Error al cargar dispositivos. Por favor, inténtalo de nuevo.');
      toast.error('Error al cargar dispositivos.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (isDevice, id) => {
    setLoading(true);
    try {
      const planDevice = await getPlanByDeviceId(isDevice, id);
      const lastLocationResp = await getLastLocation(isDevice, id);

      const params = isDevice
            ? { device_id: id, state: 'Approved' }
            : { television_id: id, state: 'Approved' };

      const paymentsResponse = await getPayments(params);
      const actions = await getActionsHistory(isDevice, id);

      if (Array.isArray(actions) && actions.length > 0) {
        const sorted = [...actions].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        setActionsHistory(sorted);
      }

      setIsDevice(isDevice);
      searchParams.set(isDevice ? 'deviceId' : "televisionId", id);
      setSearchParams(searchParams);

      setPayments(paymentsResponse);
      setSelectedPlan(planDevice);
      setLastLocation(lastLocationResp);
    } catch (err) {
      setError('Error al cargar los detalles del dispositivo.');
      toast.error('Error al cargar los detalles del dispositivo.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToList = () => {
    searchParams.delete(isDevice ? 'deviceId' : 'televisionId');
    setSearchParams(searchParams);
    setSelectedPlan(null);
    fetchDevices();
  };

  const handleUpdateDevice = async (deviceId, updatedData) => {
    try {
      await updateDevice(deviceId, updatedData);
      const planDevice = await getPlanByDeviceId(deviceId);
      setSelectedPlan(planDevice);
      toast.success('Dispositivo actualizado correctamente.');
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Error desconocido';
      toast.error(`Error al actualizar dispositivo: ${msg}`);
      throw err;
    }
  };

  const handleBlock = async (deviceId, isTelevision) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esto bloqueará el dispositivo y no podrá ser usado.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e3342f',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, bloquear',
      cancelButtonText: 'Cancelar'
    });
    if (!result.isConfirmed) return;

    try {
      await blockDevice(deviceId, isTelevision);
      toast.success('Dispositivo bloqueado con éxito.');
      if (selectPlan && ((!isTelevision && selectPlan.device_id === deviceId) || (selectPlan.television_id === deviceId))) {
        handleViewDetails(!isTelevision, deviceId);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Error desconocido';
      toast.error(`Error al bloquear dispositivo: ${msg}`);
    }
  };

  const handleSubmitNotification = async (deviceId, notificationData, isTelevision) => {
    try {
      await sendNotification(deviceId, notificationData, isTelevision);
      toast.success('Notificación enviada.');
      if (selectPlan && ((!isTelevision && selectPlan.device_id === deviceId) || (selectPlan.television_id === deviceId))) {
        handleViewDetails(!isTelevision, deviceId);
      }
    } catch (err) {
      const msg =
        err.response?.data?.detail || err.message || 'Hubo un error al enviar la notificación.';
      toast.error(`Error al enviar notificación: ${msg}`);
    }
  };

  const handleSubmitPayment = async (paymentData, isTelevision) => {
    const result = await Swal.fire({
      title: '¿Registrar pago?',
      text: '¿Estás seguro de que quieres registrar el pago?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, registrar',
      cancelButtonText: 'Cancelar'
    });
    if (!result.isConfirmed) return;

    try {
      await createPayment(paymentData);
      toast.success('Pago registrado.');
      if (selectPlan && ((!isTelevision && selectPlan.device_id === paymentData.device_id) || (selectPlan.television_id === paymentData.television_id))) {
        const id = isTelevision ? paymentData.television_id : paymentData.device_id; 

        const params = !isTelevision
          ? { device_id: id, state: 'Approved' }
          : { television_id: id, state: 'Approved' };

        const resp = await getPayments(params);
        setPayments(resp);

        const totalValue = resp.reduce((sum, p) => sum + parseFloat(p.value), 0);
        if (totalValue < selectPlan.value) {
          await unblockDevice(id, { duration: 0 }, isTelevision);
        }
        handleViewDetails(!isTelevision, id);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Error desconocido';
      toast.error(`Error al registrar pago del dispositivo: ${msg}`);
    }
  };

  const handleUnblock = async (deviceId, isTelevision) => {
    try {
      const { value: minutos } = await Swal.fire({
        title: 'Desbloquear dispositivo',
        input: 'number',
        inputLabel: '¿Por cuántos minutos deseas desbloquear el dispositivo?',
        inputPlaceholder: 'Ingresa el tiempo en minutos',
        inputAttributes: { min: 0, step: 1 },
        showCancelButton: true,
        confirmButtonText: 'Desbloquear',
        cancelButtonText: 'Cancelar'
      });

      if (minutos === undefined) return;

      const minutosFinal = minutos === '' || minutos == null ? 0 : Number(minutos);
      const minutes = parseInt(minutosFinal, 10);
      await unblockDevice(deviceId, { duration: minutes * 60 }, isTelevision);
      toast.success('Dispositivo desbloqueado con éxito.');
      if (selectPlan && ((!isTelevision && selectPlan.device_id === deviceId) || (selectPlan.television_id === deviceId))) {
        handleViewDetails(!isTelevision, deviceId);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Error desconocido';
      toast.error(`Error al desbloquear dispositivo: ${msg}`);
    }
  };

  const checkDeviceConnection = async (deviceId, isTelevision) => {
    let connected = false;
    let attempts = 0;
    const maxAttempts = 100;
    const delayMs = 3000;

    setIsPolling(true);
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));

    while (!connected && attempts < maxAttempts) {
      attempts++;
      try {
        await delay(5000);
        const last = await getLastLocation(!isTelevision, deviceId);
        if (last) {
          setLastLocation(last);
          connected = true;
          setIsPolling(false);
          break;
        }
      } catch (error) {
        if (error.response?.status !== 404) {
          // ignorar otros errores
        }
      }
      if (!connected) {
        await delay(delayMs);
      }
    }

    if (!connected) {
      toast.error('Tiempo de espera agotado. El dispositivo no se conectó.');
    }
  };

  const handleLocate = async (deviceId, isTelevision) => {
    try {
      const response = await locateDevice(deviceId, isTelevision);
      toast.success(`Solicitud de ubicación enviada. ${response.message || ''}`);
      if (selectPlan && ((!isTelevision && selectPlan.device_id === deviceId) || (selectPlan.television_id === deviceId))) {
        handleViewDetails(!isTelevision, deviceId);
        setTimeout(() => checkDeviceConnection(deviceId, isTelevision), 1000);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Error desconocido';
      toast.error(`Error al localizar dispositivo: ${msg}`);
    }
  };

  const handleRelease = async (deviceId, isTelevision) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esto liberará el dispositivo y lo dejará sin asignación.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, liberar',
      cancelButtonText: 'Cancelar'
    });
    if (!result.isConfirmed) return;

    try {
      await releaseDevice(deviceId, isTelevision);
      toast.success('Dispositivo liberado con éxito.');
      if (selectPlan && ((!isTelevision && selectPlan.device_id === deviceId) || (selectPlan.television_id === deviceId))) {
        handleViewDetails(!isTelevision, deviceId);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Error desconocido';
      toast.error(`Error al liberar dispositivo: ${msg}`);
    }
  };

  /**
   * =========================
   * 🔎 FILTRADO UNIFICADO
   * =========================
   */

  // Helper: primer valor “no vacío” de una lista de rutas
  const pickByPaths = (obj, paths = []) => {
    for (const p of paths) {
      const v = getValueByPath(obj, p);
      if (v !== undefined && v !== null && String(v).trim() !== '') {
        return v;
      }
    }
    return '';
  };

  // Etiqueta de tipo para cada registro
  const getTypeLabel = (item) => (item?.device_id ? 'Android' : 'Televisión');

  // Rutas por columna (fallbacks)
  const FILTER_PATHS = {
    // type se maneja aparte via getTypeLabel
    name: ['device.product_name', 'television.product_name', 'television.model', 'television.name'],
    serial_number: ['device.serial_number', 'television.serial_number'],
    model: ['device.model', 'television.model'],
    brand: ['device.brand', 'television.brand'],
    imei: ['device.imei'], // TVs no tienen IMEI
    state: ['status_actions.action']
    // 'user.first_name': ['user.first_name', 'user.middle_name', 'user.last_name', 'user.second_last_name'],
  };

  const filteredDevices = devices.filter((item) => {
    for (const key in columnFilters) {
      const raw = (columnFilters[key] || '').trim();
      if (!raw) continue;

      const needle = raw.toLowerCase();

      if (key === 'type') {
        const hay = getTypeLabel(item).toLowerCase();
        if (!hay.includes(needle)) return false;
        continue;
      }

      const val = String(pickByPaths(item, FILTER_PATHS[key] || [key]) || '').toLowerCase();
      if (!val.includes(needle)) return false;
    }
    return true;
  });

  const handleColumnFilterChange = (columnKey, value) => {
    setColumnFilters((prev) => ({ ...prev, [columnKey]: value }));
  };

  return (
    <div className="container bg-white rounded-xl mx-auto p-4 sm:p-6 lg:p-8">
      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <strong className="font-bold">¡Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {selectPlan?.deviceId ? (
        <DeviceDetailsView
          plan={selectPlan}
          location={lastLocation}
          actionsHistory={actionsHistory}
          payments={payments}
          onBackToList={handleBackToList}
          onBlock={handleBlock}
          onNotification={handleSubmitNotification}
          onUnblock={handleUnblock}
          onSubmitPayment={handleSubmitPayment}
          onLocate={handleLocate}
          onRelease={handleRelease}
          onUpdateDevice={handleUpdateDevice}
          userRole={userRole}
          onDeviceUpdate={() => handleViewDetails(true, selectPlan.device_id)}
          isPolling={isPolling}
        />
      ) : selectPlan?.television_id ? (
        <DeviceDetailsViewTv
          plan={selectPlan}
          location={lastLocation}
          actionsHistory={actionsHistory}
          payments={payments}
          onBackToList={handleBackToList}
          onBlock={handleBlock}
          onNotification={handleSubmitNotification}
          onUnblock={handleUnblock}
          onSubmitPayment={handleSubmitPayment}
          onLocate={handleLocate}
          onRelease={handleRelease}
          onUpdateDevice={handleUpdateDevice}
          userRole={userRole}
          onDeviceUpdate={() => handleViewDetails(false, selectPlan.television_id)}
          isPolling={isPolling}
        />
      ) : (
        <>
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Gestión de Dispositivos</h1>
          <div className="bg-white rounded-lg shadow-md overflow-x-auto">
            {loading ? (
              <p className="text-center p-4 text-gray-500">Cargando dispositivos...</p>
            ) : (
              <DeviceTable
                devices={filteredDevices}
                onViewDetails={handleViewDetails}
                columnFilters={columnFilters}
                onColumnFilterChange={handleColumnFilterChange}
              />
            )}
          </div>
        </>
      )}

      {/* Si usas toasts en esta página, recuerda incluir el contenedor */}
      <ToastContainer />
    </div>
  );
};

export default DeviceManagementPage;