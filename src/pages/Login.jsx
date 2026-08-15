// src/pages/Login.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('aerotraining_token');
        const user = JSON.parse(localStorage.getItem('aerotraining_user') || 'null');
        if (token && user) {
            if (user.is_admin || user.es_admin) {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        }
    }, [navigate]);

    // ✅ FUNCIÓN PARA REGISTRAR CONEXIÓN DE ENTRADA (CON ALERTAS)
    const registrarConexion = async (alumnoId) => {
        try {
            if (!alumnoId) {
                alert('❌ Error: No se pudo obtener el ID del alumno.');
                console.error('❌ alumnoId es null o undefined');
                return;
            }
            const now = new Date();
            const fecha = now.toISOString().split('T')[0];
            const hora = now.toTimeString().split(' ')[0];
            
            const { error } = await supabase
                .from('conexiones')
                .insert([{
                    alumno_id: alumnoId,
                    fecha: fecha,
                    entrada: hora,
                    salida: null
                }]);
            if (error) {
                alert(`❌ Error registrando conexión: ${error.message}`);
                console.error('❌ Error registrando conexión:', error);
            } else {
                alert(`✅ Conexión registrada para alumno ID: ${alumnoId} a las ${hora}`);
                console.log('✅ Conexión registrada para alumno', alumnoId, 'fecha:', fecha, 'hora:', hora);
            }
        } catch (error) {
            alert(`❌ Error en registrarConexion: ${error.message}`);
            console.error('❌ Error en registrarConexion:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // 1. Buscar en Supabase por username
            const { data, error } = await supabase
                .from('alumnos')
                .select('*')
                .eq('username', username)
                .eq('password', password);

            if (error) {
                console.error('Error en login:', error);
                setError('❌ Error al conectar con la base de datos');
                setLoading(false);
                return;
            }

            if (!data || data.length === 0) {
                setError('❌ Usuario o contraseña incorrectos');
                setLoading(false);
                return;
            }

            const user = data[0];

            // Guardar sesión
            localStorage.setItem('aerotraining_token', 'token_' + Date.now());
            localStorage.setItem('aerotraining_user', JSON.stringify({
                id: user.id,
                username: user.username,
                nombre: user.nombre,
                apellido: user.apellido || '',
                email: user.email,
                licencia: user.licencia || 'B1.1',
                documento: user.documento,
                telefono: user.telefono,
                es_admin: user.es_admin || false,
                is_admin: user.es_admin || false
            }));

            // ✅ REGISTRAR CONEXIÓN DE ENTRADA
            if (user.id) {
                await registrarConexion(user.id);
            } else {
                alert('❌ user.id es null');
                console.error('❌ user.id es null');
            }

            // Redirigir
            if (user.es_admin) {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }

        } catch (err) {
            console.error('Error:', err);
            setError('❌ Error al iniciar sesión');
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
                        Aero<span className="text-[#20c997]">Training</span> 66
                    </h1>
                    <p className="text-gray-500 text-sm">EASA Part 147 · Centro Autorizado</p>
                </div>

                <h2 className="text-xl font-bold text-[#0c2340] text-center mb-6">Accede a tu cuenta</h2>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-r-lg">
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">👤 Usuario</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#20c997]"
                            placeholder="Introduce tu usuario"
                            required
                            disabled={loading}
                            autoComplete="username"
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">🔒 Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#20c997]"
                            placeholder="Introduce tu contraseña"
                            required
                            disabled={loading}
                            autoComplete="current-password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-[#20c997] to-[#0c2340] text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
                    >
                        {loading ? '⏳ Cargando...' : '🚀 Acceder al Campus'}
                    </button>
                </form>

                <div className="mt-4 text-center text-xs text-gray-400 border-t border-gray-200 pt-4">
                    <p>🔒 Acceso seguro para alumnos y personal autorizado.</p>
                    <p className="mt-1">¿Problemas con tu acceso? Contacta con administración.</p>
                </div>

                <div className="mt-4 text-center">
                    <Link to="/" className="text-sm text-[#20c997] hover:underline">← Volver al inicio</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
