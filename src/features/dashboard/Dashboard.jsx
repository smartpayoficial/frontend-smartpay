import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../common/context/AuthProvider';
import { showNewUserAlert } from '../../common/utils/auth';
import { useNavigate } from 'react-router-dom';
import ReportsPage from '../reports/ReportsPage.jsx';
import { getStoreById, getStores } from '../../api/stores';
import { getCurrentUser } from '../../common/utils/helpers.js';
import { getPlans } from '../../api/plans';
import { RocketLaunchIcon } from '@heroicons/react/24/outline';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [storeName, setStoreName] = useState('');
    const [tokensAvailable, setTokensAvailable] = useState(0);
    const [devicesUsed, setDevicesUsed] = useState(0);
    const [storeCount, setStoreCount] = useState(0);
    const [soldLicensesCount, setSoldLicensesCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const currentUser = getCurrentUser();

            if (currentUser.role === 'Superadmin') {
                try {
                    // Request a large page size to get all stores, assuming the API supports it
                    const storesResponse = await getStores({ page_size: 1000 });
                    const allStores = storesResponse.results || storesResponse; // Handle paginated or simple array response

                    setStoreCount(storesResponse.count || allStores.length);

                    // Sum available tokens from each store to get total sold licenses, as per user instruction
                    const totalSold = allStores.reduce((sum, store) => sum + (store.tokens_disponibles || 0), 0);
                    setSoldLicensesCount(totalSold);

                } catch (error) {
                    console.error("Error fetching superadmin data:", error);
                }
            } else if (currentUser.store && currentUser.store.id) {
                try {
                    const fetchedStore = await getStoreById(currentUser.store.id);
                    setStoreName(fetchedStore.nombre);
                    setTokensAvailable(fetchedStore.tokens_disponibles || 0);
                    
                    const allPlans = await getPlans(); // This is correctly filtered for the store user
                    setDevicesUsed(allPlans.length); // Reverted to original logic
                } catch (error) {
                    console.error("Error fetching store data:", error);
                }
            }
            setLoading(false);
            showNewUserAlert(user, navigate);
        };

        if (user) {
            fetchData();
        }
    }, [user, navigate]);

    const realTokensAvailable = tokensAvailable - devicesUsed;

    const welcomeMessage = useMemo(() => {
        if (loading) return '...';
        if (user?.role === 'Superadmin') return 'Superadmin';
        return storeName || 'de nuevo';
    }, [loading, user, storeName]);

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8 relative">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
                <div className="md:col-span-2 lg:col-span-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 sm:p-8 rounded-lg shadow-xl flex flex-col sm:flex-row items-center justify-between text-center sm:text-left">
                    <div className="flex-1">
                        <h2 className="text-2xl sm:text-4xl font-bold mb-1">
                            ¡Bienvenido, {welcomeMessage}!
                        </h2>
                        <p className="text-base sm:text-lg opacity-90">Gestión eficiente de tus dispositivos con SmartPay.</p>
                    </div>
                    <RocketLaunchIcon className="h-16 w-16 sm:h-20 sm:w-20 opacity-30 mt-4 sm:mt-0 hidden md:block" />
                </div>

                <div className="md:col-span-1 lg:col-span-2">
                    {user?.role === 'Superadmin' ? (
                        <>
                            <h3 className="bg-gradient-to-r to-blue-500 from-indigo-600 p-2 rounded-lg text-2xl font-bold text-white shadow-lg mb-4 text-center md:text-center">Estadísticas Globales</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 relative text-center">
                                    <span className="text-4xl sm:text-5xl font-bold text-blue-600">{loading ? '...' : storeCount.toLocaleString()}</span>
                                    <span className="block text-sm sm:text-base font-semibold text-blue-600 mt-2">Tiendas Registradas</span>
                                </div>
                                <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 relative text-center">
                                    <span className="text-4xl sm:text-5xl font-bold text-gray-700">{loading ? '...' : soldLicensesCount.toLocaleString()}</span>
                                    <span className="block text-sm sm:text-base font-semibold text-gray-700 mt-2">Licencias Vendidas</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <h3 className="bg-gradient-to-r to-blue-500 from-indigo-600 p-2 rounded-lg text-2xl font-bold text-white shadow-lg mb-4 text-center md:text-center">Licencias</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 relative text-center">
                                    <span className="text-4xl sm:text-5xl font-bold text-blue-600">{loading ? '...' : tokensAvailable.toLocaleString()}</span>
                                    <span className="block text-sm sm:text-base font-semibold text-blue-600 mt-2">Aprobadas</span>
                                </div>
                                <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 relative text-center">
                                    <span className="text-4xl sm:text-5xl font-bold text-gray-700">{loading ? '...' : devicesUsed.toLocaleString()}</span>
                                    <span className="block text-sm sm:text-base font-semibold text-gray-700 mt-2">Usadas</span>
                                </div>
                                <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 relative text-center">
                                    <span className={`text-4xl sm:text-5xl font-bold ${realTokensAvailable === 0 ? 'text-red-500' : 'text-green-500'}`}>
                                        {loading ? '...' : realTokensAvailable.toLocaleString()}
                                    </span>
                                    <span className={`block text-sm sm:text-base font-semibold mt-2 ${realTokensAvailable === 0 ? 'text-red-500' : 'text-green-500'}`}>
                                        Disponibles
                                    </span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
            <main className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8">
                <ReportsPage />
            </main>
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