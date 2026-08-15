// src/pages/admin/AdminClases.jsx
import { useState, useEffect } from 'react';

const AdminClases = () => {
    const [clases, setClases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
    const [formData, setFormData] = useState({
        titulo: '',
        descripcion: '',
        enlace: ''
    });
    const [editandoId, setEditandoId] = useState(null);

    useEffect(() => {
        cargarClases();
    }, []);

    const cargarClases = () => {
        try {
            const data = localStorage.getItem('aerotraining_clases');
            if (data) {
                setClases(JSON.parse(data));
            } else {
                // Datos de ejemplo
                const ejemplos = [
                    {
                        id: 1,
                        titulo: 'Resolución Módulo 3',
                        descripcion: 'Repaso Módulo 3 - Electricidad',
                        enlace: 'https://zoom.us',
                        fecha: new Date().toISOString().replace('T', ' ').slice(0, 16)
                    },
                    {
                        id: 2,
                        titulo: 'Resolución Módulo 1',
                        descripcion: 'Repaso Módulo 1 - Matemáticas',
                        enlace: 'https://zoom.us',
                        fecha: new Date().toISOString().replace('T', ' ').slice(0, 16)
                    },
                    {
                        id: 3,
                        titulo: 'Resolución Módulo 2',
                        descripcion: 'Repaso Módulo 2 - Física',
                        enlace: 'https://zoom.us',
                        fecha: new Date().toISOString().replace('T', ' ').slice(0, 16)
                    }
                ];
                setClases(ejemplos);
                localStorage.setItem('aerotraining_clases', JSON.stringify(ejemplos));
            }
        } catch (error) {
            console.error('Error cargando clases:', error);
        }
        setLoading(false);
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

        if (!formData.titulo || !formData.enlace) {
            setMensaje({ texto: '⚠️ Título y enlace son obligatorios', tipo: 'error' });
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
            return;
        }

        // Validar URL
        try {
            new URL(formData.enlace);
        } catch {
            setMensaje({ texto: '⚠️ El enlace no es válido. Introduce una URL correcta.', tipo: 'error' });
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
            return;
        }

        if (editandoId) {
            // Editar clase
            const nuevasClases = clases.map(c => 
                c.id === editandoId 
                    ? { 
                        ...c, 
                        titulo: formData.titulo, 
                        descripcion: formData.descripcion || 'Sin descripción',
                        enlace: formData.enlace,
                        fecha: new Date().toISOString().replace('T', ' ').slice(0, 16)
                      }
                    : c
            );
            setClases(nuevasClases);
            localStorage.setItem('aerotraining_clases', JSON.stringify(nuevasClases));
            setMensaje({ texto: '✅ Clase actualizada correctamente', tipo: 'success' });
            setEditandoId(null);
        } else {
            // Nueva clase
            const nuevaClase = {
                id: Date.now(),
                titulo: formData.titulo,
                descripcion: formData.descripcion || 'Sin descripción',
                enlace: formData.enlace,
                fecha: new Date().toISOString().replace('T', ' ').slice(0, 16)
            };
            const nuevasClases = [nuevaClase, ...clases];
            setClases(nuevasClases);
            localStorage.setItem('aerotraining_clases', JSON.stringify(nuevasClases));
            setMensaje({ texto: '✅ Clase agregada correctamente', tipo: 'success' });
        }

        setFormData({ titulo: '', descripcion: '', enlace: '' });
        setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
    };

    const eliminarClase = (id) => {
        if (window.confirm('⚠️ ¿Eliminar esta clase permanentemente?')) {
            const nuevasClases = clases.filter(c => c.id !== id);
            setClases(nuevasClases);
            localStorage.setItem('aerotraining_clases', JSON.stringify(nuevasClases));
            setMensaje({ texto: '🗑️ Clase eliminada', tipo: 'success' });
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
        }
    };

    const editarClase = (id) => {
        const clase = clases.find(c => c.id === id);
        if (clase) {
            setFormData({
                titulo: clase.titulo,
                descripcion: clase.descripcion || '',
                enlace: clase.enlace
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
            {/* Mensaje de feedback */}
            {mensaje.texto && (
                <div className={`p-4 rounded-xl border-l-4 ${
                    mensaje.tipo === 'success' ? 'bg-green-50 border-green-500 text-green-700' :
                    mensaje.tipo === 'error' ? 'bg-red-50 border-red-500 text-red-700' :
                    'bg-blue-50 border-blue-500 text-blue-700'
                }`}>
                    {mensaje.texto}
                </div>
            )}

            {/* ============================================================ */}
            {/* FORMULARIO PARA AÑADIR CLASE */}
            {/* ============================================================ */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-[#0c2340] mb-4">
                    <i className="fas fa-video text-[#20c997] mr-2"></i>
                    {editandoId ? '✏️ Editar clase' : 'Añadir nueva clase'}
                </h2>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <i className="fas fa-heading mr-1"></i> Título de la clase *
                            </label>
                            <input
                                type="text"
                                name="titulo"
                                value={formData.titulo}
                                onChange={handleChange}
                                placeholder="Ej: Resolución Módulo 3"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] focus:ring-2 focus:ring-[#20c997]/20 transition"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <i className="fas fa-link mr-1"></i> Enlace (Zoom, Teams...) *
                            </label>
                            <input
                                type="url"
                                name="enlace"
                                value={formData.enlace}
                                onChange={handleChange}
                                placeholder="https://zoom.us/j/123456789"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] focus:ring-2 focus:ring-[#20c997]/20 transition"
                                required
                            />
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <i className="fas fa-align-left mr-1"></i> Descripción (opcional)
                        </label>
                        <textarea
                            name="descripcion"
                            value={formData.descripcion}
                            onChange={handleChange}
                            rows="2"
                            placeholder="Breve descripción de la clase..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] focus:ring-2 focus:ring-[#20c997]/20 transition resize-none"
                        />
                    </div>

                    <div className="flex gap-3 mt-4">
                        <button
                            type="submit"
                            className="bg-gradient-to-r from-[#20c997] to-[#0c2340] text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#20c997]/30 transition flex items-center gap-2"
                        >
                            <i className="fas fa-plus-circle"></i>
                            {editandoId ? 'Actualizar clase' : 'Agregar clase'}
                        </button>
                        {editandoId && (
                            <button
                                type="button"
                                onClick={() => {
                                    setEditandoId(null);
                                    setFormData({ titulo: '', descripcion: '', enlace: '' });
                                }}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold transition"
                            >
                                Cancelar
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* ============================================================ */}
            {/* LISTA DE CLASES */}
            {/* ============================================================ */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-[#0c2340]">
                        <i className="fas fa-calendar-alt mr-2"></i>
                        Clases programadas
                    </h3>
                    <span className="text-sm bg-gray-100 px-3 py-1 rounded-full text-gray-600">
                        {clases.length} clases
                    </span>
                </div>

                {clases.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <div className="text-6xl mb-4">📭</div>
                        <p>No hay clases programadas</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {clases.map((clase) => (
                            <div
                                key={clase.id}
                                className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition"
                            >
                                <div className="flex flex-wrap justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <h4 className="font-bold text-[#0c2340] text-lg">
                                            {clase.titulo}
                                        </h4>
                                        {clase.descripcion && (
                                            <p className="text-gray-600 text-sm mt-1">
                                                {clase.descripcion}
                                            </p>
                                        )}
                                        <div className="flex flex-wrap items-center gap-3 mt-2">
                                            <a
                                                href={clase.enlace}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[#20c997] hover:underline text-sm font-medium flex items-center gap-1"
                                            >
                                                <i className="fas fa-external-link-alt"></i>
                                                {clase.enlace}
                                            </a>
                                            <span className="text-xs text-gray-400">
                                                <i className="far fa-calendar-alt mr-1"></i>
                                                {formatearFecha(clase.fecha)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => editarClase(clase.id)}
                                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                                        >
                                            <i className="fas fa-edit"></i> Editar
                                        </button>
                                        <button
                                            onClick={() => eliminarClase(clase.id)}
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

export default AdminClases;