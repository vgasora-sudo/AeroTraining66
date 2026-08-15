// src/pages/ForgotPassword.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:5000/api/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier: email })
            });

            const data = await response.json();

            if (data.success) {
                setMessage('✅ Se han enviado tus credenciales a tu correo.');
                setEmail('');
            } else {
                setError(data.error || 'No se encontró el usuario');
            }
        } catch (error) {
            setError('Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a1a2f] to-[#0c2340] p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
                <div className="text-center mb-8">
                    <div className="text-5xl mb-3">✈️</div>
                    <h1 className="text-2xl font-bold text-[#0c2340]">
                        Recuperar <span className="text-[#20c997]">Credenciales</span>
                    </h1>
                    <p className="text-gray-500 text-sm mt-2">Te enviaremos tus datos de acceso por email</p>
                </div>

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
                        <label className="block text-sm font-semibold text-gray-700 mb-2">📧 Email o Usuario</label>
                        <input
                            type="text"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#20c997]"
                            placeholder="Introduce tu email o usuario"
                            required
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-[#20c997] to-[#0c2340] text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
                    >
                        {loading ? '⏳ Enviando...' : '📨 Enviar credenciales'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link to="/login" className="text-sm text-[#20c997] hover:underline">← Volver al inicio de sesión</Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;