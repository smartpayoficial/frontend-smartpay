import React, { lazy, Suspense } from 'react';

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';



import { AuthProvider } from '../common/context/AuthProvider';

import PrivateRoute from './PrivateRoute';



import Layout from '../common/components/layout/Layout';
import { ToastContainer } from 'react-toastify';



// Rutas de Autenticación

const LoginPage = lazy(() => import('../features/auth/LoginPage'));

const RegisterPage = lazy(() => import('../features/auth/Register'));

const ForgotPasswordPage = lazy(() => import('../features/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('../features/auth/ResetPassword'));



// Rutas Generales / Dashboard

const LandingPage = lazy(() => import('../common/pages/LandingPage'));

const DashboardPage = lazy(() => import('../features/dashboard/Dashboard'));



// Rutas de Gestión de Usuarios y Clientes

const UserManagementPage = lazy(() => import('../features/users/UserManagementPage'));

const UserProfilePage = lazy(() => import('../features/users/UserProfilePage'));

const CustomerManagementPage = lazy(() => import('../features/customers/CustomerManagementPage'));

const CustomerRegisterFlowPage = lazy(() => import('../features/customers/CustomerRegisterFlowPage'));



// Rutas de Gestión de Tienda Dispositivos y Vendedores

const StoreManagementPage = lazy(() => import('../features/stores/StoreManagementPage'));
const DeviceManagementPage = lazy(() => import('../features/devices/DeviceManagementPage'));

const VendorManagementPage = lazy(() => import('../features/vendors/VendorManagementPage'));



// Rutas de Gestión de Pagos y Reportes

const PaymentManagementPage = lazy(() => import('../features/payments/PaymentManagementPage'));

const ReportsPage = lazy(() => import('../features/reports/ReportsPage'));



// Rutas de la PWA del Cliente

const ClientDashboardPage = lazy(() => import('../features/client-pwa/ClientDashboardPage'));

const ClientDeviceDetailsView = lazy(() => import('../features/client-pwa/ClientDeviceDetailsView'));

const ClientMakePaymentPage = lazy(() => import('../features/client-pwa/ClientMakePaymentPage'));



const ConfigurationPage = lazy(() => import('../features/config/ConfigurationPage'));



const AppRoutes = () => {

    return (

        <Router>

            <AuthProvider>

                <Suspense fallback={

                    <div className="flex justify-center items-center h-screen text-xl text-white">

                        Cargando contenido...

                    </div>

                }>

                    <Routes>

                        {/* Rutas Públicas */}

                        <Route path="/landing" element={<LandingPage />} />

                        <Route path="/login" element={<LoginPage />} />

                        <Route path="/register" element={<RegisterPage />} />

                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                        <Route path="/reset-password/reset-password" element={<ResetPassword />} />



                        {/* Redirección de la raíz a /login por defecto */}

                        {/* <Route path="/" element={<Navigate to="/landing" replace />} /> */}


                        <Route path="/" element={<Layout />}>
                            {/* Ruta index → si quieres redirigir según el rol, deberías hacerlo con lógica en el componente */}
                            <Route index element={<Navigate to="/landing" replace />} />
                            
                            <Route element={<PrivateRoute allowedRoles={['Superadmin','Store Admin']} />}>
                                <Route path="dashboard" element={<DashboardPage />} />
                                <Route path="devices-management" element={<DeviceManagementPage />} />

                            </Route>

                            {/* Dashboard: solo para Superadmin y Store Admin */}
                            <Route element={<PrivateRoute allowedRoles={['Store Admin']} />}>
                                <Route path="vendors-management" element={<VendorManagementPage />} />
                                <Route path="reports" element={<ReportsPage />} />
                                <Route path="configuration" element={<ConfigurationPage />} />
                            </Route>

                            {/* user-management: permitido a todos los roles mencionados */}
                            <Route element={<PrivateRoute allowedRoles={['Superadmin']} />}>
                                {/* <Route path="dashboard" element={<DashboardPage />} /> */}
                                <Route path="user-management" element={<UserManagementPage />} />
                                <Route path="store-management" element={<StoreManagementPage />} />
                            </Route>
                    
                            <Route element={<PrivateRoute allowedRoles={['Store Admin','Vendedor']} />}>
                                <Route path="customers-management" element={<CustomerManagementPage />} />
                                <Route path="customer-registration" element={<CustomerRegisterFlowPage />} />
                                <Route path="payments-management" element={<PaymentManagementPage />} />
                            </Route>

                            {/* Rutas compartidas entre todos los roles */}
                            <Route element={<PrivateRoute allowedRoles={['Superadmin', 'Store Admin', 'Admin', 'Vendedor']} />}>
                                <Route path="profile" element={<UserProfilePage />} />
                            </Route>

                            {/* Catch-all para rutas no encontradas */}
                            <Route path="*" element={<div className="p-8 text-white">404 - Página no encontrada</div>} />
                        </Route>


                        <Route element={<PrivateRoute allowedRoles={['Cliente']} />}>

                            <Route path="/client/dashboard" element={<ClientDashboardPage />} />

                            <Route path="/client/devices/:planId" element={<ClientDeviceDetailsView />} />

                            <Route path="/client/make-payment/:planId" element={<ClientMakePaymentPage />} />

                        </Route>



                        {/* Catch-all para cualquier otra ruta no manejada */}

                        <Route path="*" element={<div className="flex justify-center items-center h-screen text-xl text-white">404 - Página no encontrada</div>} />

                    </Routes>

                    <ToastContainer
                        position="top-right"
                        autoClose={5000}
                        hideProgressBar={false}
                        newestOnTop={false}
                        closeOnClick
                        rtl={false}
                        pauseOnFocusLoss
                        draggable
                        pauseOnHover
                    />

                </Suspense>

            </AuthProvider>

        </Router>

    );

};



export default AppRoutes;