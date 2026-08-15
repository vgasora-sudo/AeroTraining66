// src/pages/alumno/Avisos.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

const Avisos = () => {
    const [avisos, setAvisos] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem('aerotraining_user') || 'null');

    useEffect(() => {
        cargarAvisos();
    }, []);

    const cargarAvisos = async () => {
        try {
            setLoading(true);

            // Obtener ID del alumno
            let alumnoId = null;
            if (user?.username) {
                const { data: alumno, error: alumnoError } = await supabase
                    .from('alumnos')
                    .select('id')
                    .eq('username', user.username)
                    .maybeSingle();

                if (alumnoError) {
                    console.error('Error buscando alumno:', alumnoError);
                }

                if (alumno) {
                    alumnoId = alumno.id;
                }
            }

            // Cargar avisos desde Supabase (para todos + específicos)
            const { data, error } = await supabase
                .from('avisos')
                .select('*')
                .or(`para_todos.eq.true,alumno_id.eq.${alumnoId || '00000000-0000-0000-0000-000000000000'}`)
                .order('fecha', { ascending: false });

            if (error) {
                console.error('Error cargando avisos:', error);
                setAvisos([]);
            } else {
                setAvisos(data || []);
            }

            // Marcar avisos como leídos al verlos
            if (data && data.length > 0) {
                const ids = data.map(a => a.id);
                await supabase
                    .from('avisos')
                    .update({ leido: true })
                    .in('id', ids);
            }

        } catch (error) {
            console.error('Error cargando avisos:', error);
            setAvisos([]);
        } finally {
            setLoading(false);
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
            {/* Título */}
            <div className="bg-gradient-to-r from-[#0a1a2f] to-[#0c2340] rounded-2xl p-6 text-white">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <i className="fas fa-bullhorn text-[#20c997]"></i>
                    Avisos
                </h1>
                <p className="text-gray-300 text-sm mt-1">
                    {avisos.length} avisos publicados por Jefatura
                </p>
            </div>

            {avisos.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="text-6xl mb-4">📢</div>
                    <h3 className="text-xl font-bold text-[#0c2340]">No hay avisos</h3>
                    <p className="text-gray-500 mt-2">No hay avisos publicados por el momento.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {avisos.map((aviso) => (
                        <div
                            key={aviso.id}
                            className="bg-white rounded-2xl shadow-sm border-l-4 border-[#20c997] border border-gray-100 p-5 hover:shadow-md transition"
                        >
                            <div className="flex justify-between items-start flex-wrap gap-2">
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="text-lg font-bold text-[#0c2340]">
                                            {aviso.titulo}
                                        </h3>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                            aviso.tipo === 'importante' ? 'bg-red-100 text-red-700' :
                                            aviso.tipo === 'convocatoria' ? 'bg-blue-100 text-blue-700' :
                                            aviso.tipo === 'recordatorio' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-gray-200 text-gray-600'
                                        }`}>
                                            {aviso.tipo || 'general'}
                                        </span>
                                    </div>
                                    <p className="text-gray-700 mt-3 whitespace-pre-line">
                                        {aviso.contenido}
                                    </p>
                                </div>
                                <span className="text-xs text-gray-400 flex-shrink-0">
                                    <i className="far fa-calendar-alt mr-1"></i>
                                    {formatearFecha(aviso.fecha)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Avisos;
