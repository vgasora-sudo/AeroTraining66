// src/pages/admin/AdminTareasConvocatoria.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

const AdminTareasConvocatoria = () => {
    const [convocatorias, setConvocatorias] = useState([]);
    const [alumnos, setAlumnos] = useState([]);
    const [confirmaciones, setConfirmaciones] = useState({});
    const [listaEspera, setListaEspera] = useState({});
    const [tareas, setTareas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

    // Estado para el formulario de nueva tarea (asociada a una convocatoria)
    const [nuevaTarea, setNuevaTarea] = useState({
        titulo: '',
        descripcion: '',
        convocatoria_id: ''
    });
    const [mostrarFormulario, setMostrarFormulario] = useState(null); // convId o null

    // Estado para controlar qué convocatorias muestran la lista de alumnos
    const [convocatoriasVisibles, setConvocatoriasVisibles] = useState(new Set());

    // 🆕 Estado para controlar qué semanas están expandidas
    const [semanasExpandidas, setSemanasExpandidas] = useState({});

    // ============================================================
    // Función para obtener semana y rango
    // ============================================================
    const getWeekInfo = (dateStr) => {
        const d = new Date(dateStr);
        d.setHours(0, 0, 0, 0);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        
        const formatDate = (date) => {
            return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
        };
        
        return {
            key: `${monday.toISOString().split('T')[0]}`,
            label: `${formatDate(monday)} - ${formatDate(sunday)}`,
            monday: monday,
            sunday: sunday
        };
    };

    // ============================================================
    // Cargar datos al montar
    // ============================================================
    useEffect(() => {
        cargarDatos();
    }, []);

    // ============================================================
    // Funciones de carga
    // ============================================================
    const cargarDatos = async () => {
        try {
            setLoading(true);
            setMensaje({ texto: '🔄 Actualizando datos...', tipo: 'info' });

            const { data: convData, error: convError } = await supabase
                .from('convocatorias')
                .select('*')
                .order('fecha', { ascending: true })
                .order('hora_inicio', { ascending: true });

            if (convError) throw convError;
            setConvocatorias(convData || []);

            const { data: alumnosData, error: alumnosError } = await supabase
                .from('alumnos')
                .select('*')
                .order('nombre', { ascending: true });

            if (alumnosError) throw alumnosError;
            setAlumnos(alumnosData || []);

            const { data: confData, error: confError } = await supabase
                .from('inscripciones_convocatorias')
                .select('*')
                .in('estado', ['Inscrito', 'En espera']);

            if (confError) throw confError;

            const confirmacionesMap = {};
            const esperaMap = {};
            if (confData) {
                confData.forEach(ins => {
                    if (ins.en_espera) {
                        if (!esperaMap[ins.convocatoria_id]) {
                            esperaMap[ins.convocatoria_id] = [];
                        }
                        esperaMap[ins.convocatoria_id].push(ins.alumno_id);
                    } else {
                        if (!confirmacionesMap[ins.convocatoria_id]) {
                            confirmacionesMap[ins.convocatoria_id] = [];
                        }
                        confirmacionesMap[ins.convocatoria_id].push(ins.alumno_id);
                    }
                });
            }
            setConfirmaciones(confirmacionesMap);
            setListaEspera(esperaMap);

            const { data: tareasData, error: tareasError } = await supabase
                .from('tareas_convocatoria')
                .select('*')
                .order('orden', { ascending: true });

            if (tareasError) throw tareasError;
            setTareas(tareasData || []);

            setMensaje({ texto: '✅ Datos actualizados correctamente', tipo: 'success' });
        } catch (error) {
            console.error('Error cargando datos:', error);
            setMensaje({ texto: '❌ Error al cargar datos: ' + error.message, tipo: 'error' });
        } finally {
            setLoading(false);
            setTimeout(() => {
                if (mensaje.tipo !== 'error') {
                    setMensaje({ texto: '', tipo: '' });
                }
            }, 3000);
        }
    };

    // ============================================================
    // Funciones para alumnos
    // ============================================================
    const getAlumnosConvocatoria = (convId) => {
        const ids = confirmaciones[convId] || [];
        return alumnos.filter(a => ids.includes(a.id));
    };

    const getListaEsperaConvocatoria = (convId) => {
        const ids = listaEspera[convId] || [];
        return alumnos.filter(a => ids.includes(a.id));
    };

    const getPlazasOcupadas = (convId) => {
        return (confirmaciones[convId] || []).length;
    };

    // ============================================================
    // CRUD de tareas
    // ============================================================
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!nuevaTarea.titulo.trim()) {
            setMensaje({ texto: '⚠️ El título es obligatorio', tipo: 'error' });
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
            return;
        }
        if (!nuevaTarea.convocatoria_id) {
            setMensaje({ texto: '⚠️ Selecciona el módulo al que pertenece la tarea', tipo: 'error' });
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
            return;
        }

        try {
            setLoading(true);
            const tareasConv = tareas.filter(t => t.convocatoria_id === nuevaTarea.convocatoria_id);
            const maxOrden = tareasConv.reduce((max, t) => Math.max(max, t.orden || 0), 0);
            const nueva = {
                convocatoria_id: nuevaTarea.convocatoria_id,
                titulo: nuevaTarea.titulo.trim(),
                descripcion: nuevaTarea.descripcion.trim() || null,
                completada: false,
                orden: maxOrden + 1
            };

            const { error } = await supabase.from('tareas_convocatoria').insert([nueva]);
            if (error) throw error;

            setMensaje({ texto: '✅ Tarea añadida correctamente', tipo: 'success' });
            setNuevaTarea({ titulo: '', descripcion: '', convocatoria_id: '' });
            setMostrarFormulario(null);
            await cargarDatos();
        } catch (error) {
            console.error('Error añadiendo tarea:', error);
            setMensaje({ texto: '❌ Error al añadir tarea: ' + error.message, tipo: 'error' });
        } finally {
            setLoading(false);
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
        }
    };

    const toggleCompletada = async (tareaId, completadaActual) => {
        try {
            const { error } = await supabase
                .from('tareas_convocatoria')
                .update({ completada: !completadaActual })
                .eq('id', tareaId);

            if (error) throw error;
            setTareas(prev =>
                prev.map(t => t.id === tareaId ? { ...t, completada: !completadaActual } : t)
            );
        } catch (error) {
            console.error('Error actualizando tarea:', error);
            setMensaje({ texto: '❌ Error al actualizar tarea', tipo: 'error' });
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
        }
    };

    const eliminarTarea = async (tareaId) => {
        if (!window.confirm('¿Eliminar esta tarea?')) return;
        try {
            const { error } = await supabase
                .from('tareas_convocatoria')
                .delete()
                .eq('id', tareaId);

            if (error) throw error;
            setMensaje({ texto: '🗑️ Tarea eliminada', tipo: 'success' });
            await cargarDatos();
        } catch (error) {
            console.error('Error eliminando tarea:', error);
            setMensaje({ texto: '❌ Error al eliminar tarea', tipo: 'error' });
        } finally {
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
        }
    };

    const moverTarea = async (tareaId, direccion) => {
        const tarea = tareas.find(t => t.id === tareaId);
        if (!tarea) return;
        const tareasConv = tareas.filter(t => t.convocatoria_id === tarea.convocatoria_id);
        const index = tareasConv.findIndex(t => t.id === tareaId);
        if ((direccion === 'up' && index === 0) || (direccion === 'down' && index === tareasConv.length - 1)) return;

        const nuevaPosicion = direccion === 'up' ? index - 1 : index + 1;
        const tareaActual = tareasConv[index];
        const tareaDestino = tareasConv[nuevaPosicion];

        try {
            await supabase
                .from('tareas_convocatoria')
                .update({ orden: tareaDestino.orden })
                .eq('id', tareaActual.id);

            await supabase
                .from('tareas_convocatoria')
                .update({ orden: tareaActual.orden })
                .eq('id', tareaDestino.id);

            await cargarDatos();
        } catch (error) {
            console.error('Error moviendo tarea:', error);
            setMensaje({ texto: '❌ Error al reordenar', tipo: 'error' });
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
        }
    };

    // ============================================================
    // Obtener tareas de una convocatoria
    // ============================================================
    const getTareasPorConvocatoria = (convId) => {
        return tareas.filter(t => t.convocatoria_id === convId);
    };

    // ============================================================
    // Obtener total de tareas de una semana
    // ============================================================
    const getTareasPorSemana = (semana) => {
        const idsConvocatorias = semana.convocatorias.map(c => c.id);
        return tareas.filter(t => idsConvocatorias.includes(t.convocatoria_id));
    };

    // ============================================================
    // Agrupar convocatorias por semana y ordenar por módulo
    // ============================================================
    const agruparPorSemanas = (convocatorias) => {
        const grupos = {};
        convocatorias.forEach(conv => {
            const weekInfo = getWeekInfo(conv.fecha);
            const key = weekInfo.key;
            if (!grupos[key]) {
                grupos[key] = {
                    ...weekInfo,
                    convocatorias: []
                };
            }
            grupos[key].convocatorias.push(conv);
        });

        const sortedKeys = Object.keys(grupos).sort((a, b) => {
            return grupos[a].monday - grupos[b].monday;
        });

        sortedKeys.forEach(key => {
            grupos[key].convocatorias.sort((a, b) => {
                const numA = parseInt(a.modulo_id.replace('M', ''));
                const numB = parseInt(b.modulo_id.replace('M', ''));
                return numA - numB;
            });
        });

        return sortedKeys.map(key => grupos[key]);
    };

    // ============================================================
    // Toggle semana
    // ============================================================
    const toggleSemana = (key) => {
        setSemanasExpandidas(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const semanasAgrupadas = agruparPorSemanas(convocatorias);

    // ============================================================
    // RENDER
    // ============================================================
    if (loading && convocatorias.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="text-4xl animate-spin">✈️</div>
                    <p className="mt-4 text-gray-500">Cargando datos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h2 className="text-xl font-bold text-[#0c2340]">
                    <i className="fas fa-tasks text-[#20c997] mr-2"></i>
                    Tareas por Semana
                </h2>
                <button
                    onClick={cargarDatos}
                    disabled={loading}
                    className="bg-[#007bff] hover:bg-[#0056b3] text-white px-4 py-2 rounded-xl font-semibold text-sm transition flex items-center gap-2 disabled:opacity-50"
                >
                    <i className={`fas fa-sync ${loading ? 'animate-spin' : ''}`}></i>
                    {loading ? 'Cargando...' : 'Recargar datos'}
                </button>
            </div>

            {mensaje.texto && (
                <div className={`p-4 rounded-xl border-l-4 ${
                    mensaje.tipo === 'success' ? 'bg-green-50 border-green-500 text-green-700' :
                    mensaje.tipo === 'error' ? 'bg-red-50 border-red-500 text-red-700' :
                    'bg-blue-50 border-blue-500 text-blue-700'
                }`}>
                    {mensaje.texto}
                </div>
            )}

            {convocatorias.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="text-6xl mb-4">📅</div>
                    <h3 className="text-xl font-bold text-[#0c2340]">No hay convocatorias</h3>
                    <p className="text-gray-500 mt-2">Crea una convocatoria desde el panel de gestión.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {semanasAgrupadas.map((semana, idx) => {
                        const totalConvs = semana.convocatorias.length;
                        const tareasSemana = getTareasPorSemana(semana);
                        const totalTareas = tareasSemana.length;
                        const key = semana.key;
                        const isExpanded = semanasExpandidas[key] || false;

                        return (
                            <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                {/* Encabezado de semana con botón toggle */}
                                <button
                                    onClick={() => toggleSemana(key)}
                                    className="w-full text-left px-6 py-3 bg-gray-50 hover:bg-gray-100 transition flex justify-between items-center border-b border-gray-200"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg font-bold text-[#0c2340]">
                                            📅 Semana del {semana.label}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            ({totalConvs} convocatorias)
                                        </span>
                                        {/* 🆕 Badge de tareas */}
                                        {totalTareas > 0 && (
                                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#20c997] text-white text-xs font-semibold rounded-full shadow-sm">
                                                <i className="fas fa-check-circle"></i>
                                                {totalTareas} tarea{totalTareas > 1 ? 's' : ''}
                                            </span>
                                        )}
                                        {totalTareas === 0 && (
                                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-200 text-gray-500 text-xs font-semibold rounded-full">
                                                <i className="fas fa-circle"></i>
                                                Sin tareas
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xl text-gray-400">
                                        {isExpanded ? '▲' : '▼'}
                                    </span>
                                </button>

                                {/* Contenido de la semana (visible si está expandida) */}
                                {isExpanded && (
                                    <div className="divide-y divide-gray-100">
                                        {semana.convocatorias.map(conv => {
                                            const tareasConv = getTareasPorConvocatoria(conv.id);
                                            const completadas = tareasConv.filter(t => t.completada).length;
                                            const ocupadas = getPlazasOcupadas(conv.id);
                                            const enEspera = (listaEspera[conv.id] || []).length;
                                            const disponibles = (conv.plazas_totales || 10) - ocupadas;

                                            return (
                                                <div key={conv.id} className="p-4 hover:bg-gray-50 transition">
                                                    <div className="flex flex-wrap justify-between items-start gap-4">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-3 flex-wrap">
                                                                <span className="text-lg font-bold text-[#0c2340]">
                                                                    {conv.modulo_id} - {conv.modulo_id}
                                                                </span>
                                                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                                                    {conv.hora_inicio} - {conv.hora_fin}
                                                                </span>
                                                                <span className="text-xs text-gray-500">
                                                                    📅 {new Date(conv.fecha).toLocaleDateString('es-ES')}
                                                                </span>
                                                                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                                                                    {tareasConv.length} tareas · {completadas} completadas
                                                                </span>
                                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                                                    🎟️ {disponibles} plazas
                                                                </span>
                                                                {enEspera > 0 && (
                                                                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                                                                        ⏳ {enEspera} en espera
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {conv.descripcion && (
                                                                <p className="text-sm text-gray-500 mt-1">{conv.descripcion}</p>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    setConvocatoriasVisibles(prev => {
                                                                        const newSet = new Set(prev);
                                                                        if (newSet.has(conv.id)) {
                                                                            newSet.delete(conv.id);
                                                                        } else {
                                                                            newSet.add(conv.id);
                                                                        }
                                                                        return newSet;
                                                                    });
                                                                }}
                                                                className="bg-[#6c757d] hover:bg-[#5a6268] text-white px-3 py-1.5 rounded-lg text-sm transition flex items-center gap-1"
                                                            >
                                                                <i className="fas fa-list"></i> 
                                                                {convocatoriasVisibles.has(conv.id) ? 'Ocultar alumnos' : 'Ver alumnos'}
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setMostrarFormulario(mostrarFormulario === conv.id ? null : conv.id);
                                                                    if (mostrarFormulario !== conv.id) {
                                                                        setNuevaTarea({ titulo: '', descripcion: '', convocatoria_id: conv.id });
                                                                    }
                                                                }}
                                                                className="bg-[#20c997] hover:bg-[#0c2340] text-white px-4 py-2 rounded-xl font-semibold text-sm transition"
                                                            >
                                                                {mostrarFormulario === conv.id ? 'Cancelar' : '➕ Añadir tarea'}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Lista de alumnos desplegable */}
                                                    {convocatoriasVisibles.has(conv.id) && (
                                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                                            <div className="grid md:grid-cols-2 gap-4">
                                                                <div>
                                                                    <h5 className="font-semibold text-sm text-green-700 mb-2">
                                                                        ✅ Confirmados ({getAlumnosConvocatoria(conv.id).length})
                                                                    </h5>
                                                                    <div className="space-y-1 max-h-48 overflow-y-auto">
                                                                        {getAlumnosConvocatoria(conv.id).map(a => (
                                                                            <div key={a.id} className="text-sm text-gray-700 flex justify-between border-b border-gray-100 py-1">
                                                                                <span>{a.nombre} {a.apellido || ''}</span>
                                                                                <span className="text-xs text-gray-500">{a.documento || 'Sin DNI'}</span>
                                                                            </div>
                                                                        ))}
                                                                        {getAlumnosConvocatoria(conv.id).length === 0 && (
                                                                            <p className="text-sm text-gray-400">No hay confirmados</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <h5 className="font-semibold text-sm text-yellow-700 mb-2">
                                                                        ⏳ En espera ({getListaEsperaConvocatoria(conv.id).length})
                                                                    </h5>
                                                                    <div className="space-y-1 max-h-48 overflow-y-auto">
                                                                        {getListaEsperaConvocatoria(conv.id).map(a => (
                                                                            <div key={a.id} className="text-sm text-gray-700 flex justify-between border-b border-gray-100 py-1">
                                                                                <span>{a.nombre} {a.apellido || ''}</span>
                                                                                <span className="text-xs text-gray-500">{a.documento || 'Sin DNI'}</span>
                                                                            </div>
                                                                        ))}
                                                                        {getListaEsperaConvocatoria(conv.id).length === 0 && (
                                                                            <p className="text-sm text-gray-400">No hay alumnos en espera</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Formulario para añadir tarea (si está visible) */}
                                                    {mostrarFormulario === conv.id && (
                                                        <form onSubmit={handleSubmit} className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                                            <div className="flex flex-wrap gap-3">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Título de la tarea *"
                                                                    value={nuevaTarea.titulo}
                                                                    onChange={(e) => setNuevaTarea({ ...nuevaTarea, titulo: e.target.value })}
                                                                    className="flex-1 min-w-[200px] px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997]"
                                                                    required
                                                                />
                                                                <input
                                                                    type="text"
                                                                    placeholder="Descripción (opcional)"
                                                                    value={nuevaTarea.descripcion}
                                                                    onChange={(e) => setNuevaTarea({ ...nuevaTarea, descripcion: e.target.value })}
                                                                    className="flex-1 min-w-[200px] px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997]"
                                                                />
                                                                <button
                                                                    type="submit"
                                                                    disabled={loading}
                                                                    className="bg-[#20c997] hover:bg-[#0c2340] text-white px-6 py-2 rounded-xl font-semibold transition"
                                                                >
                                                                    <i className="fas fa-plus mr-1"></i> Añadir
                                                                </button>
                                                            </div>
                                                        </form>
                                                    )}

                                                    {/* Lista de tareas de esta convocatoria */}
                                                    {tareasConv.length > 0 && (
                                                        <div className="mt-3 pl-4 space-y-1.5 border-l-2 border-gray-200">
                                                            {tareasConv.map((tarea) => (
                                                                <div key={tarea.id} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition">
                                                                    <button
                                                                        onClick={() => toggleCompletada(tarea.id, tarea.completada)}
                                                                        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition ${
                                                                            tarea.completada
                                                                                ? 'bg-[#20c997] border-[#20c997] text-white'
                                                                                : 'border-gray-300 hover:border-[#20c997]'
                                                                        }`}
                                                                    >
                                                                        {tarea.completada && <i className="fas fa-check text-xs"></i>}
                                                                    </button>
                                                                    <span className={`text-sm flex-1 ${tarea.completada ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                                                        {tarea.titulo}
                                                                    </span>
                                                                    {tarea.descripcion && (
                                                                        <span className="text-xs text-gray-400 hidden sm:inline">{tarea.descripcion}</span>
                                                                    )}
                                                                    <div className="flex gap-0.5">
                                                                        <button
                                                                            onClick={() => moverTarea(tarea.id, 'up')}
                                                                            disabled={tareasConv.indexOf(tarea) === 0}
                                                                            className="p-1 text-gray-400 hover:text-[#20c997] disabled:opacity-30"
                                                                        >
                                                                            <i className="fas fa-chevron-up text-xs"></i>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => moverTarea(tarea.id, 'down')}
                                                                            disabled={tareasConv.indexOf(tarea) === tareasConv.length - 1}
                                                                            className="p-1 text-gray-400 hover:text-[#20c997] disabled:opacity-30"
                                                                        >
                                                                            <i className="fas fa-chevron-down text-xs"></i>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => eliminarTarea(tarea.id)}
                                                                            className="p-1 text-red-400 hover:text-red-600"
                                                                        >
                                                                            <i className="fas fa-trash text-xs"></i>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AdminTareasConvocatoria;
