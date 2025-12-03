import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EnvelopeIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { requestPasswordReset } from '../../api/auth';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await requestPasswordReset({ email: email, dni: email });
            toast.success('Se han enviado las instrucciones para restablecer la contraseña a tu correo electrónico.');
        } catch (error) {
            toast.error('No se pudo enviar el correo. Verifica que el correo o DNI sea correcto.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen w-full flex items-center justify-center p-4 font-sans antialiased relative"
            style={{
                backgroundImage: 'url(/assets/images/fondo.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
        >
            <div className="absolute inset-0 bg-black bg-opacity-30 backdrop-filter backdrop-blur-md"></div>

            <div className="relative z-10 flex w-full max-w-6xl h-[600px] bg-white rounded-xl shadow-2xl overflow-hidden">
                <div
                    className="hidden lg:flex w-1/2 relative justify-center items-end p-8"
                    style={{
                        backgroundImage: 'url(/assets/images/fondo.jpg)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                    }}
                >
                    <div className="absolute inset-0 bg-black bg-opacity-30"></div>

                    <Link to="/login" className="absolute top-6 left-6 text-white text-sm bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-full flex items-center gap-2 transition-all duration-300 z-20">
                        <ArrowRightIcon className="h-4 w-4 transform rotate-180" />
                        Volver al Inicio de Sesión
                    </Link>

                    <div className="relative text-white p-6 pb-12 w-full text-center z-10">
                        <h1 className="text-4xl font-extrabold leading-tight mb-4">
                            Recupera tu Acceso
                        </h1>
                        <p className="text-lg opacity-90">
                            Un paso más cerca de volver a conectar.
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

                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">Recuperar Contraseña</h2>
                    <p className="text-gray-600 text-center mb-8">
                        Ingresa tu DNI o Identificación personal para recibir instrucciones.
                    </p>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email" className="input-label">
                                DNI - Identificación
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <EnvelopeIcon className="h-4 w-4" />
                                </span>
                                <input
                                    id="email"
                                    name="email"
                                    type="text"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 pr-10 py-2 rounded-lg border-b border-gray-300 focus:outline-none focus:border-blue-500 text-gray-900 placeholder-gray-400"
                                    placeholder="Tu correo o DNI"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full text-white font-semibold py-3 rounded-lg shadow-md transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-gradient-to-r from-blue-500 to-blue-800 hover:from-blue-700 hover:to-blue-900 disabled:opacity-50"
                        >
                            {isLoading ? 'Enviando...' : 'Enviar Instrucciones'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link
                            to="/login"
                            className="font-medium text-blue-600 hover:text-blue-500"
                        >
                            Volver al inicio de sesión
                        </Link>
                    </div>
                </div>
            </div>
            <ToastContainer />
        </div>
    );
};

export default ForgotPassword;