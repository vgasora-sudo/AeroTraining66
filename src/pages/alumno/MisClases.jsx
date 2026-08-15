// src/pages/alumno/MisClases.jsx
import { useState, useEffect } from 'react';

const MisClases = () => {
    const [clases, setClases] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        cargarClases();
    }, []);

    const cargarClases = () => {
        try {
            const data = localStorage.getItem('aerotraining_clases');
            if (data) {
                setClases(JSON.parse(data));
            } else {
                setClases([]);
            }
        } catch (error) {
            console.error('Error cargando clases:', error);
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
                    <p className="mt-4 text-gray-500">Cargando clases...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Título */}
            <div className="bg-gradient-to-r from-[#0a1a2f] to-[#0c2340] rounded-2xl p-6 text-white">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <i className="fas fa-chalkboard text-[#20c997]"></i>
                    Mis Clases
                </h1>
                <p className="text-gray-300 text-sm mt-1">
                    {clases.length} clases programadas
                </p>
            </div>

            {clases.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="text-6xl mb-4">📭</div>
                    <h3 className="text-xl font-bold text-[#0c2340]">No hay clases programadas</h3>
                    <p className="text-gray-500 mt-2">No hay clases disponibles por el momento.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {clases.map((clase) => (
                        <div
                            key={clase.id}
                            className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                        >
                            <div className="bg-gradient-to-r from-[#0c2340] to-[#1a3a5c] p-4 text-white">
                                <h3 className="text-lg font-bold">{clase.titulo}</h3>
                            </div>
                            <div className="p-4">
                                {clase.descripcion && (
                                    <p className="text-gray-600 text-sm mb-3">{clase.descripcion}</p>
                                )}
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <a
                                        href={clase.enlace}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-[#20c997] hover:bg-[#1a9e7a] text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2"
                                    >
                                        <i className="fas fa-external-link-alt"></i>
                                        Entrar a la clase
                                    </a>
                                    <span className="text-xs text-gray-400">
                                        <i className="far fa-calendar-alt mr-1"></i>
                                        {formatearFecha(clase.fecha)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MisClases;