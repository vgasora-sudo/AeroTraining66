// src/pages/admin/AdminConsultasWeb.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminConsultasWeb = () => {
    const navigate = useNavigate();
    const [consultas, setConsultas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mensajeFeedback, setMensajeFeedback] = useState({ texto: '', tipo: '' });

    useEffect(() => {
        cargarConsultas();
        const interval = setInterval(cargarConsultas, 15000);
        return () => clearInterval(interval);
    }, []);

    const cargarConsultas = () => {
        try {
            const data = localStorage.getItem('aerotraining_consultas_web');
            if (data) {
                const todas = JSON.parse(data);
                if (Array.isArray(todas)) {
                    todas.sort((a, b) => new Date(b.fecha_envio) - new Date(a.fecha_envio));
                    setConsultas(todas);
                } else {
                    setConsultas([]);
                }
            } else {
                // Datos de ejemplo
                const ejemplos = [
                    {
                        id: 1,
                        nombre: 'María González',
                        email: 'maria@email.com',
                        telefono: '600111222',
                        asunto: 'Información general',
                        mensaje: 'Me gustaría recibir información sobre los cursos de formación EASA Part 66.',
                        fecha_envio: '2026-07-08 10:30:00',
                        leido: false,
                        respondido: false,
                        respuesta_admin: null,
                        fecha_respuesta: null
                    },
                    {
                        id: 2,
                        nombre: 'Carlos Rodríguez',
                        email: 'carlos@email.com',
                        telefono: '600333444',
                        asunto: 'Matriculación',
                        mensaje: '¿Cómo puedo matricularme en el módulo M3 - Electricidad?',
                        fecha_envio: '2026-07-07 15:20:00',
                        leido: true,
                        respondido: true,
                        respuesta_admin: 'Buenos días Carlos, para matricularte en el módulo M3 debes acceder al campus virtual y seleccionar la convocatoria disponible.',
                        fecha_respuesta: '2026-07-08 09:00:00'
                    },
                    {
                        id: 3,
                        nombre: 'Ana Martínez',
                        email: 'ana@email.com',
                        telefono: 'No especificado',
                        asunto: 'Convocatorias',
                        mensaje: '¿Cuándo son las próximas convocatorias para el módulo M2 - Física?',
                        fecha_envio: '2026-07-06 12:15:00',
                        leido: false,
                        respondido: false,
                        respuesta_admin: null,
                        fecha_respuesta: null
                    }
                ];
                setConsultas(ejemplos);
                localStorage.setItem('aerotraining_consultas_web', JSON.stringify(ejemplos));
            }
        } catch (error) {
            console.error('Error cargando consultas:', error);
            setConsultas([]);
        }
        setLoading(false);
    };

    const eliminarConsulta = (id) => {
        if (window.confirm('⚠️ ¿Eliminar esta consulta permanentemente?')) {
            const todas = JSON.parse(localStorage.getItem('aerotraining_consultas_web') || '[]');
            const nuevas = todas.filter(c => c.id !== id);
            localStorage.setItem('aerotraining_consultas_web', JSON.stringify(nuevas));
            setConsultas(nuevas);
            setMensajeFeedback({ texto: '🗑️ Consulta eliminada', tipo: 'success' });
            setTimeout(() => setMensajeFeedback({ texto: '', tipo: '' }), 3000);
        }
    };

    const marcarLeido = (id) => {
        const todas = JSON.parse(localStorage.getItem('aerotraining_consultas_web') || '[]');
        const actualizadas = todas.map(c => 
            c.id === id ? { ...c, leido: true } : c
        );
        localStorage.setItem('aerotraining_consultas_web', JSON.stringify(actualizadas));
        setConsultas(actualizadas);
        setMensajeFeedback({ texto: '✅ Marcado como leído', tipo: 'success' });
        setTimeout(() => setMensajeFeedback({ texto: '', tipo: '' }), 2000);
    };

    const verDetalle = (id) => {
        navigate(`/admin/consulta-web/${id}`);
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

    const totalConsultas = consultas.length;
    const noLeidas = consultas.filter(c => !c.leido).length;
    const pendientes = consultas.filter(c => !c.respondido).length;
    const respondidas = consultas.filter(c => c.respondido).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="text-4xl animate-spin">✈️</div>
                    <p className="mt-4 text-gray-500">Cargando consultas web...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {mensajeFeedback.texto && (
                <div className={`p-4 rounded-xl border-l-4 ${
                    mensajeFeedback.tipo === 'success' ? 'bg-green-50 border-green-500 text-green-700' :
                    mensajeFeedback.tipo === 'error' ? 'bg-red-50 border-red-500 text-red-700' :
                    'bg-blue-50 border-blue-500 text-blue-700'
                }`}>
                    {mensajeFeedback.texto}
                </div>
            )}

            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-[#0c2340]">
                    <i className="fas fa-globe text-[#20c997] mr-2"></i>
                    Consultas desde la Web
                </h2>
                <button
                    onClick={cargarConsultas}
                    className="bg-[#17a2b8] hover:bg-[#138496] text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2"
                >
                    <i className="fas fa-sync-alt"></i> Actualizar
                </button>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-2xl font-bold text-[#0c2340]">{totalConsultas}</p>
                    <p className="text-sm text-gray-500">Total consultas</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-yellow-400">
                    <p className="text-2xl font-bold text-yellow-600">{noLeidas}</p>
                    <p className="text-sm text-gray-500">No leídas</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-400">
                    <p className="text-2xl font-bold text-orange-600">{pendientes}</p>
                    <p className="text-sm text-gray-500">Pendientes respuesta</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-green-400">
                    <p className="text-2xl font-bold text-green-600">{respondidas}</p>
                    <p className="text-sm text-gray-500">Respondidas</p>
                </div>
            </div>

            {/* Lista de consultas */}
            {consultas.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="text-6xl mb-4">🌐</div>
                    <h3 className="text-xl font-bold text-[#0c2340]">No hay consultas web</h3>
                    <p className="text-gray-500 mt-2">Todavía no se ha recibido ninguna consulta desde el formulario web.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {consultas.map((consulta) => (
                        <div 
                            key={consulta.id} 
                            className={`bg-white rounded-2xl shadow-sm border-l-4 ${
                                !consulta.leido ? 'border-yellow-400 bg-yellow-50/30' :
                                consulta.respondido ? 'border-green-500' : 'border-gray-200'
                            } border border-gray-100 p-5 hover:shadow-md transition`}
                        >
                            <div className="flex justify-between items-start flex-wrap gap-2 mb-3">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <span className="font-bold text-[#0c2340]">
                                        <i className="fas fa-user mr-1"></i> {consulta.nombre}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        <i className="fas fa-envelope mr-1"></i> {consulta.email}
                                    </span>
                                    {consulta.telefono && consulta.telefono !== 'No especificado' && (
                                        <span className="text-sm text-gray-500">
                                            <i className="fas fa-phone mr-1"></i> {consulta.telefono}
                                        </span>
                                    )}
                                    <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
                                        {consulta.asunto}
                                    </span>
                                    {!consulta.leido && (
                                        <span className="bg-yellow-400 text-yellow-800 text-xs font-semibold px-2 py-0.5 rounded-full animate-pulse">
                                            🔴 Nuevo
                                        </span>
                                    )}
                                    {consulta.respondido ? (
                                        <span className="bg-green-500 text-white text-xs font-semibold px-3 py-0.5 rounded-full">
                                            ✅ Respondido
                                        </span>
                                    ) : (
                                        <span className="bg-orange-400 text-white text-xs font-semibold px-3 py-0.5 rounded-full">
                                            ⏳ Pendiente
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs text-gray-400">
                                    <i className="far fa-calendar-alt mr-1"></i>
                                    {formatearFecha(consulta.fecha_envio)}
                                </span>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 mb-3">
                                <p className="text-sm font-semibold text-gray-600 mb-1">
                                    <i className="fas fa-comment mr-1"></i> Mensaje:
                                </p>
                                <p className="text-gray-800">{consulta.mensaje}</p>
                            </div>

                            {consulta.respondido && consulta.respuesta_admin && (
                                <div className="bg-green-50 rounded-xl p-4 mb-3 border-l-4 border-green-500">
                                    <p className="text-sm font-semibold text-green-700 mb-1">
                                        <i className="fas fa-reply-all mr-1"></i> Respuesta del administrador:
                                    </p>
                                    <p className="text-gray-800">{consulta.respuesta_admin}</p>
                                    {consulta.fecha_respuesta && (
                                        <p className="text-xs text-gray-400 mt-1">
                                            <i className="far fa-calendar-alt mr-1"></i>
                                            Respondido el {formatearFecha(consulta.fecha_respuesta)}
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-2 flex-wrap">
                                {!consulta.respondido && (
                                    <button
                                        onClick={() => verDetalle(consulta.id)}
                                        className="bg-[#20c997] hover:bg-[#1a9e7a] text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2"
                                    >
                                        <i className="fas fa-reply"></i> Responder
                                    </button>
                                )}
                                {!consulta.leido && (
                                    <button
                                        onClick={() => marcarLeido(consulta.id)}
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2"
                                    >
                                        <i className="fas fa-check"></i> Marcar como leído
                                    </button>
                                )}
                                <button
                                    onClick={() => eliminarConsulta(consulta.id)}
                                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2"
                                >
                                    <i className="fas fa-trash-alt"></i> Eliminar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminConsultasWeb;