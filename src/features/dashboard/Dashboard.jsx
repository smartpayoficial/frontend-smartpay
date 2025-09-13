import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../common/context/AuthProvider';
import { showNewUserAlert } from '../../common/utils/auth';
import { useNavigate } from 'react-router-dom';
import ReportsPage from '../reports/ReportsPage.jsx';
import { getStoreById } from '../../api/stores';
import { getCurrentUser } from '../../common/utils/helpers.js';
import { getPlans } from '../../api/plans';
import { InformationCircleIcon, RocketLaunchIcon, LifebuoyIcon } from '@heroicons/react/24/outline';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [storeName, setStoreName] = useState('');
    const [tokensAvailable, setTokensAvailable] = useState(0);
    const [devicesUsed, setDevicesUsed] = useState(0);
    const [loadingStore, setLoadingStore] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const currentUser = getCurrentUser();
            const store = currentUser?.store;

            if (store && store.id) {
                try {
                    const fetchedStore = await getStoreById(store.id);
                    setStoreName(fetchedStore.nombre);
                    setTokensAvailable(fetchedStore.tokens_disponibles);

                    const allPlans = await getPlans();
                    setDevicesUsed(allPlans.length);

                } catch (error) {
                    console.error("Error fetching data:", error);
                }
            }
            setLoadingStore(false);
            showNewUserAlert(user, navigate);
        };

        fetchData();
    }, [user, navigate]);

    const realTokensAvailable = tokensAvailable - devicesUsed;

    const stats = useMemo(() => ({
        activeDevices: 1245,
        blockedDevices: 87,
        soldDevices: 532,
        pendingPayments: 23,
    }), []);

    const nivoPieData = useMemo(() => {
        const dataForPie = [
            { id: 'Activos', label: 'Activos', value: stats.activeDevices, color: '#40ace8' },
            { id: 'Bloqueados', label: 'Bloqueados', value: stats.blockedDevices, color: '#EF4444' },
            { id: 'Vendidos', label: 'Vendidos', value: stats.soldDevices, color: '#3B82F6' },
        ];
        return dataForPie;
    }, [stats]);

    const nivoBarData = useMemo(() => {
        const chartJsLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const chartJsDatasets = [
            {
                label: 'Dispositivos activos',
                data: [120, 190, 300, 500, 200, 300, 400, 500, 600, 700, 800, 900],
            },
            {
                label: 'Dispositivos bloqueados',
                data: [20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130],
            },
        ];

        return chartJsLabels.map((label, i) => {
            const nivoObject = { month: label };
            chartJsDatasets.forEach(dataset => {
                nivoObject[dataset.label] = dataset.data[i];
            });
            return nivoObject;
        });
    }, []);

    const nivoBarKeys = ['Dispositivos activos', 'Dispositivos bloqueados'];

    const barColors = {
        'Dispositivos activos': '#10B981',
        'Dispositivos bloqueados': '#EF4444',
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8 relative">
                {/* Contenedor principal del encabezado con proporciones responsivas */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
                    {/* Tarjeta de bienvenida */}
                    <div className="md:col-span-2 lg:col-span-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 sm:p-8 rounded-lg shadow-xl flex flex-col sm:flex-row items-center justify-between text-center sm:text-left">
                        <div className="flex-1">
                            <h2 className="text-2xl sm:text-4xl font-bold mb-1">
                                ¡Bienvenido, {loadingStore ? '...' : (storeName || 'de nuevo')}!
                            </h2>
                            <p className="text-base sm:text-lg opacity-90">Gestión eficiente de tus dispositivos con SmartPay.</p>
                        </div>
                        <RocketLaunchIcon className="h-16 w-16 sm:h-20 sm:w-20 opacity-30 mt-4 sm:mt-0 hidden md:block" />
                    </div>

                    {/* Contenedor de las métricas de licencias */}
                    <div className="md:col-span-1 lg:col-span-2">
                        <h3 className="bg-gradient-to-r to-blue-500 from-indigo-600 p-2 rounded-lg text-2xl font-bold text-white shadow-lg mb-4 text-center md:text-center">Licencias</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Tarjeta de Licencias Aprobadas */}
                            <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 relative text-center">
                                <span className="text-4xl sm:text-5xl font-bold text-blue-600">{loadingStore ? '...' : tokensAvailable.toLocaleString()}</span>
                                <span className="block text-sm sm:text-base font-semibold text-blue-600 mt-2">Aprobadas</span>
                            </div>

                            {/* Tarjeta de Licencias Usadas */}
                            <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 relative text-center">
                                <span className="text-4xl sm:text-5xl font-bold text-gray-700">{loadingStore ? '...' : devicesUsed.toLocaleString()}</span>
                                <span className="block text-sm sm:text-base font-semibold text-gray-700 mt-2">Usadas</span>
                            </div>

                            {/* Tarjeta de Licencias Disponibles */}
                            <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 relative text-center">
                                <span className="text-4xl sm:text-5xl font-bold text-green-500">{loadingStore ? '...' : realTokensAvailable.toLocaleString()}</span>
                                <span className="block text-sm sm:text-base font-semibold text-green-500 mt-2">Disponibles</span>
                            </div>
                        </div>
                    </div>
                </div>
            <main className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8">

                {/* Sección de reportes */}
                <ReportsPage />
            </main>

            {/* Botón flotante de Soporte SmartPay */}
            <a
                href="https://wa.me/51933392072"
                target="_blank"
                rel="noopener noreferrer"
                className="fixed bottom-6 right-6 flex items-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 z-50"
            >
                <img src='/assets/logo.png' className="w-6 h-6 mr-2 bg-white rounded-full p-1" alt="SmartPay Logo" />
                <span className="hidden md:inline">Soporte SmartPay</span>
                <span className="inline md:hidden">Soporte</span>
            </a>
        </div>
    );
};

export default Dashboard;