import { useEffect, useMemo, useState } from 'react';
import Cards from '../../common/components/ui/Cards';
import { PieChart, BarChart } from '../../common/components/ui/Charts';
import { useAuth } from '../../common/context/AuthProvider';
import { showNewUserAlert } from '../../common/utils/auth';
import { useNavigate } from 'react-router-dom';
import ReportsPage from '../reports/ReportsPage.jsx';
import { getStoreById } from '../../api/stores';
import { getCurrentUser } from '../../common/utils/helpers.js';
import { InformationCircleIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [storeName, setStoreName] = useState('');
    const [tokensAvailable, setTokensAvailable] = useState(0);
    const [loadingStore, setLoadingStore] = useState(true);

    useEffect(() => {
        const fetchStoreData = async () => {
            const currentUser = getCurrentUser();
            const store = currentUser?.store;

            if (store && store.id) {
                try {
                    const fetchedStore = await getStoreById(store.id);
                    setStoreName(fetchedStore.nombre);
                    setTokensAvailable(fetchedStore.tokens_disponibles);
                } catch (error) {
                    console.error("Error fetching store data:", error);
                }
            }
            setLoadingStore(false);
            showNewUserAlert(user, navigate);
        };

        fetchStoreData();
    }, [user, navigate]);


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
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
                {/* Contenedor principal del encabezado con proporciones responsivas */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
                    {/* Tarjeta de bienvenida */}
                    {/* Ocupa todo el ancho en móviles (col-span-1), 2/3 en tablet (md:col-span-2) y 80% en escritorio (lg:col-span-4) */}
                    <div className="md:col-span-2 lg:col-span-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 sm:p-8 rounded-lg shadow-xl flex flex-col sm:flex-row items-center justify-between text-center sm:text-left">
                        <div className="flex-1">
                            <h2 className="text-2xl sm:text-4xl font-bold mb-1">
                                ¡Bienvenido, {loadingStore ? '...' : (storeName || 'de nuevo')}!
                            </h2>
                            <p className="text-base sm:text-lg opacity-90">Gestión eficiente de tus dispositivos con SmartPay.</p>
                        </div>
                        {/* Ícono solo visible en pantallas grandes */}
                        <RocketLaunchIcon className="h-16 w-16 sm:h-20 sm:w-20 opacity-30 mt-4 sm:mt-0 hidden md:block" />
                    </div>

                    {/* Tarjeta de licencias */}
                    {/* Ocupa todo el ancho en móviles (col-span-1), 1/3 en tablet (md:col-span-1) y 20% en escritorio (lg:col-span-1) */}
                    <div className="md:col-span-1 lg:col-span-1 bg-white p-6 rounded-xl shadow-lg border border-gray-200 relative w-full">
                        <div className="absolute top-4 right-4 group cursor-pointer">
                            <InformationCircleIcon className="h-6 w-6 text-gray-400 transition-colors duration-200 hover:text-gray-600" />
                            <div className="absolute top-8 right-0 md:right-auto md:left-1/2 md:-translate-x-1/2 w-64 p-3 bg-gray-800 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                Para acceder a más licencias, comunícate con SmartPay.
                            </div>
                        </div>
                        <div className="flex flex-col items-center justify-center">
                            <span className="text-6xl sm:text-7xl font-bold text-green-500">{loadingStore ? '...' : tokensAvailable.toLocaleString()}</span>
                            <span className="text-base sm:text-lg font-semibold text-green-500 mt-2 text-center">Licencias Disponibles</span>
                        </div>
                    </div>
                </div>
            <main className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8">

                {/* Sección de reportes */}
                <ReportsPage />
            </main>
        </div>
    );
};

export default Dashboard;