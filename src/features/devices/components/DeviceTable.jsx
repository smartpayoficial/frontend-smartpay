import React, { useState, useMemo } from 'react';
import { PAGE_SIZE } from '../../../common/utils/const';
import { TrashIcon, BadgeCheck, Lock, LockOpenIcon } from 'lucide-react';
import AndroidIcon from '../../../assets/icons/android-icon.png';
import TvIcon from '../../../assets/icons/television-icon.png';
 
const DeviceTable = ({ devices = [], onViewDetails, columnFilters, onColumnFilterChange, role, onDelete }) => {
  const [currentPage, setCurrentPage] = useState(1);

  const paginatedDevices = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return devices.slice(start, start + PAGE_SIZE);
  }, [devices, currentPage]);

  const totalPages = Math.ceil(devices.length / PAGE_SIZE);

  const getName = (plan) => (plan?.device_id ? plan.device.product_name : 'N/A');
  const getSerial = (plan) => (plan?.device_id ? plan.device.serial_number : plan.television.serial_number);
  const getModel = (plan) => (plan?.device_id ? plan.device.model : plan.television.model);
  const getBrand = (plan) => (plan?.device_id ? plan.device.brand : plan.television.brand);
  const getImei = (plan) => (plan?.device_id ? plan.device.imei : 'N/A');
  const getTypeLabel = (plan) => (plan?.device_id ? 'Android' : 'Televisión');

  const renderTh = (columnKey, columnName) => (
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      <div className="flex flex-col">
        <span>{columnName}</span>
        <input
          type="text"
          placeholder={`${columnName}...`}
          value={columnFilters[columnKey] || ''}
          onChange={(e) => onColumnFilterChange(columnKey, e.target.value)}
          className="mt-1 p-1 w-full border border-gray-300 rounded-md text-gray-700 text-sm focus:ring-blue-500 focus:border-blue-500"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </th>
  );

  return (
    <div className="overflow-x-auto shadow-lg sm:rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {renderTh('type', 'Tipo')}
            {renderTh('user.first_name', 'Cliente')}
            {renderTh('state', 'Estado')}
            {renderTh('name', 'Nombre')}
            {renderTh('serial_number', 'Serial')}
            {renderTh('model', 'Modelo')}
            {renderTh('brand', 'Marca')}
            {renderTh('imei', 'IMEI 1')}
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-200">
          {paginatedDevices.length === 0 ? (
            <tr>
              <td colSpan="9" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                No hay dispositivos para mostrar.
              </td>
            </tr>
          ) : (
            paginatedDevices.map((device) => {
              const fullName = [
                device?.user?.first_name,
                device?.user?.middle_name,
                device?.user?.last_name,
                device?.user?.second_last_name,
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <tr key={device.device_id || device.television_id}>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {device?.device_id ? (
                        <>
                          <img src={AndroidIcon} alt="Android" className="h-5 w-5" />
                          <span className="text-sm text-gray-700">{getTypeLabel(device)}</span>
                        </>
                      ) : (
                        <>
                          <img src={TvIcon} alt="Televisión" className="h-5 w-5" />
                          <span className="text-sm text-gray-700">{getTypeLabel(device)}</span>
                        </>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {fullName || ''}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="p-2 w-9 inline-flex text-xs leading-5 font-semibold rounded-full">
                      {(() => {
                          console.log("Device", device);
                        const action = device?.status_actions?.action?.toLowerCase();
                        console.log("Action", action);
                        if (action === 'block') return <Lock className="text-red-600" />;
                        if (action === 'unenroll') return <BadgeCheck className="text-blue-600" />;
                        return <LockOpenIcon className="text-green-600" />;
                      })()}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {getName(device) || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getSerial(device) || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getModel(device) || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getBrand(device) || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getImei(device) || 'N/A'}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => {
                          const isDevice = device?.device_id ? true : false;
                          const id = isDevice ? device.device_id : device.television_id;
                          onViewDetails(isDevice, id);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Ver Detalles
                      </button>

                      {role === 'Superadmin' && (
                        <button
                          onClick={() => {
                            const isDevice = device?.device_id ? true : false;
                            const id = isDevice ? device.device_id : device.television_id;
                            onDelete(id, isDevice);
                          }}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar Vendedor"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="flex justify-end items-center mt-4 space-x-4 m-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-700">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
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

export default DeviceTable;
