// src/pages/alumno/MisManuales.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

const MisManuales = () => {
    const [manuales, setManuales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modulosAlumno, setModulosAlumno] = useState([]);
    const [error, setError] = useState('');
    const [nombreAlumno, setNombreAlumno] = useState('');

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            setError('');

            // 1. OBTENER USUARIO LOGUEADO
            const userData = JSON.parse(localStorage.getItem('aerotraining_user') || 'null');
            if (!userData) {
                setError('No hay usuario logueado');
                setLoading(false);
                return;
            }

            console.log('👤 Usuario logueado:', userData);
            setNombreAlumno(userData.nombre || 'Alumno');

            // 2. BUSCAR ALUMNO EN SUPABASE (por username o email)
            let perfil = null;
            let modulos = [];

            // Intentar por username
            const { data: perfilUsername, error: errorUsername } = await supabase
                .from('alumnos')
                .select('id, nombre, habilitados')
                .eq('username', userData.username)
                .maybeSingle();

            if (perfilUsername) {
                perfil = perfilUsername;
            } else {
                // Intentar por email
                const { data: perfilEmail, error: errorEmail } = await supabase
                    .from('alumnos')
                    .select('id, nombre, habilitados')
                    .eq('email', userData.email)
                    .maybeSingle();

                if (perfilEmail) {
                    perfil = perfilEmail;
                }
            }

            if (!perfil) {
                console.warn('⚠️ Alumno no encontrado en Supabase');
                setError('No se encontró tu perfil en la base de datos. Contacta con Jefatura.');
                setLoading(false);
                return;
            }

            // 3. OBTENER MÓDULOS DEL ALUMNO
            modulos = perfil.habilitados || [];
            setModulosAlumno(modulos);
            console.log('📦 Módulos del alumno:', modulos);

            if (modulos.length === 0) {
                console.log('ℹ️ El alumno no tiene módulos asignados');
                setManuales([]);
                setLoading(false);
                return;
            }

            // 4. CARGAR MANUALES DE LOS MÓDULOS DEL ALUMNO
            const { data, error } = await supabase
                .from('manuales')
                .select('*')
                .in('modulo_id', modulos)
                .order('titulo', { ascending: true });

            if (error) {
                console.error('Error cargando manuales:', error);
                setError('Error al cargar los manuales');
                setLoading(false);
                return;
            }

            console.log('📚 Manuales encontrados:', data);
            setManuales(data || []);

        } catch (error) {
            console.error('❌ Error general:', error);
            setError('Error al cargar los datos');
        } finally {
            setLoading(false);
        }
    };

    // ✅ DESCARGA DE PDF (BUCKET CORRECTO: 'manuals')
    const descargarPDF = async (manual) => {
        console.log('📥 Descargando manual:', manual);

        try {
            // Si tiene URL externa
            if (manual.url_externa) {
                window.open(manual.url_externa, '_blank');
                return;
            }

            // Si tiene archivo en Storage
            if (manual.archivo) {
                console.log('📦 Usando bucket:', 'manuals');
                
                const { data } = await supabase.storage
                    .from('manuals')  // ← BUCKET CORRECTO
                    .getPublicUrl(manual.archivo);

                console.log('🔗 URL generada:', data?.publicUrl);

                if (data?.publicUrl) {
                    window.open(data.publicUrl, '_blank');
                } else {
                    alert('⚠️ No se pudo generar la URL del archivo.');
                }
            } else {
                alert('⚠️ Este manual no tiene archivo asociado.');
            }
        } catch (error) {
            console.error('❌ Error al descargar:', error);
            alert('❌ Error al descargar el manual: ' + error.message);
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
            return fechaStr || 'Fecha no disponible';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="text-4xl animate-spin">✈️</div>
                    <p className="mt-4 text-gray-500">Cargando tus manuales...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-center">
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                    <p className="text-red-700 text-sm">❌ {error}</p>
                    <button 
                        onClick={cargarDatos}
                        className="mt-4 text-[#20c997] hover:underline text-sm"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Título */}
            <div className="bg-gradient-to-r from-[#0a1a2f] to-[#0c2340] rounded-2xl p-6 text-white">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <i className="fas fa-book text-[#20c997]"></i>
                    Mis Manuales
                </h1>
                <p className="text-gray-300 text-sm mt-1">
                    {manuales.length > 0 
                        ? `${manuales.length} manuales disponibles para tus módulos`
                        : 'No tienes manuales disponibles aún'
                    }
                    {modulosAlumno.length > 0 && ` (Módulos: ${modulosAlumno.join(', ')})`}
                </p>
                {modulosAlumno.length === 0 && (
                    <p className="text-yellow-300 text-sm mt-2">
                        ⚠️ No tienes módulos asignados. Contacta con Jefatura.
                    </p>
                )}
            </div>

            {/* Lista de manuales */}
            {manuales.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="text-6xl mb-4">📭</div>
                    <h3 className="text-xl font-bold text-[#0c2340]">No tienes manuales disponibles</h3>
                    <p className="text-gray-500 mt-2">
                        {modulosAlumno.length > 0 
                            ? 'No hay manuales subidos para tus módulos todavía.'
                            : 'Contacta con Jefatura para que te asignen módulos.'
                        }
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {manuales.map((manual) => (
                        <div 
                            key={manual.id} 
                            className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                        >
                            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                                <div className="flex items-center gap-4">
                                    <div className="text-5xl">📄</div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-bold text-[#0c2340] leading-tight truncate">
                                            {manual.titulo}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            <span className="bg-[#0c2340] text-white text-xs font-semibold px-3 py-0.5 rounded-full">
                                                {manual.modulo_id}
                                            </span>
                                            {manual.fecha_subida && (
                                                <span className="text-xs text-gray-400">
                                                    <i className="far fa-calendar-alt mr-1"></i>
                                                    {formatearFecha(manual.fecha_subida)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {manual.descripcion && (
                                <div className="px-6 py-3 bg-gray-50">
                                    <p className="text-sm text-gray-600 line-clamp-2">{manual.descripcion}</p>
                                </div>
                            )}

                            <div className="px-6 py-3 border-b border-gray-100">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">
                                        <i className="fas fa-file-pdf text-[#dc3545] mr-1"></i>
                                        {manual.archivo || 'PDF'}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        <i className="fas fa-file-alt mr-1"></i>
                                        PDF
                                    </span>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50">
                                <button
                                    onClick={() => descargarPDF(manual)}
                                    className="w-full bg-gradient-to-r from-[#20c997] to-[#0c2340] text-white py-3 rounded-xl font-semibold text-base hover:shadow-lg hover:shadow-[#20c997]/30 transition-all flex items-center justify-center gap-2"
                                >
                                    <i className="fas fa-download"></i>
                                    Descargar PDF
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MisManuales;
