// src/pages/admin/ResponderConsultaWeb.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { enviarRespuestaPorEmail } from '../../services/emailService';

const ResponderConsultaWeb = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [consulta, setConsulta] = useState(null);
    const [respuesta, setRespuesta] = useState('');
    const [loading, setLoading] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [mensajeFeedback, setMensajeFeedback] = useState({ texto: '', tipo: '' });

    useEffect(() => {
        cargarConsulta();
    }, [id]);

    const cargarConsulta = () => {
        const data = localStorage.getItem('aerotraining_consultas_web');
        if (data) {
            const todas = JSON.parse(data);
            const encontrado = todas.find(c => c.id === parseInt(id));
            if (encontrado) {
                setConsulta(encontrado);
            } else {
                setMensajeFeedback({ texto: '❌ Consulta no encontrada', tipo: 'error' });
            }
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!respuesta.trim()) {
            setMensajeFeedback({ texto: '⚠️ Escribe una respuesta antes de enviar', tipo: 'error' });
            setTimeout(() => setMensajeFeedback({ texto: '', tipo: '' }), 3000);
            return;
        }

        setEnviando(true);

        // 1. Guardar en localStorage
        const data = localStorage.getItem('aerotraining_consultas_web');
        if (data) {
            const todas = JSON.parse(data);
            const actualizadas = todas.map(c => 
                c.id === parseInt(id) 
                    ? { 
                        ...c, 
                        respondido: true, 
                        respuesta_admin: respuesta,
                        fecha_respuesta: new Date().toISOString().replace('T', ' ').slice(0, 16),
                        leido: true
                      }
                    : c
            );
            localStorage.setItem('aerotraining_consultas_web', JSON.stringify(actualizadas));
        }

        // 2. Enviar correo al contacto
        const emailResult = await enviarRespuestaPorEmail({
            nombre: consulta.nombre,
            email: consulta.email,
            asunto: consulta.asunto,
            respuesta: respuesta
        });

        if (emailResult.success) {
            setMensajeFeedback({ 
                texto: '✅ Respuesta enviada correctamente. El contacto recibirá un email.', 
                tipo: 'success' 
            });
        } else {
            setMensajeFeedback({ 
                texto: '⚠️ Respuesta guardada, pero hubo un problema al enviar el correo.', 
                tipo: 'warning' 
            });
        }

        setEnviando(false);

        setTimeout(() => {
            navigate('/admin/consultas-web');
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
                    <p className="mt-4 text-gray-500">Cargando consulta...</p>
                </div>
            </div>
        );
    }

    if (!consulta) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="text-6xl mb-4">❌</div>
                <h2 className="text-2xl font-bold text-[#0c2340]">Consulta no encontrada</h2>
                <button onClick={() => navigate('/admin/consultas-web')} className="mt-4 text-[#20c997] hover:underline">
                    ← Volver a consultas web
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            <button
                onClick={() => navigate('/admin/consultas-web')}
                className="text-[#20c997] hover:underline mb-4 flex items-center gap-2"
            >
                <i className="fas fa-arrow-left"></i> Volver a consultas web
            </button>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-[#0c2340] to-[#1a3a5c] p-5 text-white">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <i className="fas fa-reply-all"></i> Responder consulta web
                    </h2>
                    <p className="text-sm text-gray-300 mt-1">La respuesta se enviará por correo electrónico al contacto</p>
                </div>

                <div className="p-6">
                    {mensajeFeedback.texto && (
                        <div className={`p-4 rounded-xl border-l-4 mb-4 ${
                            mensajeFeedback.tipo === 'success' 
                                ? 'bg-green-50 border-green-500 text-green-700' 
                                : mensajeFeedback.tipo === 'warning'
                                ? 'bg-yellow-50 border-yellow-500 text-yellow-700'
                                : 'bg-red-50 border-red-500 text-red-700'
                        }`}>
                            {mensajeFeedback.texto}
                        </div>
                    )}

                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <span className="font-semibold text-gray-500">Nombre:</span>
                                <span className="ml-2 text-[#0c2340]">{consulta.nombre}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-500">Email:</span>
                                <span className="ml-2 text-[#0c2340]">{consulta.email}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-500">Teléfono:</span>
                                <span className="ml-2 text-[#0c2340]">{consulta.telefono || 'No especificado'}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-500">Asunto:</span>
                                <span className="ml-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                                    {consulta.asunto}
                                </span>
                            </div>
                            <div className="col-span-2">
                                <span className="font-semibold text-gray-500">Fecha:</span>
                                <span className="ml-2 text-[#0c2340]">{formatearFecha(consulta.fecha_envio)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 mb-6 border-l-4 border-yellow-400">
                        <p className="text-sm font-semibold text-gray-600 mb-1">
                            <i className="fas fa-comment"></i> Mensaje del contacto:
                        </p>
                        <p className="text-gray-800">{consulta.mensaje}</p>
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
                                    Enviar respuesta por email
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResponderConsultaWeb;