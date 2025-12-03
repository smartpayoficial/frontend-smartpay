import React, { useState, useEffect, useCallback } from 'react';
import { PlusIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

import DynamicTable from '../DynamicTable';

function EntityManager({
    title,
    fetcher,
    creator,
    updater,
    deleter,
    columns,
    ModalComponent,
    extraProps = {},
    disableAddBtn = false
}) {

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editing, setEditing] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('fetcher:', fetcher)
            const res = await fetcher();
            console.log('res:', res)
            setData(res);
        } catch (err) {
            console.error(`Error al cargar ${title}:`, err);
            setError(`No se pudieron cargar los registros de ${title}.`);
            toast.error(`Error al cargar ${title}.`);
        } finally {
            setLoading(false);
        }
        // console.log('extraProps:', extraProps)

    }, [fetcher, title]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenModal = (item = null) => {
        setEditing(item);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditing(null);
    };

    const handleSubmit = async (item) => {
        try {
            if (editing) {
                await updater(editing.id || editing.contact_id, item);
                toast.success(`${title} actualizado correctamente.`);
            } else {
                await creator(item);
                toast.success(`${title} creado correctamente.`);
            }
            fetchData();
        } catch (err) {
            console.error(`Error al guardar ${title}:`, err);
            toast.error(`Error al guardar ${title}.`);
        } finally {
            handleCloseModal();
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: `¿Eliminar ${title}?`,
            text: "Esta acción no se puede deshacer.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await deleter(id);
                toast.success(`${title} eliminado correctamente.`);
                fetchData();
            } catch (err) {
                console.error(`Error al eliminar ${title}:`, err);
                toast.error(`Error al eliminar ${title}.`);
            }
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                    {title}
                </h1>
                <button
                    disabled={disableAddBtn}
                    title={disableAddBtn ? 'Solo se puede añadir un registro' : ''}

                    onClick={() => handleOpenModal()}
                    className="
    inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm
    text-white bg-blue-600 hover:bg-blue-700
    disabled:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50
  "
                >
                    <PlusIcon className="-ml-0.5 mr-2 h-5 w-5" />
                    Añadir Nuevo
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-10">
                    <svg className="animate-spin h-10 w-10 text-blue-600" viewBox="0 0 24 24">
                        <circle
                            className="opacity-25"
                            cx="12" cy="12" r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        />
                    </svg>
                    <span className="ml-3 text-blue-600 font-medium">Cargando datos...</span>
                </div>
            ) : error ? (
                <p>{error}</p>
            ) : data.length === 0 ? (
                <div className="p-6 text-center text-gray-500 bg-white shadow sm:rounded-lg">
                    <InformationCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No hay registros para mostrar</h3>
                </div>
            ) : (
                <DynamicTable
                    data={data}
                    columns={columns}
                    onEdit={handleOpenModal}
                    onDelete={(item) => handleDelete(item.id || item.contact_id)}
                />
            )}

            <ModalComponent
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                initialData={editing}
                {...extraProps}
            />
        </div>
    );
}

export default EntityManager;
