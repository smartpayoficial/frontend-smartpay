import { useState } from 'react';
import { EyeIcon, EyeSlashIcon, LockClosedIcon } from '@heroicons/react/24/outline';

// Importa SweetAlert2 y el wrapper de React
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { resetPassword } from '../../api/auth';
import { useNavigate, useSearchParams } from 'react-router-dom';

// Crea una instancia de SweetAlert2 con capacidad para React
const MySwal = withReactContent(Swal);

// Define la URL base de tu API principal
// const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_BASE_URL; // Not needed directly for login anymore

const ResetPassword = () => {
    const [confirmPassword, setConfirmPassword] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordTwo, setShowPasswordTwo] = useState(false);
    const [loading, setLoading] = useState(false); // State for loading indicator
    const [passwordErrors, setPasswordErrors] = useState([]);
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); // Activate loading indicator
        try {
            const data = { new_password: password, token: token };
            await resetPassword(data);
            navigate('/login');
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
                footer: debugDetails ? `<h5>Detalles de Depuración:</h5><pre><code>${debugDetails}</code></pre>` : '',
                confirmButtonText: 'Cerrar'
            });
            // setError(errorMessage); // If you still want to display error below form
            // setDebugMessage(debugDetails); // If you still want to display debug message below form
        } finally {
            setLoading(false); // Deactivate loading indicator
        }
    };

    /**
     * Renderiza mensajes para resetear contraseña
     */
    const validatePassword = (pwd) => {
        if (pwd.length < 8) {
            return ['Debe tener al menos 8 caracteres.'];
        }

        if (!/[A-Z]/.test(pwd)) {
            return ['Debe incluir al menos una letra mayúscula.'];
        }

        if (!/\d/.test(pwd)) {
            return ['Debe incluir al menos un número.'];
        }

        return [];
    };

    /**
     * Validar si el form esta Completo
     * @returns {boolean}
     */
    const formIsValid = () => {
        return password && confirmPassword && password == confirmPassword && passwordErrors.length <= 0;
    }

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

                    <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Actualizar Contraseña</h2>

                    <form onSubmit={handleSubmit} className="space-y-6">

                        <div>
                            <label htmlFor="password" className="input-label text-sm">
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
                                    onChange={(e) => {
                                        const pwd = e.target.value;
                                        setPassword(pwd);
                                        setPasswordErrors(validatePassword(pwd));
                                    }}
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
                            <div className="text-xs text-red-600 h-5 flex items-center">
                                {passwordErrors.length > 0 && passwordErrors[0]}
                            </div>
                        </div>


                        <div>
                            <label htmlFor="confirm" className="input-label text-sm">
                                Confirmar Contraseña
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <LockClosedIcon className="h-4 w-4" />
                                </span>
                                <input
                                    type={showPasswordTwo ? 'text' : 'password'}
                                    id="confirm"
                                    className="block w-full pl-10 pr-10 py-2 rounded-lg border-b border-gray-300 focus:outline-none focus:border-blue-500 text-gray-900 placeholder-gray-400"
                                    placeholder="•••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordTwo(!showPasswordTwo)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                                >
                                    {showPasswordTwo ? (
                                        <EyeSlashIcon className="h-4 w-4" />
                                    ) : (
                                        <EyeIcon className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                            <div className='text-xs text-red-600 h-5 flex items-center'>{confirmPassword !== password && confirmPassword.length > 0 && ('Las contraseñas no son iguales.')}</div>
                        </div>


                        <button
                            type="submit"
                            className="w-full text-white font-semibold py-3 rounded-lg shadow-md transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-gradient-to-r from-blue-500 to-blue-800 hover:from-blue-700 hover:to-blue-900"
                            disabled={loading || !formIsValid()}
                        >
                            {loading ? 'Actualizando...' : 'Actualizar'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;