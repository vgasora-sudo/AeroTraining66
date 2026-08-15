// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAvisosPopup, setShowAvisosPopup] = useState(false);
    const [avisosNuevos, setAvisosNuevos] = useState([]);
    const [modulosVisibles, setModulosVisibles] = useState([]);
    const [stats, setStats] = useState({
        total_modulos: 0,
        aprobados: 0,
        pendientes: 0,
        horas_estudio: 48,
        convocatorias: []
    });

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

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                // 🔥 1. Obtener usuario desde localStorage (guardado en Login)
                const userData = JSON.parse(localStorage.getItem('aerotraining_user') || 'null');
                if (!userData) {
                    console.log('No hay usuario logueado');
                    setLoading(false);
                    return;
                }

                console.log('Usuario logueado:', userData);
                setUser(userData);

                // 🔥 2. Buscar el alumno en Supabase por username (o email)
                let { data: perfil, error } = await supabase
                    .from('alumnos')
                    .select('*')
                    .eq('username', userData.username)
                    .maybeSingle();

                // Si no encuentra por username, buscar por email
                if (!perfil) {
                    const { data: perfilEmail, error: errorEmail } = await supabase
                        .from('alumnos')
                        .select('*')
                        .eq('email', userData.email)
                        .maybeSingle();
                    perfil = perfilEmail;
                    error = errorEmail;
                }

                if (error) {
                    console.error('Error buscando perfil:', error);
                    setLoading(false);
                    return;
                }

                if (!perfil) {
                    console.log('Alumno no encontrado en Supabase');
                    setLoading(false);
                    return;
                }

                console.log('Perfil encontrado:', perfil);

                // 🔥 3. Cargar módulos desde el perfil (habilitados y progreso)
                const progreso = perfil.progreso || {};
                const habilitados = perfil.habilitados || [];

                // Construir lista de módulos visibles
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

                // Ordenar módulos por número
                modulos.sort((a, b) => {
                    const numA = parseInt(a.id.replace('M', ''));
                    const numB = parseInt(b.id.replace('M', ''));
                    return numA - numB;
                });

                setModulosVisibles(modulos);

                // Calcular estadísticas
                const aprobados = modulos.filter(m => m.aprobado === true).length;
                const pendientes = modulos.filter(m => m.aprobado !== true).length;

                setStats(prev => ({
                    ...prev,
                    total_modulos: modulos.length,
                    aprobados: aprobados,
                    pendientes: pendientes
                }));

                // 🔥 4. Cargar avisos (opcional)
                const { data: avisosData } = await supabase
                    .from('avisos')
                    .select('*')
                    .eq('alumno_id', perfil.id)
                    .eq('leido', false)
                    .order('fecha', { ascending: false });

                if (avisosData && avisosData.length > 0) {
                    setAvisosNuevos(avisosData);
                    setShowAvisosPopup(true);
                }

                // 🔥 5. Cargar convocatorias (opcional)
                const { data: convData } = await supabase
                    .from('convocatorias')
                    .select('*')
                    .eq('alumno_id', perfil.id)
                    .order('fecha', { ascending: true });

                if (convData && convData.length > 0) {
                    setStats(prev => ({
                        ...prev,
                        convocatorias: convData.map(c => ({
                            modulo: c.modulo || c.modulo_id,
                            fecha: c.fecha,
                            plazas: c.plazas || 'Disponible'
                        }))
                    }));
                }

            } catch (error) {
                console.error('Error cargando dashboard:', error);
            } finally {
                setLoading(false);
            }
        };

        cargarDatos();
    }, []);

    const cerrarPopup = async () => {
        setShowAvisosPopup(false);
        try {
            for (const aviso of avisosNuevos) {
                await supabase
                    .from('avisos')
                    .update({ leido: true })
                    .eq('id', aviso.id);
            }
            setAvisosNuevos([]);
        } catch (error) {
            console.error('Error marcando avisos:', error);
        }
    };

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
            {showAvisosPopup && avisosNuevos.length > 0 && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
                        <div className="bg-gradient-to-r from-[#0c2340] to-[#1a3a5c] p-5 rounded-t-2xl text-white flex justify-between items-center sticky top-0">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">📢</span>
                                <div>
                                    <h3 className="text-xl font-bold">¡Nuevos Avisos!</h3>
                                    <p className="text-sm text-gray-300">{avisosNuevos.length} aviso(s) sin leer</p>
                                </div>
                            </div>
                            <button onClick={cerrarPopup} className="bg-white/10 hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center text-xl">✕</button>
                        </div>
                        <div className="p-5 space-y-4">
                            {avisosNuevos.map((aviso) => (
                                <div key={aviso.id} className="bg-gray-50 rounded-xl p-4 border-l-4 border-[#20c997]">
                                    <h4 className="font-bold text-[#0c2340]">{aviso.titulo}</h4>
                                    <p className="text-gray-700 mt-1 whitespace-pre-line text-sm">{aviso.contenido}</p>
                                    <span className="text-xs text-gray-400 mt-2 block">
                                        {new Date(aviso.fecha).toLocaleString('es-ES', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                            <button onClick={cerrarPopup} className="w-full bg-gradient-to-r from-[#20c997] to-[#0c2340] text-white py-3 rounded-xl font-semibold hover:shadow-lg transition">
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Saludo */}
            <div className="bg-gradient-to-r from-[#0a1a2f] to-[#0c2340] rounded-2xl p-6 text-white">
                <h1 className="text-2xl font-bold">
                    ¡Hola, {user?.nombre || 'Alumno'}! 👋
                </h1>
                <p className="text-gray-300 mt-2">
                    Bienvenido a tu panel de control. Aquí tienes un resumen de tu progreso.
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="text-3xl mb-2">📚</div>
                    <p className="text-2xl font-bold text-[#0c2340]">{stats.total_modulos}</p>
                    <p className="text-gray-500 text-sm">Módulos totales</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#20c997]">
                    <div className="text-3xl mb-2">✅</div>
                    <p className="text-2xl font-bold text-[#20c997]">{stats.aprobados}</p>
                    <p className="text-gray-500 text-sm">Aprobados</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-500">
                    <div className="text-3xl mb-2">⏱️</div>
                    <p className="text-2xl font-bold text-blue-500">{stats.horas_estudio}h</p>
                    <p className="text-gray-500 text-sm">Horas de estudio</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-500">
                    <div className="text-3xl mb-2">📅</div>
                    <p className="text-2xl font-bold text-orange-500">{stats.convocatorias.length}</p>
                    <p className="text-gray-500 text-sm">Próximas convocatorias</p>
                </div>
            </div>

            {/* Módulos */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-[#0c2340]">🏆 Mis Módulos</h2>
                    <div className="flex gap-3 text-sm">
                        <span className="flex items-center gap-1">
                            <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block"></span>
                            {stats.aprobados} aprobados
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-3 h-3 rounded-full bg-gray-300 inline-block"></span>
                            {stats.pendientes} pendientes
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
                                <div key={modulo.id} className={`flex flex-col items-center p-4 rounded-2xl transition-all duration-300 ${
                                    esAprobado
                                        ? 'bg-gradient-to-b from-yellow-50 to-yellow-100 border-2 border-yellow-400 shadow-lg hover:shadow-xl hover:-translate-y-1'
                                        : 'bg-gray-50 border-2 border-gray-200 hover:shadow-md hover:-translate-y-1'
                                }`}>
                                    <div className={`relative w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                                        esAprobado
                                            ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-white shadow-lg shadow-yellow-400/50'
                                            : 'bg-gray-300 text-gray-500'
                                    }`}>
                                        {modulo.id.replace('M', '')}
                                        {esAprobado && <span className="absolute -top-1 -right-1 text-lg">⭐</span>}
                                    </div>
                                    <p className={`text-xs font-medium mt-2 text-center ${esAprobado ? 'text-[#0c2340]' : 'text-gray-500'}`}>
                                        {modulo.nombre}
                                    </p>
                                    <span className={`text-xs font-semibold mt-1 px-2 py-0.5 rounded-full ${
                                        esAprobado ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-gray-500'
                                    }`}>
                                        {esAprobado ? '✅ Aprobado' : '⏳ Pendiente'}
                                    </span>
                                    {esAprobado && modulo.fecha && (
                                        <span className="text-xs text-gray-500 mt-1">📅 {modulo.fecha}</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Convocatorias */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-[#0c2340]">📅 Próximas Convocatorias</h2>
                    <a href="/convocatorias" className="text-sm text-[#20c997] hover:underline">Ver todas →</a>
                </div>
                {stats.convocatorias.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No hay convocatorias próximas</p>
                ) : (
                    <div className="space-y-3">
                        {stats.convocatorias.map((conv, index) => (
                            <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                                <div>
                                    <div className="font-semibold text-[#0c2340]">{conv.modulo}</div>
                                    <div className="text-sm text-gray-500">{conv.fecha}</div>
                                </div>
                                <span className="text-sm font-medium text-[#20c997] bg-[#20c997]/10 px-3 py-1 rounded-full">
                                    {conv.plazas}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
