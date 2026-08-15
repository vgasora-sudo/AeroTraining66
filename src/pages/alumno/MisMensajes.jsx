// src/pages/alumno/MisMensajes.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MisMensajes = () => {
    const navigate = useNavigate();
    const [mensajes, setMensajes] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem('aerotraining_user') || 'null');

    useEffect(() => {
        cargarMensajes();
    }, []);

    const cargarMensajes = () => {
        try {
            const data = localStorage.getItem('aerotraining_mensajes');
            console.log('📦 Datos en localStorage:', data);
            
            if (data) {
                const todos = JSON.parse(data);
                console.log('📋 Todos los mensajes:', todos);
                
                if (Array.isArray(todos)) {
                    // Filtrar mensajes del alumno actual
                    const misMensajes = todos.filter(m => 
                        m.alumno_usuario === user?.username
                    );
                    console.log('📋 Mis mensajes:', misMensajes);
                    
                    // Ordenar por fecha (más reciente primero)
                    misMensajes.sort((a, b) => new Date(b.fecha_envio) - new Date(a.fecha_envio));
                    setMensajes(misMensajes);
                } else {
                    setMensajes([]);
                }
            } else {
                console.log('📭 No hay mensajes guardados');
                setMensajes([]);
            }
        } catch (error) {
            console.error('❌ Error cargando mensajes:', error);
            setMensajes([]);
        }
        setLoading(false);
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
                    <p className="mt-4 text-gray-500">Cargando mensajes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-[#0c2340] flex items-center gap-2">
                    <i className="fas fa-envelope text-[#20c997]"></i>
                    Mis Mensajes
                    <span className="text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {mensajes.length} total
                    </span>
                </h1>
                <button
                    onClick={() => navigate('/contactar-tutor')}
                    className="bg-[#20c997] hover:bg-[#1a9e7a] text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2"
                >
                    <i className="fas fa-plus-circle"></i> Nueva consulta
                </button>
            </div>

            {mensajes.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="text-6xl mb-4">📭</div>
                    <h3 className="text-xl font-bold text-[#0c2340]">No tienes mensajes</h3>
                    <p className="text-gray-500 mt-2">Tus consultas al tutor aparecerán aquí.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {mensajes.map((msg) => (
                        <div 
                            key={msg.id} 
                            className={`bg-white rounded-2xl shadow-sm border-l-4 ${
                                msg.respondido ? 'border-green-500' : 'border-yellow-400'
                            } border border-gray-100 p-5 hover:shadow-md transition`}
                        >
                            <div className="flex justify-between items-start flex-wrap gap-2 mb-3">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
                                        {msg.categoria}
                                    </span>
                                    {msg.respondido ? (
                                        <span className="bg-green-500 text-white text-xs font-semibold px-3 py-0.5 rounded-full">
                                            ✅ Respondido
                                        </span>
                                    ) : (
                                        <span className="bg-yellow-400 text-yellow-800 text-xs font-semibold px-3 py-0.5 rounded-full">
                                            ⏳ Pendiente
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs text-gray-400">
                                    <i className="far fa-calendar-alt mr-1"></i>
                                    {formatearFecha(msg.fecha_envio)}
                                </span>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 mb-3">
                                <p className="text-sm font-semibold text-gray-600 mb-1">
                                    <i className="fas fa-comment mr-1"></i> Tu consulta:
                                </p>
                                <p className="text-gray-800">{msg.mensaje}</p>
                            </div>

                            {msg.respondido && msg.respuesta_admin && (
                                <div className="bg-green-50 rounded-xl p-4 mb-3 border-l-4 border-green-500">
                                    <p className="text-sm font-semibold text-green-700 mb-1">
                                        <i className="fas fa-reply-all mr-1"></i> Respuesta del tutor:
                                    </p>
                                    <p className="text-gray-800">{msg.respuesta_admin}</p>
                                    {msg.fecha_respuesta && (
                                        <p className="text-xs text-gray-400 mt-1">
                                            <i className="far fa-calendar-alt mr-1"></i>
                                            Respondido el {formatearFecha(msg.fecha_respuesta)}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MisMensajes;