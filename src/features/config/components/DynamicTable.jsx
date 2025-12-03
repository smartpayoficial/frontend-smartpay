import React, { use, useEffect } from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

function DynamicTable({ data, columns, onEdit, onDelete }) {
  useEffect(() => {
    console.log('DynamicTable updated data:', data);
  }, []);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {col.label}
              </th>
            ))}
            <th className="relative px-6 py-3">
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item, idx) => (
            <tr key={item.contact_id || idx}>
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                >
                  {col.render
                    ? col.render(item)
                    : item.contact_details?.[col.key] ?? '-'}
                </td>
              ))}
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onClick={() => onEdit(item)} className="text-indigo-600 hover:text-indigo-900">
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button onClick={() => onDelete(item)} className="ml-4 text-red-600 hover:text-red-900">
                  <TrashIcon className="h-5 w-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DynamicTable;
