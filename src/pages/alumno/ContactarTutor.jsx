// src/pages/alumno/ContactarTutor.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const ContactarTutor = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        categoria: '',
        mensaje: ''
    });
    const [loading, setLoading] = useState(false);
    const [mensajeResultado, setMensajeResultado] = useState({ texto: '', tipo: '' });
    const [conversacion, setConversacion] = useState([]);
    const chatEndRef = useRef(null);

    const user = JSON.parse(localStorage.getItem('aerotraining_user') || 'null');

    useEffect(() => {
        cargarConversacion();
        const interval = setInterval(cargarConversacion, 10000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversacion]);

    const cargarConversacion = () => {
        try {
            const data = localStorage.getItem('aerotraining_mensajes');
            if (data) {
                const todos = JSON.parse(data);
                if (Array.isArray(todos)) {
                    const userData = JSON.parse(localStorage.getItem('aerotraining_user') || 'null');
                    
                    // Marcar como leídos los mensajes del alumno actual
                    const actualizados = todos.map(m => {
                        if (m.alumno_usuario === userData?.username && m.respondido && m.leido === false) {
                            return { ...m, leido: true };
                        }
                        return m;
                    });
                    localStorage.setItem('aerotraining_mensajes', JSON.stringify(actualizados));
                    
                    // Filtrar mensajes del alumno actual
                    const misMensajes = actualizados.filter(m => 
                        m.alumno_usuario === userData?.username
                    );
                    misMensajes.sort((a, b) => new Date(a.fecha_envio) - new Date(b.fecha_envio));
                    setConversacion(misMensajes);
                }
            }
        } catch (error) {
            console.error('Error cargando conversación:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.categoria || !formData.mensaje.trim()) {
            setMensajeResultado({
                texto: '⚠️ Por favor, selecciona una categoría y escribe tu consulta',
                tipo: 'error'
            });
            setTimeout(() => setMensajeResultado({ texto: '', tipo: '' }), 4000);
            return;
        }

        setLoading(true);

        let mensajes = [];
        const stored = localStorage.getItem('aerotraining_mensajes');
        if (stored) {
            try {
                mensajes = JSON.parse(stored);
                if (!Array.isArray(mensajes)) {
                    mensajes = [];
                }
            } catch (e) {
                mensajes = [];
            }
        }

        const nuevoMensaje = {
            id: Date.now(),
            alumno_nombre: user?.nombre || 'Alumno',
            alumno_usuario: user?.username || 'alumno',
            alumno_email: user?.email || 'No disponible',
            categoria: formData.categoria,
            mensaje: formData.mensaje,
            fecha_envio: new Date().toISOString().replace('T', ' ').slice(0, 16),
            leido: false,
            respondido: false,
            respuesta_admin: null,
            fecha_respuesta: null
        };

        mensajes.push(nuevoMensaje);
        localStorage.setItem('aerotraining_mensajes', JSON.stringify(mensajes));

        setConversacion([...conversacion, nuevoMensaje]);

        setMensajeResultado({
            texto: '✅ Mensaje enviado correctamente',
            tipo: 'success'
        });

        setFormData({ categoria: '', mensaje: '' });
        setLoading(false);

        setTimeout(() => setMensajeResultado({ texto: '', tipo: '' }), 3000);
    };

    const eliminarMensaje = (id) => {
        if (window.confirm('⚠️ ¿Eliminar este mensaje permanentemente?')) {
            const stored = localStorage.getItem('aerotraining_mensajes');
            if (stored) {
                let mensajes = JSON.parse(stored);
                mensajes = mensajes.filter(m => m.id !== id);
                localStorage.setItem('aerotraining_mensajes', JSON.stringify(mensajes));
            }
            const nuevaConversacion = conversacion.filter(m => m.id !== id);
            setConversacion(nuevaConversacion);
            setMensajeResultado({
                texto: '🗑️ Mensaje eliminado correctamente',
                tipo: 'success'
            });
            setTimeout(() => setMensajeResultado({ texto: '', tipo: '' }), 3000);
        }
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

    const getInitials = (nombre) => {
        if (!nombre) return '?';
        return nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const mensajesNoLeidos = conversacion.filter(m => 
        m.respondido && m.respuesta_admin && m.leido === false
    ).length;

    return (
        <div className="max-w-4xl mx-auto px-4"> {/* Cambiado max-w-3xl a max-w-4xl y añadido px-4 */}
            {/* TÍTULO */}
            <div className="mb-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-[#0c2340] flex items-center gap-2">
                            <i className="fas fa-headset text-[#20c997]"></i>
                            Contactar con el tutor
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Respuesta en menos de 24 horas
                        </p>
                    </div>
                    {mensajesNoLeidos > 0 && (
                        <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full animate-pulse">
                            {mensajesNoLeidos} 🔴
                        </span>
                    )}
                </div>
            </div>

            {/* MENSAJE DE FEEDBACK */}
            {mensajeResultado.texto && (
                <div className={`p-4 rounded-xl border-l-4 mb-6 ${
                    mensajeResultado.tipo === 'success' 
                        ? 'bg-green-50 border-green-500 text-green-700' 
                        : 'bg-red-50 border-red-500 text-red-700'
                }`}>
                    {mensajeResultado.texto}
                </div>
            )}

            {/* ============================================================ */}
            {/* FORMULARIO - MÁS ANCHO */}
            {/* ============================================================ */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <i className="fas fa-tag text-[#20c997] mr-2"></i>
                            Categoría de la consulta
                        </label>
                        <select
                            name="categoria"
                            value={formData.categoria}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] focus:ring-2 focus:ring-[#20c997]/20 transition bg-white"
                            required
                            disabled={loading}
                        >
                            <option value="">-- Selecciona una categoría --</option>
                            <option value="Convocatorias">📅 Convocatorias</option>
                            <option value="Clases">📺 Clases del Campus</option>
                            <option value="Manuales">📚 Manuales y Temarios</option>
                            <option value="Exámenes">📝 Exámenes y Evaluaciones</option>
                            <option value="Soporte Técnico">🔧 Soporte Técnico</option>
                            <option value="Otro">❓ Otra consulta</option>
                        </select>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <i className="fas fa-comment-dots text-[#20c997] mr-2"></i>
                            Tu consulta
                        </label>
                        <textarea
                            name="mensaje"
                            value={formData.mensaje}
                            onChange={handleChange}
                            rows="5"
                            placeholder="Escribe aquí tu consulta de forma clara y detallada..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] focus:ring-2 focus:ring-[#20c997]/20 transition resize-none"
                            required
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-[#20c997] to-[#0c2340] text-white py-4 rounded-xl font-bold text-base hover:shadow-lg hover:shadow-[#20c997]/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin">⏳</span>
                                Enviando...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-paper-plane"></i>
                                Enviar consulta
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* ============================================================ */}
            {/* HISTORIAL DE CONVERSACIÓN - MÁS ANCHO */}
            {/* ============================================================ */}
            <div className="mt-8">
                <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-lg font-bold text-[#0c2340]">
                        <i className="fas fa-history text-[#20c997] mr-2"></i>
                        Historial de conversación
                    </h2>
                    <span className="text-sm text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                        {conversacion.length} mensajes
                    </span>
                    <button
                        onClick={cargarConversacion}
                        className="text-sm text-[#20c997] hover:underline ml-auto flex items-center gap-1"
                    >
                        <i className="fas fa-sync-alt"></i> Actualizar
                    </button>
                </div>

                {conversacion.length === 0 ? (
                    <div className="bg-gray-50 rounded-2xl p-8 text-center border-2 border-dashed border-gray-200">
                        <div className="text-5xl mb-3">💬</div>
                        <p className="text-gray-500">No hay mensajes aún</p>
                        <p className="text-sm text-gray-400 mt-1">Envía tu primera consulta para iniciar la conversación</p>
                    </div>
                ) : (
                    <div className="bg-gray-50 rounded-2xl p-4 max-h-96 overflow-y-auto border border-gray-100">
                        <div className="space-y-4">
                            {conversacion.map((msg) => {
                                const esAlumno = msg.alumno_usuario === user?.username;
                                const esRespuesta = msg.respondido && msg.respuesta_admin;
                                const esNuevo = msg.respondido && msg.respuesta_admin && msg.leido === false;
                                
                                return (
                                    <div key={msg.id} className={`flex gap-3 ${esNuevo ? 'bg-yellow-50/50 -mx-2 px-2 py-2 rounded-xl border border-yellow-200' : ''}`}>
                                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                            esAlumno ? 'bg-[#20c997]' : 'bg-[#0c2340]'
                                        }`}>
                                            {esAlumno ? getInitials(msg.alumno_nombre) : 'T'}
                                        </div>

                                        <div className="flex-1">
                                            <div className={`rounded-xl p-4 ${
                                                esAlumno 
                                                    ? 'bg-white border border-gray-200' 
                                                    : 'bg-[#0c2340] text-white'
                                            }`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`font-semibold text-sm ${
                                                            esAlumno ? 'text-[#0c2340]' : 'text-[#20c997]'
                                                        }`}>
                                                            {esAlumno ? msg.alumno_nombre : '👨‍🏫 Tutor'}
                                                        </span>
                                                        {esNuevo && (
                                                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                                                                🔴 Nuevo
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className={`text-xs ${
                                                        esAlumno ? 'text-gray-400' : 'text-gray-400'
                                                    }`}>
                                                        {formatearFecha(msg.fecha_envio)}
                                                    </span>
                                                </div>
                                                
                                                <p className={`text-sm ${esAlumno ? 'text-gray-700' : 'text-gray-200'}`}>
                                                    {msg.mensaje}
                                                </p>

                                                {esRespuesta && (
                                                    <div className={`mt-3 pt-3 border-t ${
                                                        esAlumno ? 'border-gray-200' : 'border-gray-600'
                                                    }`}>
                                                        <span className="text-xs font-semibold text-[#20c997]">
                                                            <i className="fas fa-reply-all mr-1"></i> Respuesta:
                                                        </span>
                                                        <p className={`text-sm mt-1 ${
                                                            esAlumno ? 'text-gray-700' : 'text-gray-200'
                                                        }`}>
                                                            {msg.respuesta_admin}
                                                        </p>
                                                        {msg.fecha_respuesta && (
                                                            <span className="text-xs text-gray-400 mt-1 block">
                                                                Respondido el {formatearFecha(msg.fecha_respuesta)}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {msg.respondido ? (
                                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                                            ✅ Respondido
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                                                            ⏳ Pendiente
                                                        </span>
                                                    )}
                                                    {msg.categoria && (
                                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                                            {msg.categoria}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex gap-2 mt-1 ml-1">
                                                <button
                                                    onClick={() => eliminarMensaje(msg.id)}
                                                    className="text-xs text-red-400 hover:text-red-600 font-medium transition"
                                                >
                                                    🗑️ Eliminar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={chatEndRef} />
                        </div>
                    </div>
                )}
            </div>

            {/* INFORMACIÓN ADICIONAL */}
            <div className="mt-6 flex flex-wrap gap-6 justify-center text-xs text-gray-400">
                <div className="flex items-center gap-2">
                    <i className="fas fa-clock text-[#20c997]"></i>
                    Respuesta en menos de 24h
                </div>
                <div className="flex items-center gap-2">
                    <i className="fas fa-envelope text-[#20c997]"></i>
                    Notificación por email
                </div>
                <div className="flex items-center gap-2">
                    <i className="fas fa-lock text-[#20c997]"></i>
                    100% confidencial
                </div>
            </div>
        </div>
    );
};

export default ContactarTutor;