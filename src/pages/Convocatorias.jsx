// src/pages/Convocatorias.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';

const Convocatorias = () => {
    const [convocatorias, setConvocatorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
    const [inscritoEn, setInscritoEn] = useState([]);
    const [alumnoId, setAlumnoId] = useState(null);
    const [enEspera, setEnEspera] = useState([]);
    const user = JSON.parse(localStorage.getItem('aerotraining_user') || 'null');

    const nombresModulos = {
        'M1': 'Matemáticas',
        'M2': 'Física',
        'M3': 'Electricidad',
        'M4': 'Electrónica',
        'M5': 'Tec. Digitales',
        'M6': 'Materiales',
        'M7': 'Prácticas Mant.',
        'M8': 'Aerodinámica',
        'M9': 'Factores Humanos',
        'M10': 'Legislación',
        'M11': 'Estructuras Avión',
        'M12': 'Helicópteros',
        'M13': 'Aviónica',
        'M14': 'Propulsión',
        'M15': 'Turbinas',
        'M16': 'Alternativos',
        'M17': 'Hélices'
    };

    // ============================================================
    // Función para obtener número de semana y rango
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
            semana: `${formatDate(monday)} - ${formatDate(sunday)}`,
            monday: monday,
            sunday: sunday
        };
    };

    // ============================================================
    // Agrupar convocatorias por semana y ordenar por módulo dentro de cada semana
    // ============================================================
    const agruparPorSemanas = (convocatoriasArray) => {
        // Si no hay convocatorias o no es un array, devolver array vacío
        if (!convocatoriasArray || !Array.isArray(convocatoriasArray) || convocatoriasArray.length === 0) {
            return [];
        }

        const grupos = {};
        convocatoriasArray.forEach(conv => {
            const weekInfo = getWeekInfo(conv.fecha);
            const key = weekInfo.semana;
            if (!grupos[key]) {
                grupos[key] = {
                    ...weekInfo,
                    convocatorias: []
                };
            }
            grupos[key].convocatorias.push(conv);
        });

        // Ordenar las semanas por fecha
        const sortedKeys = Object.keys(grupos).sort((a, b) => {
            return grupos[a].monday - grupos[b].monday;
        });

        // Para cada semana, ordenar sus convocatorias por módulo (M1, M2, M3...)
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
    // Carga de datos
    // ============================================================
    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setLoading(true);

            // 1. Obtener TODAS las convocatorias
            const { data: convs, error } = await supabase
                .from('convocatorias')
                .select('*')
                .order('fecha', { ascending: true });

            if (error) throw error;
            setConvocatorias(convs || []);

            // 2. Obtener ID del alumno
            if (user?.username) {
                const { data: alumno, error: alumnoError } = await supabase
                    .from('alumnos')
                    .select('id, habilitados')
                    .eq('username', user.username)
                    .maybeSingle();

                if (alumnoError) {
                    console.error('Error buscando alumno:', alumnoError);
                }

                if (alumno) {
                    setAlumnoId(alumno.id);
                    
                    // 3. Obtener inscripciones activas del alumno
                    const { data: inscripciones, error: inscError } = await supabase
                        .from('inscripciones_convocatorias')
                        .select('convocatoria_id, en_espera, estado')
                        .eq('alumno_id', alumno.id)
                        .in('estado', ['Inscrito', 'En espera']);

                    if (inscError) {
                        console.error('Error buscando inscripciones:', inscError);
                    }

                    if (inscripciones) {
                        const inscritos = inscripciones
                            .filter(i => i.estado === 'Inscrito')
                            .map(i => i.convocatoria_id);
                        setInscritoEn(inscritos);

                        const espera = inscripciones
                            .filter(i => i.estado === 'En espera')
                            .map(i => i.convocatoria_id);
                        setEnEspera(espera);
                    }
                } else {
                    console.warn('Alumno no encontrado para username:', user.username);
                }
            } else {
                console.warn('No hay usuario logueado');
            }

        } catch (error) {
            console.error('Error cargando datos:', error);
            setMensaje({ texto: '❌ Error al cargar los datos', tipo: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // Inscribirse / Cancelar
    // ============================================================
    const inscribirse = async (convId) => {
        try {
            if (inscritoEn.includes(convId) || enEspera.includes(convId)) {
                setMensaje({ texto: '⚠️ Ya estás inscrito o en lista de espera', tipo: 'error' });
                setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
                return;
            }

            if (!alumnoId) {
                setMensaje({ texto: '❌ No se encontró tu perfil', tipo: 'error' });
                setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
                return;
            }

            const { data, error } = await supabase.rpc('inscribir_alumno', {
                p_convocatoria_id: convId,
                p_alumno_id: alumnoId
            });

            if (error) {
                console.error('Error en RPC:', error);
                setMensaje({ texto: '❌ Error al inscribirte: ' + error.message, tipo: 'error' });
                return;
            }

            if (data && data.success) {
                if (data.en_espera) {
                    setMensaje({ 
                        texto: `📋 Te has apuntado a la lista de espera (Posición ${data.orden})`, 
                        tipo: 'info' 
                    });
                    setEnEspera([...enEspera, convId]);
                } else {
                    setMensaje({ texto: '✅ Inscrito correctamente', tipo: 'success' });
                    setInscritoEn([...inscritoEn, convId]);
                }
                
                await cargarDatos();
            } else {
                setMensaje({ texto: '❌ ' + (data?.mensaje || 'Error al inscribirte'), tipo: 'error' });
            }

        } catch (error) {
            console.error('Error al inscribirse:', error);
            setMensaje({ texto: '❌ Error al inscribirte: ' + error.message, tipo: 'error' });
        } finally {
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 4000);
        }
    };

    const cancelar = async (convId) => {
        if (!confirm('¿Cancelar inscripción?')) return;

        try {
            if (!alumnoId) {
                setMensaje({ texto: '❌ No se encontró tu perfil', tipo: 'error' });
                return;
            }

            const { data, error } = await supabase.rpc('cancelar_inscripcion', {
                p_convocatoria_id: convId,
                p_alumno_id: alumnoId
            });

            if (error) {
                console.error('Error en RPC:', error);
                setMensaje({ texto: '❌ Error al cancelar: ' + error.message, tipo: 'error' });
                return;
            }

            if (data && data.success) {
                setInscritoEn(inscritoEn.filter(id => id !== convId));
                setEnEspera(enEspera.filter(id => id !== convId));
                
                if (data.reasignado) {
                    setMensaje({ 
                        texto: '🗑️ Cancelado. Un alumno de la lista de espera ha ocupado tu plaza.', 
                        tipo: 'success' 
                    });
                } else {
                    setMensaje({ texto: '🗑️ Cancelado correctamente', tipo: 'success' });
                }
                
                await cargarDatos();
            }

        } catch (error) {
            console.error('Error al cancelar:', error);
            setMensaje({ texto: '❌ Error al cancelar', tipo: 'error' });
        } finally {
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
        }
    };

    const formatearFecha = (fechaStr) => {
        try {
            const fecha = new Date(fechaStr);
            return fecha.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch {
            return fechaStr;
        }
    };

    // ============================================================
    // Agrupar convocatorias (PASAMOS EL ESTADO)
    // ============================================================
    const semanasAgrupadas = agruparPorSemanas(convocatorias);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="text-4xl animate-spin">📅</div>
                    <p className="mt-4 text-gray-500">Cargando convocatorias...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Cabecera */}
            <div className="bg-gradient-to-r from-[#0a1a2f] to-[#0c2340] rounded-2xl p-6 text-white">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <i className="fas fa-calendar-check text-[#20c997]"></i>
                    Mis Convocatorias
                </h1>
                <p className="text-gray-300 text-sm mt-1">
                    {convocatorias.length} convocatorias disponibles
                </p>
            </div>

            {mensaje.texto && (
                <div className={`p-4 rounded-xl border-l-4 ${
                    mensaje.tipo === 'success' 
                        ? 'bg-green-50 border-green-500 text-green-700' 
                        : mensaje.tipo === 'error'
                        ? 'bg-red-50 border-red-500 text-red-700'
                        : 'bg-blue-50 border-blue-500 text-blue-700'
                }`}>
                    {mensaje.texto}
                </div>
            )}

            {convocatorias.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="text-6xl mb-4">📅</div>
                    <h3 className="text-xl font-bold text-[#0c2340]">No hay convocatorias disponibles</h3>
                </div>
            ) : semanasAgrupadas.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="text-6xl mb-4">📅</div>
                    <h3 className="text-xl font-bold text-[#0c2340]">No hay convocatorias en las próximas semanas</h3>
                </div>
            ) : (
                <div className="space-y-8">
                    {semanasAgrupadas.map((semana, idx) => (
                        <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            {/* Encabezado de semana */}
                            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                                <h2 className="text-lg font-bold text-[#0c2340]">
                                    📅 Semana del {semana.semana}
                                </h2>
                                <span className="text-sm text-gray-500">
                                    {semana.convocatorias.length} convocatorias
                                </span>
                            </div>

                            {/* Lista de convocatorias de la semana */}
                            <div className="divide-y divide-gray-100">
                                {semana.convocatorias.map((conv) => {
                                    const estaInscrito = inscritoEn.includes(conv.id);
                                    const estaEnEspera = enEspera.includes(conv.id);
                                    const plazas = conv.plazas_disponibles ?? conv.plazas_totales ?? 10;
                                    const nombreModulo = nombresModulos[conv.modulo_id] || conv.modulo_id;
                                    const hayPlazas = plazas > 0;

                                    return (
                                        <div key={conv.id} className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 hover:bg-gray-50 transition">
                                            {/* Información del módulo */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <span className="text-xl font-bold text-[#0c2340]">
                                                        {conv.modulo_id} - {nombreModulo}
                                                    </span>
                                                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                                                        hayPlazas ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                        {hayPlazas ? '🟢 Activo' : '🔴 Sesión completa'}
                                                    </span>
                                                    {estaInscrito && (
                                                        <span className="text-xs bg-green-500 text-white px-3 py-1 rounded-full font-bold">
                                                            ✅ Inscrito
                                                        </span>
                                                    )}
                                                    {estaEnEspera && (
                                                        <span className="text-xs bg-yellow-500 text-white px-3 py-1 rounded-full font-bold">
                                                            ⏳ En espera
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-600">
                                                    <span>📅 {formatearFecha(conv.fecha)}</span>
                                                    {conv.hora_inicio && (
                                                        <span>🕐 {conv.hora_inicio} - {conv.hora_fin || ''}</span>
                                                    )}
                                                    <span>🎟️ {plazas} plazas disponibles</span>
                                                </div>
                                                {conv.descripcion && (
                                                    <p className="text-sm text-gray-500 mt-1">{conv.descripcion}</p>
                                                )}
                                            </div>

                                            {/* Botones de acción */}
                                            <div className="mt-3 sm:mt-0 flex-shrink-0">
                                                {estaInscrito ? (
                                                    <button
                                                        onClick={() => cancelar(conv.id)}
                                                        className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl font-semibold transition"
                                                    >
                                                        Cancelar
                                                    </button>
                                                ) : estaEnEspera ? (
                                                    <button
                                                        onClick={() => cancelar(conv.id)}
                                                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-xl font-semibold transition"
                                                    >
                                                        Cancelar (espera)
                                                    </button>
                                                ) : (
                                                    <>
                                                        {hayPlazas ? (
                                                            <button
                                                                onClick={() => inscribirse(conv.id)}
                                                                className="bg-gradient-to-r from-[#20c997] to-[#0c2340] hover:shadow-lg text-white px-8 py-2 rounded-xl font-semibold transition"
                                                            >
                                                                ✅ Apuntarse
                                                            </button>
                                                        ) : (
                                                            <div className="flex gap-2">
                                                                <button
                                                                    disabled
                                                                    className="bg-gray-300 text-gray-500 px-6 py-2 rounded-xl font-semibold cursor-not-allowed"
                                                                >
                                                                    📋 Lleno
                                                                </button>
                                                                <Link
                                                                    to="/contactar-tutor"
                                                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold transition text-center"
                                                                >
                                                                    📞 Contactar
                                                                </Link>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Convocatorias;
