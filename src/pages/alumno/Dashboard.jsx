// src/pages/alumno/Dashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabase';

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({
        total_modulos: 0,
        aprobados: 0,
        horas_estudio: 48,
        convocatorias: []
    });
    const [modulosVisibles, setModulosVisibles] = useState([]);
    const [loading, setLoading] = useState(true);

    // Estados para inscripciones
    const [inscritoEn, setInscritoEn] = useState([]);
    const [enEspera, setEnEspera] = useState([]);
    const [alumnoId, setAlumnoId] = useState(null);
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

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
            semana: `${formatDate(monday)} - ${formatDate(sunday)}`,
            monday: monday,
            sunday: sunday
        };
    };

    // ============================================================
    // Agrupar convocatorias por semana
    // ============================================================
   const agruparPorSemanas = (convocatorias) => {
    const grupos = {};
    convocatorias.forEach(conv => {
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

            // 1. Obtener usuario logueado
            const userData = JSON.parse(localStorage.getItem('aerotraining_user') || 'null');
            if (!userData) {
                setLoading(false);
                return;
            }
            setUser(userData);

            // 2. Buscar alumno en Supabase
            let { data: alumno, error: alumnoError } = await supabase
                .from('alumnos')
                .select('*')
                .eq('username', userData.username)
                .maybeSingle();

            if (alumnoError || !alumno) {
                const { data: alumnoEmail, error: emailError } = await supabase
                    .from('alumnos')
                    .select('*')
                    .eq('email', userData.email)
                    .maybeSingle();
                
                if (emailError || !alumnoEmail) {
                    console.warn('Alumno no encontrado');
                    setLoading(false);
                    return;
                }
                alumno = alumnoEmail;
            }

            setAlumnoId(alumno.id);

            // 3. Obtener módulos del alumno
            const habilitados = alumno.habilitados || [];
            const progreso = alumno.progreso || {};

            const modulos = habilitados.map(id => {
                const estado = progreso[id] || {};
                return {
                    id: id,
                    nombre: nombresModulos[id] || id,
                    cursando: estado.cursando || false,
                    aprobado: estado.aprobado || false,
                    fecha: estado.fecha_aprobacion || ''
                };
            });

            modulos.sort((a, b) => {
                const numA = parseInt(a.id.replace('M', ''));
                const numB = parseInt(b.id.replace('M', ''));
                return numA - numB;
            });

            setModulosVisibles(modulos);
            const aprobados = modulos.filter(m => m.aprobado === true).length;

            // 4. Obtener convocatorias del alumno (TODAS, sin filtrar por fecha)
            const { data: convocatorias, error: convError } = await supabase
                .from('convocatorias')
                .select('*')
                .in('modulo_id', habilitados)
                .order('fecha', { ascending: true });

            if (convError) {
                console.error('Error cargando convocatorias:', convError);
            }

            // 5. Obtener inscripciones del alumno
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

            // 6. Actualizar estado
            setStats({
                total_modulos: habilitados.length,
                aprobados: aprobados,
                horas_estudio: 48,
                convocatorias: convocatorias || []
            });

        } catch (error) {
            console.error('Error cargando dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // Funciones de inscripción (igual que en Convocatorias.jsx)
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
    // Agrupar convocatorias para mostrar
    // ============================================================
    const semanasAgrupadas = agruparPorSemanas(stats.convocatorias);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="text-4xl animate-spin">✈️</div>
                    <p className="mt-4 text-gray-500">Cargando tu dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Saludo */}
            <div className="bg-gradient-to-r from-[#0a1a2f] to-[#0c2340] rounded-2xl p-6 text-white">
                <h1 className="text-2xl font-bold">
                    ¡Hola, {user?.nombre || 'Alumno'}! 👋
                </h1>
                <p className="text-gray-300 mt-2">
                    Bienvenido a tu panel de control. Aquí tienes un resumen de tu progreso.
                </p>
            </div>

            {/* Mensajes de feedback */}
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

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">📚</span>
                        <div>
                            <p className="text-2xl font-bold text-[#0c2340]">
                                {stats.total_modulos}
                            </p>
                            <p className="text-sm text-gray-500">Módulos totales</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-[#20c997] p-6">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">✅</span>
                        <div>
                            <p className="text-2xl font-bold text-[#20c997]">
                                {stats.aprobados}
                            </p>
                            <p className="text-sm text-gray-500">Aprobados</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-blue-500 p-6">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">⏱️</span>
                        <div>
                            <p className="text-2xl font-bold text-blue-500">
                                {stats.horas_estudio}h
                            </p>
                            <p className="text-sm text-gray-500">Horas de estudio</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-orange-500 p-6">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">📅</span>
                        <div>
                            <p className="text-2xl font-bold text-orange-500">
                                {stats.convocatorias.length}
                            </p>
                            <p className="text-sm text-gray-500">Próximas convocatorias</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ============================================================ */}
            {/* MEDALLAS DE MÓDULOS (igual que antes) */}
            {/* ============================================================ */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-[#0c2340]">
                        🏆 Mis Módulos
                    </h2>
                    <div className="flex gap-3 text-sm">
                        <span className="flex items-center gap-1">
                            <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block"></span>
                            {stats.aprobados} aprobados
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-3 h-3 rounded-full bg-gray-300 inline-block"></span>
                            {stats.total_modulos - stats.aprobados} pendientes
                        </span>
                    </div>
                </div>

                {modulosVisibles.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <div className="text-6xl mb-4">📭</div>
                        <p className="text-lg font-semibold">No tienes módulos asignados</p>
                        <p className="text-sm mt-1">Contacta con Jefatura para que te asignen módulos.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {modulosVisibles.map((modulo) => {
                            const esAprobado = modulo.aprobado === true;

                            return (
                                <div
                                    key={modulo.id}
                                    className={`flex flex-col items-center p-4 rounded-2xl transition-all duration-300 ${
                                        esAprobado
                                            ? 'bg-gradient-to-b from-yellow-50 to-yellow-100 border-2 border-yellow-400 shadow-lg hover:shadow-xl hover:-translate-y-1'
                                            : 'bg-gray-50 border-2 border-gray-200 hover:shadow-md hover:-translate-y-1'
                                    }`}
                                >
                                    <div className={`relative w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold transition-all duration-300 ${
                                        esAprobado
                                            ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-white shadow-lg shadow-yellow-400/50'
                                            : 'bg-gray-300 text-gray-500'
                                    }`}>
                                        {modulo.id.replace('M', '')}
                                        {esAprobado && (
                                            <span className="absolute -top-1 -right-1 text-lg">⭐</span>
                                        )}
                                    </div>

                                    <p className={`text-xs font-medium mt-2 text-center ${
                                        esAprobado ? 'text-[#0c2340]' : 'text-gray-500'
                                    }`}>
                                        {modulo.nombre}
                                    </p>

                                    <span className={`text-xs font-semibold mt-1 px-2 py-0.5 rounded-full ${
                                        esAprobado
                                            ? 'bg-yellow-400 text-white'
                                            : 'bg-gray-200 text-gray-500'
                                    }`}>
                                        {esAprobado ? '✅ Aprobado' : '⏳ Pendiente'}
                                    </span>

                                    {esAprobado && modulo.fecha && (
                                        <span className="text-xs text-gray-500 mt-1">
                                            📅 {modulo.fecha}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ============================================================ */}
            {/* CONVOCATORIAS EN LISTA POR SEMANAS */}
            {/* ============================================================ */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-[#0c2340]">
                        📅 Convocatorias Disponibles
                    </h2>
                    <Link to="/convocatorias" className="text-sm text-[#20c997] hover:underline">
                        Ver todas →
                    </Link>
                </div>

                {stats.convocatorias.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <p>No hay convocatorias disponibles para tus módulos.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {semanasAgrupadas.map((semana, idx) => (
                            <div key={idx}>
                                {/* Encabezado de semana */}
                                <div className="px-6 py-2 bg-gray-50/80 border-b border-gray-100">
                                    <h3 className="text-sm font-semibold text-gray-600">
                                        📅 Semana del {semana.semana}
                                    </h3>
                                </div>

                                {/* Convocatorias de la semana */}
                                {semana.convocatorias.map((conv) => {
                                    const estaInscrito = inscritoEn.includes(conv.id);
                                    const estaEnEspera = enEspera.includes(conv.id);
                                    const plazas = conv.plazas_disponibles ?? conv.plazas_totales ?? 10;
                                    const nombreModulo = nombresModulos[conv.modulo_id] || conv.modulo_id;
                                    const hayPlazas = plazas > 0;

                                    return (
                                        <div key={conv.id} className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 hover:bg-gray-50 transition">
                                            {/* Información */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <span className="text-lg font-bold text-[#0c2340]">
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

                                            {/* Botones */}
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
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
