// src/components/Sidebar.jsx

import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
    Squares2X2Icon,
    UserGroupIcon,
    DevicePhoneMobileIcon,
    CreditCardIcon,
    ChartBarIcon,
    XMarkIcon,
    ArrowLeftOnRectangleIcon,
    UsersIcon,
    ClipboardDocumentListIcon,
    Cog6ToothIcon,
    BuildingStorefrontIcon
} from '@heroicons/react/24/outline';
import { FaHome } from 'react-icons/fa'; // Para el link a Landing Page

import { useAuth } from '../../context/AuthProvider'; // Asegúrate de que la ruta sea correcta

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
    const { user, logout } = useAuth();

    // Definición de colores principales
    const primaryBlue = 'bg-blue-600 hover:bg-blue-700'; // Azul para fondo de activo
    const primaryTextBlue = 'text-blue-600'; // Azul para texto de logo, etc.
    const sidebarBg = 'bg-white border-r border-gray-200'; // Fondo blanco y borde gris claro
    const linkHoverBg = 'hover:bg-blue-50'; // Fondo de hover ligero (azul claro)
    const linkInactiveText = 'text-gray-700'; // Texto de enlace inactivo
    const linkInactiveIcon = 'text-gray-400'; // Icono de enlace inactivo
    const linkActiveText = 'text-white'; // Texto de enlace activo
    const linkActiveIcon = 'text-white'; // Icono de enlace activo

    // --- Definición de elementos de navegación por rol ---
    // (Tu lógica de navegación es buena, la mantengo igual)
    const superadminNavItems = [
        { name: 'Dashboard', icon: Squares2X2Icon, href: '/dashboard' },
        { name: 'Tiendas', icon: BuildingStorefrontIcon, href: '/store-management' },
        { name: 'Gestión De Dispositivos', icon: DevicePhoneMobileIcon, href: '/devices-management' },
        { name: 'Administradores', icon: UsersIcon, href: '/user-management' },
        // { name: 'Gestión de Vendedores', icon: UserGroupIcon, href: '/vendors-management' },
        // { name: 'Gestión de Clientes', icon: UserGroupIcon, href: '/customers-management' },
        // { name: 'Gestión de Dispositivos', icon: DevicePhoneMobileIcon, href: '/devices-management' },
        // { name: 'Pagos y Facturación', icon: CreditCardIcon, href: '/payments-management' },
        // { name: 'Reportes y Análisis', icon: ChartBarIcon, href: '/reports' },
        // { name: 'Gestión de Planes', icon: ClipboardDocumentListIcon, href: '/plans-management' }, // Agregado, ajusta la ruta si es diferente
        // { name: 'Configuración', icon: Cog6ToothIcon, href: '/configuration' },
    ];

    const adminNavItems = [
        { name: 'Dashboard', icon: Squares2X2Icon, href: '/dashboard' },
        { name: 'Gestión de Vendedores', icon: UserGroupIcon, href: '/vendors-management' },
        { name: 'Gestión de Clientes', icon: UserGroupIcon, href: '/customers-management' },
        { name: 'Gestión de Dispositivos', icon: DevicePhoneMobileIcon, href: '/devices-management' },
        { name: 'Pagos y Facturación', icon: CreditCardIcon, href: '/payments-management' },
        // { name: 'Gestión de Planes', icon: ClipboardDocumentListIcon, href: '/plans-management' }, // Agregado, ajusta la ruta si es diferente
    ];
    const adminStoreNavItems = [
        { name: 'Dashboard', icon: Squares2X2Icon, href: '/dashboard' },
        { name: 'Gestión de Vendedores', icon: UserGroupIcon, href: '/vendors-management' },
        { name: 'Gestión de Clientes', icon: UserGroupIcon, href: '/customers-management' },
        { name: 'Gestión de Dispositivos', icon: DevicePhoneMobileIcon, href: '/devices-management' },
        { name: 'Pagos y Facturación', icon: CreditCardIcon, href: '/payments-management' },
        { name: 'Configuración', icon: Cog6ToothIcon, href: '/configuration' }
        // { name: 'Gestión de Planes', icon: ClipboardDocumentListIcon, href: '/plans-management' }, // Agregado, ajusta la ruta si es diferente
    ];

    const vendedorNavItems = [
        // { name: 'Dashboard', icon: Squares2X2Icon, href: '/dashboard' },
        { name: 'Gestión de Clientes', icon: UserGroupIcon, href: '/customers-management' },
        // { name: 'Gestión de Dispositivos', icon: DevicePhoneMobileIcon, href: '/devices-management' },
        { name: 'Pagos y Facturación', icon: CreditCardIcon, href: '/payments-management' },
    ];

    const clienteNavItems = [
        { name: 'Dashboard', icon: Squares2X2Icon, href: '/clien/dashboard' }, // Cambiado a Squares2X2Icon para consistencia con otros dashboards
        { name: 'Mis Dispositivos', icon: DevicePhoneMobileIcon, href: '/my-devices' },
        { name: 'Realizar Pago', icon: CreditCardIcon, href: '/make-payment' },
    ];

    let navigationToRender = [];
    // let showRoleSwitcher = false;

    if (user) {
        switch (user.role) {
            case 'Superadmin':
                navigationToRender = superadminNavItems;
                // showRoleSwitcher = true;
                break;
            case 'Admin':
                navigationToRender = adminNavItems;
                // showRoleSwitcher = true;
                break;
            case 'Vendedor':
                navigationToRender = vendedorNavItems;
                break;
            case 'Cliente':
                navigationToRender = clienteNavItems;
                break;
            case 'Store Admin':
                navigationToRender = adminStoreNavItems;
                break;
            default:
                navigationToRender = [];
        }
    }

    return (
        <>
            {/* Overlay para móviles cuando la sidebar está abierta (fondo oscuro semitransparente) */}
            <div
                className={`fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden transition-opacity duration-300 ease-in-out ${sidebarOpen ? 'opacity-100 block' : 'opacity-0 hidden'}`}
                onClick={() => setSidebarOpen(false)}
                aria-hidden="true"
            />

            {/* Sidebar principal */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 ${sidebarBg} shadow-xl
                            transform transition-transform duration-300 ease-in-out
                            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                            md:translate-x-0 md:relative md:flex md:flex-col`}
            >
                {/* Sidebar Header/Logo */}
                <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
                    <Link to={user ? '/dashboard' : '/'} className="flex-shrink-0 flex items-center space-x-2 hover:bg-blue-50 rounded-sm px-6 py-1">
                        <div className="w-40  p-1 rounded-lg flex items-center justify-center ">
                            {/* Ajustado a w-8 h-8 para un logo más pequeño */}
                            <img src="/assets/logo1.png" alt="Logo SmartPay" className="w-full h-full object-contain" />
                        </div>
                        {/* <span className={`text-2xl font-bold ${primaryTextBlue}`}>SmartPay</span> */}
                    </Link>
                    {/* Botón para cerrar en móvil */}
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className={`md:hidden p-2 rounded-md ${primaryTextBlue} ${linkHoverBg} focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500`}
                        aria-label="Cerrar menú lateral"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Contenido principal de la navegación */}
                <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
                    {navigationToRender.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.href}
                            end={item.href === '/dashboard' || item.href === '/clien/dashboard'} // Usa 'end' para el dashboard si es la ruta base
                            className={({ isActive }) =>
                                `group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150 ease-in-out
                                ${isActive
                                    ? `${primaryBlue} ${linkActiveText} shadow-md` // Fondo azul, texto blanco para activo
                                    : `${linkInactiveText} ${linkHoverBg} hover:text-blue-600` // Texto gris, hover azul claro, texto de hover azul
                                }`
                            }
                            onClick={() => { // Cierra sidebar en móvil al hacer clic
                                if (sidebarOpen) {
                                    setSidebarOpen(false);
                                }
                            }}
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon
                                        className={`h-5 w-5 mr-3 flex-shrink-0 transition-colors duration-150 ease-in-out
                                        ${isActive
                                                ? `${linkActiveIcon}` // Icono blanco para activo
                                                : `${linkInactiveIcon} group-hover:text-blue-500` // Icono gris, hover azul
                                            }`}
                                        aria-hidden="true"
                                    />
                                    {item.name}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Sección inferior de la Sidebar (Información de usuario y acciones) */}
                <div className="px-3 py-4 mt-auto border-t border-gray-200"> {/* Border-t para una separación clara */}


                    {/* Enlace a Landing Page */}
                    <NavLink
                        to="/landing"
                        className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg ${linkInactiveText} ${linkHoverBg} hover:text-blue-600 transition-colors duration-150 ease-in-out`}
                        onClick={() => { if (sidebarOpen) setSidebarOpen(false); }}
                    >
                        <FaHome className={`h-5 w-5 mr-3 flex-shrink-0 ${linkInactiveIcon} group-hover:text-blue-500`} />
                        Landing Page
                    </NavLink>

                    {/* Botón de Cerrar Sesión */}
                    <button
                        onClick={() => {
                            logout();
                            if (sidebarOpen) setSidebarOpen(false);
                        }}
                        className="group flex items-center w-full text-left px-3 py-2.5 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-150 ease-in-out mt-2"
                    >
                        <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-3 flex-shrink-0 text-red-500 group-hover:text-red-600" />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;