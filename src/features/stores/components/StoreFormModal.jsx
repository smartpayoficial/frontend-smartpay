import React, { useState, useEffect, Fragment, useRef, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Swal from 'sweetalert2';
import { debounce } from 'lodash';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { buildField, validateFields } from '../../../common/utils/validations/validation.schema';

const StoreFormModal = ({ isOpen, onClose, initialData, onSubmit, roles, getCountriesApi, getAdminsApis }) => {
    const [formData, setFormData] = useState({
        nombre: '',
        plan: '',
        country_id: '',
        tokens_disponibles: '',
        back_link: '',
        db_link: '',
        country_input_name: '',
        admin_id: '',
        admin_input_name: '',
        add_tokens: 0,

    });
    const [hasSearchedAdmins, setHasSearchedAdmins] = useState(false);
    const [hasSearchedCountries, setHasSearchedCountries] = useState(false);
    const [isNewRegister, setIsNewRegister] = useState(false);
    const [countrySuggestion, setCountrySuggestion] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const cityInputRef = useRef(null);
    const [formErrors, setFormErrors] = useState({});

    //ADMINS
    const [adminSuggestions, setAdminSuggestions] = useState([]);
    const [showSuggestionsAdmin, setShowSuggestionsAdmin] = useState(false);


    useEffect(() => {
        setFormErrors({});
        if (isOpen) {
            if (initialData) {
                // Modo edición
                setIsNewRegister(false);
                setFormData({
                    nombre: initialData.nombre || '',
                    plan: initialData.plan || '',
                    country_id: initialData.country_id || '',
                    tokens_disponibles: initialData.tokens_disponibles || 0,
                    back_link: initialData.back_link || '',
                    db_link: initialData.db_link || '',
                    country_input_name: initialData.country.name || '',
                    admin_id: initialData.admin_id || '',
                    admin_input_name: initialData.admin?.first_name + initialData.admin?.last_name || '',
                });
            } else {
                // Modo creación de nuevo vendedor
                setIsNewRegister(true);
                setFormData({
                    nombre: '',
                    plan: '',
                    country_id: '',
                    tokens_disponibles: 0,
                    back_link: '',
                    db_link: '',
                    country_input_name: '',
                    admin_id: '',
                    admin_input_name: '',
                });
            }

            setAdminSuggestions([]);
            setShowSuggestionsAdmin(false);

            setCountrySuggestion([]);
            setShowSuggestions(false);
        }
    }, [initialData, isOpen]);
    //Debounced para ADMIN STORES
    // Debounced function to fetch PAIS
    const debouncedFetchAdmins = useCallback(
        debounce(async (searchTerm) => {
            if (searchTerm.length >= 0) {
                setHasSearchedAdmins(false); // empieza nueva búsqueda
                try {
                    const fetchedAdmins = await getAdminsApis({ role_name: 'Store Admin', name: searchTerm });

                    const unassignedAdmins = fetchedAdmins.filter(admin => admin.store === null);
                    const uniqueAdmins = Array.from(new Map(unassignedAdmins.map(admin => [admin.dni, admin])).values());

                    setAdminSuggestions(uniqueAdmins);
                    setShowSuggestionsAdmin(true);
                } catch (error) {
                    console.error("Error fetching admins:", error);
                    setAdminSuggestions([]);
                    setShowSuggestionsAdmin(false);
                } finally {
                    setHasSearchedAdmins(true); // búsqueda completada
                }
            } else {
                setAdminSuggestions([]);
                setShowSuggestionsAdmin(false);
                setHasSearchedAdmins(false);
            }
        }, 300),
        [getAdminsApis]
    );

    //Funcion para debounced PAIS
    const debouncedFetchCountries = useCallback(
        debounce(async (searchTerm) => {
            if (searchTerm.length >= 0) {
                setHasSearchedCountries(false); // empieza la búsqueda

                try {
                    const fetchedCities = await getCountriesApi({ name: searchTerm });

                    const uniqueCities = Array.from(
                        new Map(fetchedCities.map(city => [city.name, city])).values()
                    );

                    setCountrySuggestion(uniqueCities);
                    setShowSuggestions(true);
                } catch (error) {
                    console.error("Error fetching countries:", error);
                    setCountrySuggestion([]);
                    setShowSuggestions(false);
                } finally {
                    setHasSearchedCountries(true); // termina la búsqueda
                }
            } else {
                setCountrySuggestion([]);
                setShowSuggestions(false);
                setHasSearchedCountries(false);
            }
        }, 300),
        [getCountriesApi]
    );

    /**
   * Selector para sleccionar ADMIN
   * @param {*} city 
   */
    const handleAdminSelect = async (item) => {
        console.log('ITEM: ', item);
        setFormData((prev) => ({
            ...prev,
            admin_id: item.user_id,
            admin_input_name: item.first_name + ' ' + item.last_name,
        }));

        setAdminSuggestions([]);
        setShowSuggestionsAdmin(false);
    };


    /**
     * Handle City
     * @param {*} e 
     */
    const handleAdminInputChange = (e) => {
        const { value } = e.target;

        setFormData((prev) => ({
            ...prev,
            admin_input_name: value,
            admin_id: '',
        }));
        debouncedFetchAdmins(value);
    };


    const handleCityInputChange = (e) => {
        const { value } = e.target;
        setFormData((prev) => ({
            ...prev,
            country_input_name: value,
            country_id: '',
        }));
        debouncedFetchCountries(value);
    };

    const handleCountrySelect = (item) => {
        setFormData((prev) => ({
            ...prev,
            country_id: item.country_id,
            country_input_name: item.name,
        }));
        setCountrySuggestion([]);
        setShowSuggestions(false);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (cityInputRef.current && !cityInputRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        // Limpia el error del campo actual
        if (formErrors[name]) {
            setFormErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationRules = {
            nombre: buildField(['required']),
            tokens_disponibles: buildField(['required', 'number']),
            country_id: buildField(['required'])
        };
        const { valid, errors } = await validateFields(formData, validationRules);

        if (!valid) {
            setFormErrors(errors);
            return;
        }

        const dataToSubmit = { ...formData };

        delete dataToSubmit.country_input_name;

        onSubmit(dataToSubmit);
    };

    const handleAddTokens = () => {
        // Asegúrate de que el valor sea un número y sea mayor que 0
        const tokensToAdd = parseInt(formData.add_tokens, 10);
        if (!isNaN(tokensToAdd) && tokensToAdd > 0) {
            setFormData(prevFormData => ({
                ...prevFormData,
                tokens_disponibles: prevFormData.tokens_disponibles + tokensToAdd,
                add_tokens: 0, // Resetea el campo
            }));
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-25" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-4xl transform overflow-visible rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title
                                    as="h3"
                                    className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center"
                                >
                                    {isNewRegister ? 'Añadir Nueva Tienda' : 'Editar Tienda'}
                                    <button
                                        type="button"
                                        className="inline-flex justify-center rounded-md border border-transparent bg-white text-sm font-medium text-gray-400 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                                        onClick={onClose}
                                    >
                                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </Dialog.Title>
                                <div className="mt-4">
                                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div>
                                            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre *</label>
                                            <input type="text" name="nombre" id="nombre" value={formData.nombre} onChange={handleChange} autoComplete='off' className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blueo-500 focus:ring-blueo-500 sm:text-sm" />
                                            {formErrors.nombre && (
                                                <p className="text-red-500 text-xs mt-1">{formErrors.nombre}</p>
                                            )}
                                        </div>
                                        <div className="relative" ref={cityInputRef}>
                                            <label htmlFor="admin_input_name" className="block text-sm font-medium text-gray-700">Administradores *</label>
                                            <input
                                                disabled={!isNewRegister}
                                                type="text"
                                                name="admin_input_name"
                                                id="admin_input_name"
                                                value={formData.admin_input_name}
                                                onChange={handleAdminInputChange}
                                                onFocus={() => {
                                                    if (formData.admin_input_name.length >= 2) {
                                                        setShowSuggestionsAdmin(true);
                                                    }
                                                }}
                                                autoComplete='off'
                                                placeholder="Busca y selecciona"
                                                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${!isNewRegister ? 'opacity-50 cursor-not-allowed' : ''
                                                    }`}
                                            />
                                            {showSuggestionsAdmin && (
                                                <ul className="absolute z-30 w-full bg-white border border-gray-300 mt-1 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                                    {adminSuggestions.length === 0 ? (
                                                        <li className="px-4 py-2 text-gray-500 italic">
                                                            {!hasSearchedAdmins ? 'Buscando...' : 'No se encontraron resultados'}
                                                        </li>
                                                    ) : (
                                                        adminSuggestions.map((item) => (
                                                            <li
                                                                key={item.user_id}
                                                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                                                onClick={() => handleAdminSelect(item)}
                                                            >
                                                                {`${item.first_name} ${item.last_name} (${item.dni})`}
                                                            </li>
                                                        ))
                                                    )}
                                                </ul>
                                            )}
                                            {formErrors.admin_id && (
                                                <p className="text-red-500 text-xs mt-1">{formErrors.admin_id}</p>
                                            )}
                                        </div>

                                        <div className="relative" ref={cityInputRef}>
                                            <label htmlFor="country_input_name" className="block text-sm font-medium text-gray-700">País *</label>
                                            <input
                                                type="text"
                                                name="country_input_name"
                                                id="country_input_name"
                                                value={formData.country_input_name}
                                                onChange={handleCityInputChange}
                                                onFocus={() => {
                                                    if (formData.country_input_name.length >= 0 && countrySuggestion.length > 0) {
                                                        setShowSuggestions(true);
                                                    }
                                                }}
                                                autoComplete='off'
                                                placeholder="Busca y selecciona"
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blueo-500 focus:ring-blueo-500 sm:text-sm"
                                            />
                                            {showSuggestions && (
                                                <ul className="absolute z-30 w-full bg-white border border-gray-300 mt-1 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                                    {countrySuggestion.length > 0 ? (
                                                        countrySuggestion.map((item) => (
                                                            <li
                                                                key={item.country_id}
                                                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                                                onClick={() => handleCountrySelect(item)}
                                                            >
                                                                {item.name}
                                                            </li>
                                                        ))
                                                    ) : (
                                                        <li className="px-4 py-2 text-gray-500 italic">
                                                            {!hasSearchedCountries ? 'Buscando...' : 'No se encontraron resultados'}
                                                        </li>
                                                    )}
                                                </ul>
                                            )}
                                            {formErrors.country_id && (
                                                <p className="text-red-500 text-xs mt-1">{formErrors.country_id}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label htmlFor="tokens_disponibles" className="block text-sm font-medium text-gray-700">Límite Dispositivos Actual *</label>
                                            <input
                                                type="number"
                                                name="tokens_disponibles"
                                                id="tokens_disponibles"
                                                value={formData.tokens_disponibles}
                                                disabled
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blueo-500 focus:ring-blueo-500 sm:text-sm bg-gray-100 cursor-not-allowed"
                                            />
                                            {formErrors.tokens_disponibles && (
                                                <p className="text-red-500 text-xs mt-1">{formErrors.tokens_disponibles}</p>
                                            )}
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <div className="flex-grow">
                                                <label htmlFor="add_tokens" className="block text-sm font-medium text-green-700">Cant. Licencias</label>
                                                <input
                                                    type="number"
                                                    name="add_tokens"
                                                    id="add_tokens"
                                                    value={formData.add_tokens}
                                                    onChange={handleChange}
                                                    autoComplete='off'
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blueo-500 focus:ring-blueo-500 sm:text-sm"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleAddTokens} // Crearemos esta función
                                                className="inline-flex justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
                                            >
                                                Agregar
                                            </button>
                                        </div>
                                        {/* El resto de los campos de formulario comentados */}

                                        <div className="mt-6 col-span-full flex justify-end gap-3">
                                            <button
                                                type="button"
                                                className="inline-flex justify-center rounded-md border border-transparent bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                                                onClick={onClose}
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                                            >
                                                {isNewRegister ? 'Crear Tienda' : 'Guardar Cambios'}
                                            </button>
                                        </div>
                                    </form >
                                </div >
                            </Dialog.Panel >
                        </Transition.Child >
                    </div >
                </div >
            </Dialog >
        </Transition >
    );
};

export default StoreFormModal;