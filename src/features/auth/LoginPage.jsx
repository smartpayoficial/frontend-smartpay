// src/features/auth/LoginPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../common/context/AuthProvider'; // Correct path to AuthProvider
import { EyeIcon, EyeSlashIcon, ArrowRightIcon, EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import axios from 'axios'; // Keep axios for testFetchUsers or other potential calls, but not for login itself

// Importa SweetAlert2 y el wrapper de React
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

// Crea una instancia de SweetAlert2 con capacidad para React
const MySwal = withReactContent(Swal);

// Define la URL base de tu API principal
// const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_BASE_URL; // Not needed directly for login anymore

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false); // Keep if you plan to use this for persistent session (e.g., with refresh tokens)
    const [loading, setLoading] = useState(false); // State for loading indicator
    // const [error, setError] = useState(''); // This state might become redundant as SweetAlert handles errors
    // const [debugMessage, setDebugMessage] = useState(''); // Keep for debugging if desired

    const { login } = useAuth(); // <--- Get the login function from AuthProvider
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        // setError(''); // Clear internal error state if SweetAlert handles it
        // setDebugMessage(''); // Clear internal debug message if SweetAlert handles it
        setLoading(true); // Activate loading indicator

        try {
            // *** THE KEY CHANGE IS HERE ***
            // Call the login function from AuthProvider.
            // AuthProvider now handles the axios calls, token/user storage, and navigation.
            await login(username, password);

            // If login succeeds (no error thrown), show success alert.
            // AuthProvider already navigates, so SweetAlert's .then() can be removed or just confirm.
            MySwal.fire({
                icon: 'success',
                title: '¡Inicio de Sesión Exitoso!',
                text: 'Serás redirigido al panel de control.',
                timer: 2000,
                timerProgressBar: true,
                showConfirmButton: false,
            });
            // The navigate('/dashboard') is now handled by AuthProvider.

        } catch (err) {
            // Errors from AuthProvider's login function are caught here.
            // AuthProvider already logs errors, but you can display a user-friendly message.
            console.error("Error during login:", err);

            let errorMessage = 'Ocurrió un error inesperado al iniciar sesión.';
            let debugDetails = '';

            // The error object thrown by AuthProvider might already be structured
            // or contain the details from the Axios error.
            if (err.response) { // Check if it's an Axios error response from AuthProvider's propagation
                errorMessage = err.response.data?.detail || err.response.statusText || 'Credenciales inválidas.';
                debugDetails = `Detalles del error (API): ${JSON.stringify(err.response.data)}`;
            } else if (err.request) {
                errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión.';
                debugDetails = 'El backend no respondió.';
            } else if (err.message) { // Generic JS error or error string from AuthProvider
                errorMessage = err.message;
                debugDetails = `Mensaje de error: ${err.message}`;
            }

            MySwal.fire({
                icon: 'error',
                title: 'Error en el Login',
                text: errorMessage,
                // footer: debugDetails ? `<h5>Detalles de Depuración:</h5><pre><code>${debugDetails}</code></pre>` : '',
                confirmButtonText: 'Cerrar'
            });
            // setError(errorMessage); // If you still want to display error below form
            // setDebugMessage(debugDetails); // If you still want to display debug message below form
        } finally {
            setLoading(false); // Deactivate loading indicator
        }
    };

    // The testFetchUsers function remains largely the same, as it's a separate test
    // and correctly uses API_BASE_URL.
    const testFetchUsers = async () => {
        // setDebugMessage(''); // Clear debug message if SweetAlert is primary display
        try {
            // Assuming this endpoint also uses API_BASE_URL from the environment
            const response = await axios.get(`${import.meta.env.VITE_REACT_APP_API_BASE_URL}/api/v1/users`);

            if (response.data && Array.isArray(response.data)) {
                MySwal.fire({
                    icon: 'info',
                    title: '¡Usuarios Obtenidos!',
                    html: `Se obtuvieron ${response.data.length} usuarios.<br><br>Mostrando los primeros 2:<pre><code>${JSON.stringify(response.data.slice(0, 2), null, 2)}</code></pre>`,
                    confirmButtonText: 'Ok'
                });
                // setDebugMessage(`Usuarios obtenidos: ${JSON.stringify(response.data.slice(0, 2))}... Total: ${response.data.length}`);
            } else {
                MySwal.fire({
                    icon: 'warning',
                    title: 'Respuesta Inesperada',
                    text: 'La API no devolvió un array de usuarios.',
                    footer: `<pre><code>${JSON.stringify(response.data, null, 2)}</code></pre>`,
                    confirmButtonText: 'Cerrar'
                });
                // setDebugMessage(`Respuesta inesperada al obtener usuarios: ${JSON.stringify(response.data)}`);
            }
        } catch (err) {
            console.error("Error al obtener usuarios:", err);
            let errorMessage = 'Error al intentar obtener usuarios.';
            let debugDetails = '';
            if (axios.isAxiosError(err)) {
                if (err.response) {
                    errorMessage = `Error ${err.response.status}: ${err.response.data?.detail || err.response.statusText}`;
                    debugDetails = `Detalles: ${JSON.stringify(err.response.data, null, 2)}`;
                } else if (err.request) {
                    errorMessage = 'No hay respuesta del servidor para /users.';
                    debugDetails = 'Posiblemente el backend no esté corriendo o CORS.';
                }
            } else {
                errorMessage = `Error: ${err.message}`;
            }

            MySwal.fire({
                icon: 'error',
                title: 'Error al Obtener Usuarios',
                text: errorMessage,
                footer: debugDetails ? `<pre><code>${debugDetails}</code></pre>` : '',
                confirmButtonText: 'Cerrar'
            });
            // setDebugMessage(debugDetails);
        }
    };

    return (
        <div
            className="min-h-screen w-full flex items-center justify-center p-4 font-sans antialiased relative"
            style={{
                backgroundImage: 'url(/assets/images/background-login.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
        >
            <div className="absolute inset-0 bg-black bg-opacity-30 backdrop-filter backdrop-blur-md"></div>

            <div className="relative z-10 flex w-full max-w-6xl h-[600px] bg-white rounded-xl shadow-2xl overflow-hidden">
                <div
                    className="hidden lg:flex w-2/2 relative justify-center items-end p-8"
                    style={{
                        backgroundImage: 'url(/assets/images/login.png)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                    }}
                >
                    <div className="absolute inset-0 bg-black bg-opacity-30"></div>

                    <Link to="/landing" className="absolute top-6 left-6 text-white text-sm bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-full flex items-center gap-2 transition-all duration-300 z-20">
                        <ArrowRightIcon className="h-4 w-4 transform rotate-180" />
                        Volver al inicio
                    </Link>

                    <div className="relative text-white p-6 pb-12 w-full text-center z-10">
                        <h1 className="text-4xl font-extrabold leading-tight mb-4">
                            Capturando Momentos, Creando Recuerdos
                        </h1>
                        <p className="text-lg opacity-90">
                            Donde cada pago es una nueva oportunidad.
                        </p>
                        <div className="flex justify-center mt-8 space-x-2">
                            <span className="h-2 w-2 rounded-full bg-white opacity-50"></span>
                            <span className="h-2 w-8 rounded-full bg-white"></span>
                            <span className="h-2 w-2 rounded-full bg-white opacity-50"></span>
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white">
                    <div className="flex justify-center mb-6">
                        <img src="/assets/logo.png" alt="Logo SmartPay" className="h-12 w-auto" />
                    </div>

                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">Bienvenido</h2>
                    <p className="text-gray-600 text-center mb-8">
                        ¡Me alegra verte de nuevo!
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="username" className="input-label">
                                Usuario
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <EnvelopeIcon className="h-4 w-4" />
                                </span>
                                <input
                                    type="text"
                                    id="user"
                                    className="block w-full pl-10 pr-10 py-2 rounded-lg border-b border-gray-300 focus:outline-none focus:border-blue-500 text-gray-900 placeholder-gray-400"
                                    placeholder="Ej: Admin"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="input-label">
                                Contraseña
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <LockClosedIcon className="h-4 w-4" />
                                </span>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    className="block w-full pl-10 pr-10 py-2 rounded-lg border-b border-gray-300 focus:outline-none focus:border-blue-500 text-gray-900 placeholder-gray-400"
                                    placeholder="•••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                                >
                                    {showPassword ? (
                                        <EyeSlashIcon className="h-4 w-4" />
                                    ) : (
                                        <EyeIcon className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        

                        <button
                            type="submit"
                            className="w-full text-white font-semibold py-3 rounded-lg shadow-md transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-gradient-to-r from-blue-500 to-blue-800 hover:from-blue-700 hover:to-blue-900"
                            disabled={loading} // Disable button while loading
                        >
                            {loading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
                        </button>

                        <div className="flex items-center justify-center text-sm">
                            <div className="flex items-center">
                                <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                                    ¿Olvidaste la contraseña?
                                </Link>
                            </div>
                        </div>

                        {/* <button
                            type="button"
                            onClick={testFetchUsers}
                            className="w-full text-blue-700 border border-blue-700 font-semibold py-3 rounded-lg shadow-md transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-white hover:bg-blue-50 mt-4"
                        >
                            Probar Obtener Usuarios (Debug)
                        </button> */}
                    </form>
                    {/* 
                    <p className="text-center text-sm text-gray-600 mt-6">
                        ¿Todavía no tienes una cuenta? {' '}
                        <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                            Registrarse
                        </Link>
                    </p> */}
                </div>
            </div>
        </div>
    );
};

export default LoginPage;