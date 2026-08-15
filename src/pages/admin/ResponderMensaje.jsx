// src/pages/admin/ResponderMensaje.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ResponderMensaje = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [mensaje, setMensaje] = useState(null);
    const [respuesta, setRespuesta] = useState('');
    const [loading, setLoading] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [mensajeFeedback, setMensajeFeedback] = useState({ texto: '', tipo: '' });

    useEffect(() => {
        cargarMensaje();
    }, [id]);

    const cargarMensaje = () => {
        const data = localStorage.getItem('aerotraining_mensajes');
        if (data) {
            const todos = JSON.parse(data);
            const encontrado = todos.find(m => m.id === parseInt(id));
            if (encontrado) {
                setMensaje(encontrado);
            } else {
                setMensajeFeedback({ texto: '❌ Mensaje no encontrado', tipo: 'error' });
            }
        }
        setLoading(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!respuesta.trim()) {
            setMensajeFeedback({ texto: '⚠️ Escribe una respuesta antes de enviar', tipo: 'error' });
            setTimeout(() => setMensajeFeedback({ texto: '', tipo: '' }), 3000);
            return;
        }

        setEnviando(true);

        const data = localStorage.getItem('aerotraining_mensajes');
        if (data) {
            const todos = JSON.parse(data);
            const actualizados = todos.map(m => 
                m.id === parseInt(id) 
                    ? { 
                        ...m, 
                        respondido: true, 
                        respuesta_admin: respuesta,
                        fecha_respuesta: new Date().toISOString().replace('T', ' ').slice(0, 16),
                        // No marcamos como leído para que el alumno vea la notificación
                        leido: false
                      }
                    : m
            );
            localStorage.setItem('aerotraining_mensajes', JSON.stringify(actualizados));
        }

        setMensajeFeedback({ texto: '✅ Respuesta enviada correctamente', tipo: 'success' });
        setEnviando(false);

        setTimeout(() => {
            navigate('/admin/mensajes');
        }, 2000);
    };

    const formatearFecha = (fechaStr) => {
        try {
            const fecha = new Date(fechaStr);
            return fecha.toLocaleString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return fechaStr;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="text-4xl animate-spin">✈️</div>
                    <p className="mt-4 text-gray-500">Cargando mensaje...</p>
                </div>
            </div>
        );
    }

    if (!mensaje) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="text-6xl mb-4">❌</div>
                <h2 className="text-2xl font-bold text-[#0c2340]">Mensaje no encontrado</h2>
                <button onClick={() => navigate('/admin/mensajes')} className="mt-4 text-[#20c997] hover:underline">
                    ← Volver a mensajes
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            <button
                onClick={() => navigate('/admin/mensajes')}
                className="text-[#20c997] hover:underline mb-4 flex items-center gap-2"
            >
                <i className="fas fa-arrow-left"></i> Volver a mensajes
            </button>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-[#0c2340] to-[#1a3a5c] p-5 text-white">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <i className="fas fa-reply-all"></i> Responder consulta
                    </h2>
                    <p className="text-sm text-gray-300 mt-1">El alumno recibirá tu respuesta en su bandeja</p>
                </div>

                <div className="p-6">
                    {mensajeFeedback.texto && (
                        <div className={`p-4 rounded-xl border-l-4 mb-4 ${
                            mensajeFeedback.tipo === 'success' 
                                ? 'bg-green-50 border-green-500 text-green-700' 
                                : 'bg-red-50 border-red-500 text-red-700'
                        }`}>
                            {mensajeFeedback.texto}
                        </div>
                    )}

                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <span className="font-semibold text-gray-500">Alumno:</span>
                                <span className="ml-2 text-[#0c2340]">{mensaje.alumno_nombre}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-500">Usuario:</span>
                                <span className="ml-2 text-[#0c2340]">@{mensaje.alumno_usuario}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-500">Email:</span>
                                <span className="ml-2 text-[#0c2340]">{mensaje.alumno_email || 'No disponible'}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-500">Categoría:</span>
                                <span className="ml-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                                    {mensaje.categoria}
                                </span>
                            </div>
                            <div className="col-span-2">
                                <span className="font-semibold text-gray-500">Fecha:</span>
                                <span className="ml-2 text-[#0c2340]">{formatearFecha(mensaje.fecha_envio)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 mb-6 border-l-4 border-yellow-400">
                        <p className="text-sm font-semibold text-gray-600 mb-1">
                            <i className="fas fa-comment"></i> Consulta del alumno:
                        </p>
                        <p className="text-gray-800">{mensaje.mensaje}</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <i className="fas fa-edit text-[#20c997] mr-2"></i>
                            Tu respuesta:
                        </label>
                        <textarea
                            value={respuesta}
                            onChange={(e) => setRespuesta(e.target.value)}
                            rows="5"
                            placeholder="Escribe aquí tu respuesta de forma clara y detallada..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] focus:ring-2 focus:ring-[#20c997]/20 transition resize-none"
                            required
                            disabled={enviando}
                        />

                        <button
                            type="submit"
                            disabled={enviando}
                            className="mt-4 w-full bg-gradient-to-r from-[#20c997] to-[#0c2340] text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#20c997]/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {enviando ? (
                                <>
                                    <span className="animate-spin">⏳</span>
                                    Enviando respuesta...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-paper-plane"></i>
                                    Enviar respuesta
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResponderMensaje;