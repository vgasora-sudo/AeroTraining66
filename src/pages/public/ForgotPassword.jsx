// src/pages/public/ForgotPassword.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        // Simulación - luego conectar con API real
        setTimeout(() => {
            setMessage('✅ Se han enviado tus credenciales a tu correo electrónico.');
            setLoading(false);
            setEmail('');
        }, 1500);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a1a2f] to-[#0c2340] p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="text-5xl mb-3">✈️</div>
                    <h1 className="text-2xl font-bold text-white">
                        Recuperar <span className="text-[#20c997]">Credenciales</span>
                    </h1>
                    <p className="text-gray-400 text-sm mt-2">
                        Te enviaremos tus datos de acceso por email
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <h2 className="text-xl font-bold text-[#0c2340] text-center mb-6">
                        🔑 Recuperar acceso
                    </h2>

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-r-lg">
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    )}

                    {message && (
                        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4 rounded-r-lg">
                            <p className="text-green-700 text-sm">{message}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                📧 Email o Usuario
                            </label>
                            <input
                                type="text"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#20c997] focus:border-transparent transition-all"
                                placeholder="Introduce tu email o usuario"
                                required
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-[#20c997] to-[#0c2340] text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#20c997]/30 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {loading ? (
                                <>
                                    <span className="animate-spin">⏳</span>
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <span>📨</span>
                                    Enviar credenciales
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link to="/login" className="text-sm text-[#20c997] hover:text-[#0c2340] hover:underline transition">
                            ← Volver al inicio de sesión
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;