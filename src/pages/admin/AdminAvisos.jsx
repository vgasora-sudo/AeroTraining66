// src/pages/admin/AdminAvisos.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

const AdminAvisos = () => {
    const [avisos, setAvisos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
    const [formData, setFormData] = useState({
        titulo: '',
        contenido: '',
        tipo: 'general',
        para_todos: true,
        alumno_id: ''
    });
    const [editandoId, setEditandoId] = useState(null);
    const [alumnos, setAlumnos] = useState([]);

    useEffect(() => {
        cargarAvisos();
        cargarAlumnos();
    }, []);

    const cargarAlumnos = async () => {
        try {
            const { data, error } = await supabase
                .from('alumnos')
                .select('id, nombre, username')
                .order('nombre', { ascending: true });

            if (error) throw error;
            setAlumnos(data || []);
        } catch (error) {
            console.error('Error cargando alumnos:', error);
        }
    };

    const cargarAvisos = async () => {
        try {
            setLoading(true);
            
            const { data, error } = await supabase
                .from('avisos')
                .select('*')
                .order('fecha', { ascending: false });

            if (error) throw error;

            if (data && data.length > 0) {
                setAvisos(data);
            } else {
                // Crear avisos de ejemplo
                const ejemplos = [
                    {
                        titulo: 'Próximas convocatorias',
                        contenido: '26/06/2026 - Modulo 1 - 08:00 - 10:00\n26/06/2026 - Modulo 2 - 10:00 - 11:30',
                        tipo: 'general',
                        para_todos: true,
                        fecha: new Date().toISOString(),
                        leido: false
                    },
                    {
                        titulo: 'Nueva convocatoria 15/06/2026',
                        contenido: 'Se ha abierto una nueva convocatoria para el módulo M3.',
                        tipo: 'convocatoria',
                        para_todos: true,
                        fecha: new Date(Date.now() - 86400000 * 7).toISOString(),
                        leido: false
                    }
                ];

                for (const ejemplo of ejemplos) {
                    await supabase.from('avisos').insert([ejemplo]);
                }

                const { data: nuevosData } = await supabase
                    .from('avisos')
                    .select('*')
                    .order('fecha', { ascending: false });

                setAvisos(nuevosData || []);
            }
        } catch (error) {
            console.error('Error cargando avisos:', error);
            setAvisos([]);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    // ✅ HANDLE SUBMIT CORREGIDO
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.titulo || !formData.contenido) {
            setMensaje({ texto: '⚠️ Todos los campos son obligatorios', tipo: 'error' });
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
            return;
        }

        try {
            const avisoData = {
                titulo: formData.titulo,
                contenido: formData.contenido,
                tipo: formData.tipo || 'general',
                para_todos: formData.para_todos !== undefined ? formData.para_todos : true,
                fecha: new Date().toISOString(),
                leido: false
            };

            if (!formData.para_todos && formData.alumno_id) {
                avisoData.alumno_id = formData.alumno_id;
            }

            console.log('📤 Guardando aviso:', avisoData);

            if (editandoId) {
                const { error } = await supabase
                    .from('avisos')
                    .update(avisoData)
                    .eq('id', editandoId);

                if (error) throw error;
                setMensaje({ texto: '✅ Aviso actualizado correctamente', tipo: 'success' });
                setEditandoId(null);
            } else {
                const { error } = await supabase
                    .from('avisos')
                    .insert([avisoData]);

                if (error) throw error;
                setMensaje({ texto: '✅ Aviso publicado correctamente', tipo: 'success' });
            }

            setFormData({ titulo: '', contenido: '', tipo: 'general', para_todos: true, alumno_id: '' });
            await cargarAvisos();

        } catch (error) {
            console.error('Error guardando aviso:', error);
            setMensaje({ texto: '❌ Error al guardar el aviso: ' + error.message, tipo: 'error' });
        } finally {
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
        }
    };

    const eliminarAviso = async (id) => {
        if (window.confirm('⚠️ ¿Eliminar este aviso permanentemente?')) {
            try {
                const { error } = await supabase
                    .from('avisos')
                    .delete()
                    .eq('id', id);

                if (error) throw error;
                setMensaje({ texto: '🗑️ Aviso eliminado', tipo: 'success' });
                await cargarAvisos();
            } catch (error) {
                console.error('Error eliminando aviso:', error);
                setMensaje({ texto: '❌ Error al eliminar el aviso', tipo: 'error' });
            } finally {
                setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
            }
        }
    };

    const editarAviso = (id) => {
        const aviso = avisos.find(a => a.id === id);
        if (aviso) {
            setFormData({
                titulo: aviso.titulo,
                contenido: aviso.contenido,
                tipo: aviso.tipo || 'general',
                para_todos: aviso.para_todos !== undefined ? aviso.para_todos : true,
                alumno_id: aviso.alumno_id || ''
            });
            setEditandoId(id);
            window.scrollTo({ top: 0, behavior: 'smooth' });
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

    const getNombreAlumno = (alumnoId) => {
        if (!alumnoId) return 'Todos';
        const alumno = alumnos.find(a => a.id === alumnoId);
        return alumno ? alumno.nombre : 'Desconocido';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="text-4xl animate-spin">✈️</div>
                    <p className="mt-4 text-gray-500">Cargando avisos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {mensaje.texto && (
                <div className={`p-4 rounded-xl border-l-4 ${
                    mensaje.tipo === 'success' ? 'bg-green-50 border-green-500 text-green-700' :
                    mensaje.tipo === 'error' ? 'bg-red-50 border-red-500 text-red-700' :
                    'bg-blue-50 border-blue-500 text-blue-700'
                }`}>
                    {mensaje.texto}
                </div>
            )}

            {/* FORMULARIO */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-[#0c2340] mb-4">
                    <i className="fas fa-bullhorn text-[#20c997] mr-2"></i>
                    {editandoId ? '✏️ Editar aviso' : 'Publicar aviso'}
                </h2>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Título del aviso</label>
                        <input
                            type="text"
                            name="titulo"
                            value={formData.titulo}
                            onChange={handleChange}
                            placeholder="Ej: Próximas convocatorias"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997]"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Contenido del aviso</label>
                        <textarea
                            name="contenido"
                            value={formData.contenido}
                            onChange={handleChange}
                            rows="4"
                            placeholder="Escribe aquí el contenido del aviso..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997]"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo</label>
                            <select
                                name="tipo"
                                value={formData.tipo}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] bg-white"
                            >
                                <option value="general">General</option>
                                <option value="importante">Importante</option>
                                <option value="convocatoria">Convocatoria</option>
                                <option value="recordatorio">Recordatorio</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Destinatario</label>
                            <label className="flex items-center gap-2 mt-2">
                                <input
                                    type="checkbox"
                                    name="para_todos"
                                    checked={formData.para_todos}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-[#20c997] focus:ring-[#20c997]"
                                />
                                Todos los alumnos
                            </label>
                        </div>
                    </div>

                    {!formData.para_todos && (
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Alumno específico</label>
                            <select
                                name="alumno_id"
                                value={formData.alumno_id}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] bg-white"
                            >
                                <option value="">Seleccionar alumno...</option>
                                {alumnos.map(a => (
                                    <option key={a.id} value={a.id}>{a.nombre} ({a.username})</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            type="submit"
                            className="bg-gradient-to-r from-[#20c997] to-[#0c2340] text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition flex items-center gap-2"
                        >
                            <i className="fas fa-paper-plane"></i>
                            {editandoId ? 'Actualizar aviso' : 'Publicar aviso'}
                        </button>
                        {editandoId && (
                            <button
                                type="button"
                                onClick={() => {
                                    setEditandoId(null);
                                    setFormData({ titulo: '', contenido: '', tipo: 'general', para_todos: true, alumno_id: '' });
                                }}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold transition"
                            >
                                Cancelar
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* LISTA DE AVISOS */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-[#0c2340]">
                        <i className="fas fa-history mr-2"></i>
                        Avisos recientes
                    </h3>
                    <span className="text-sm bg-gray-100 px-3 py-1 rounded-full text-gray-600">
                        {avisos.length} avisos
                    </span>
                </div>

                {avisos.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <div className="text-6xl mb-4">📢</div>
                        <p>No hay avisos publicados</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {avisos.map((aviso) => (
                            <div
                                key={aviso.id}
                                className="bg-gray-50 rounded-xl p-4 border-l-4 border-[#20c997] hover:shadow-md transition"
                            >
                                <div className="flex justify-between items-start flex-wrap gap-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h4 className="font-bold text-[#0c2340]">{aviso.titulo}</h4>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                aviso.tipo === 'importante' ? 'bg-red-100 text-red-700' :
                                                aviso.tipo === 'convocatoria' ? 'bg-blue-100 text-blue-700' :
                                                aviso.tipo === 'recordatorio' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-gray-200 text-gray-600'
                                            }`}>
                                                {aviso.tipo || 'general'}
                                            </span>
                                            {aviso.para_todos ? (
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Para todos</span>
                                            ) : (
                                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                                    {getNombreAlumno(aviso.alumno_id)}
                                                </span>
                                            )}
                                            {!aviso.leido && (
                                                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">🔴 Nuevo</span>
                                            )}
                                        </div>
                                        <p className="text-gray-700 mt-1 whitespace-pre-line">{aviso.contenido}</p>
                                        <span className="text-xs text-gray-400 mt-2 block">
                                            <i className="far fa-calendar-alt mr-1"></i>
                                            {formatearFecha(aviso.fecha)}
                                        </span>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => editarAviso(aviso.id)}
                                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                                        >
                                            <i className="fas fa-edit"></i> Editar
                                        </button>
                                        <button
                                            onClick={() => eliminarAviso(aviso.id)}
                                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                                        >
                                            <i className="fas fa-trash"></i> Eliminar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminAvisos;
