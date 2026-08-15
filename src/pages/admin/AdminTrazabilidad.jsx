// src/pages/admin/AdminTrazabilidad.jsx
import { useState, useEffect } from 'react';

const AdminTrazabilidad = () => {
    const [citas, setCitas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
    
    // Estados para el formulario de cita
    const [formData, setFormData] = useState({
        fecha: '',
        hora: '',
        alumno: '',
        titulo: '',
        descripcion: '',
        duracion: 30
    });
    
    const [editandoId, setEditandoId] = useState(null);
    const [alumnos, setAlumnos] = useState([]);
    const [mesActual, setMesActual] = useState(new Date().getMonth());
    const [añoActual, setAñoActual] = useState(new Date().getFullYear());
    const [diaSeleccionado, setDiaSeleccionado] = useState(null);

    // Nombres de meses y días
    const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const nombresDias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = () => {
        // Cargar alumnos
        const alumnosData = localStorage.getItem('aerotraining_alumnos');
        if (alumnosData) {
            setAlumnos(JSON.parse(alumnosData));
        }

        // Cargar citas
        const citasData = localStorage.getItem('aerotraining_citas');
        if (citasData) {
            setCitas(JSON.parse(citasData));
        } else {
            // Datos de ejemplo
            const ejemplos = [
                {
                    id: 1,
                    fecha: new Date().toISOString().split('T')[0],
                    hora: '10:00',
                    alumno: 'María González',
                    alumnoId: 1,
                    titulo: 'Revisión de progreso',
                    descripcion: 'Revisar módulos aprobados y planificar siguientes',
                    duracion: 30,
                    completada: false
                },
                {
                    id: 2,
                    fecha: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
                    hora: '15:30',
                    alumno: 'Carlos Rodríguez',
                    alumnoId: 2,
                    titulo: 'Dudas Módulo 3',
                    descripcion: 'Resolver dudas sobre electricidad',
                    duracion: 45,
                    completada: false
                }
            ];
            setCitas(ejemplos);
            localStorage.setItem('aerotraining_citas', JSON.stringify(ejemplos));
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

        if (!formData.fecha || !formData.hora || !formData.alumno || !formData.titulo) {
            setMensaje({ texto: '⚠️ Fecha, hora, alumno y título son obligatorios', tipo: 'error' });
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
            return;
        }

        // Buscar alumno seleccionado
        const alumnoSeleccionado = alumnos.find(a => a.id === parseInt(formData.alumno));

        if (editandoId) {
            // Editar cita
            const nuevasCitas = citas.map(c => 
                c.id === editandoId 
                    ? { 
                        ...c, 
                        fecha: formData.fecha,
                        hora: formData.hora,
                        alumno: alumnoSeleccionado?.nombre || formData.alumno,
                        alumnoId: parseInt(formData.alumno),
                        titulo: formData.titulo,
                        descripcion: formData.descripcion,
                        duracion: parseInt(formData.duracion)
                      }
                    : c
            );
            setCitas(nuevasCitas);
            localStorage.setItem('aerotraining_citas', JSON.stringify(nuevasCitas));
            setMensaje({ texto: '✅ Cita actualizada correctamente', tipo: 'success' });
            setEditandoId(null);
        } else {
            // Nueva cita
            const nuevaCita = {
                id: Date.now(),
                fecha: formData.fecha,
                hora: formData.hora,
                alumno: alumnoSeleccionado?.nombre || formData.alumno,
                alumnoId: parseInt(formData.alumno),
                titulo: formData.titulo,
                descripcion: formData.descripcion || '',
                duracion: parseInt(formData.duracion),
                completada: false
            };
            const nuevasCitas = [...citas, nuevaCita];
            setCitas(nuevasCitas);
            localStorage.setItem('aerotraining_citas', JSON.stringify(nuevasCitas));
            setMensaje({ texto: '✅ Cita creada correctamente', tipo: 'success' });
        }

        // Resetear formulario
        setFormData({
            fecha: '',
            hora: '',
            alumno: '',
            titulo: '',
            descripcion: '',
            duracion: 30
        });

        setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
        setDiaSeleccionado(null);
    };

    const editarCita = (id) => {
        const cita = citas.find(c => c.id === id);
        if (cita) {
            setFormData({
                fecha: cita.fecha,
                hora: cita.hora,
                alumno: cita.alumnoId.toString(),
                titulo: cita.titulo,
                descripcion: cita.descripcion || '',
                duracion: cita.duracion || 30
            });
            setEditandoId(id);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const eliminarCita = (id) => {
        if (window.confirm('⚠️ ¿Eliminar esta cita permanentemente?')) {
            const nuevasCitas = citas.filter(c => c.id !== id);
            setCitas(nuevasCitas);
            localStorage.setItem('aerotraining_citas', JSON.stringify(nuevasCitas));
            setMensaje({ texto: '🗑️ Cita eliminada', tipo: 'success' });
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
        }
    };

    const completarCita = (id) => {
        const nuevasCitas = citas.map(c => 
            c.id === id ? { ...c, completada: !c.completada } : c
        );
        setCitas(nuevasCitas);
        localStorage.setItem('aerotraining_citas', JSON.stringify(nuevasCitas));
        setMensaje({ texto: '✅ Estado de cita actualizado', tipo: 'success' });
        setTimeout(() => setMensaje({ texto: '', tipo: '' }), 2000);
    };

    // Funciones del calendario
    const cambiarMes = (delta) => {
        const nuevoMes = mesActual + delta;
        if (nuevoMes > 11) {
            setMesActual(0);
            setAñoActual(añoActual + 1);
        } else if (nuevoMes < 0) {
            setMesActual(11);
            setAñoActual(añoActual - 1);
        } else {
            setMesActual(nuevoMes);
        }
        setDiaSeleccionado(null);
    };

    const obtenerCitasDelDia = (fecha) => {
        return citas.filter(c => c.fecha === fecha);
    };

    const formatearFecha = (fechaStr) => {
        try {
            const fecha = new Date(fechaStr + 'T00:00:00');
            return fecha.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch {
            return fechaStr;
        }
    };

    const formatearHora = (horaStr) => {
        if (!horaStr) return '';
        const [h, m] = horaStr.split(':');
        return `${h}:${m}`;
    };

    const getColorEstado = (cita) => {
        if (cita.completada) return 'bg-green-100 text-green-700 border-green-200';
        const hoy = new Date().toISOString().split('T')[0];
        if (cita.fecha < hoy) return 'bg-red-100 text-red-700 border-red-200';
        return 'bg-blue-100 text-blue-700 border-blue-200';
    };

    const getLabelEstado = (cita) => {
        if (cita.completada) return '✅ Completada';
        const hoy = new Date().toISOString().split('T')[0];
        if (cita.fecha < hoy) return '⏰ Pasada';
        return '⏳ Pendiente';
    };

    // Renderizar calendario
    const renderCalendario = () => {
        const primerDia = new Date(añoActual, mesActual, 1);
        const diaInicio = primerDia.getDay();
        const diasEnMes = new Date(añoActual, mesActual + 1, 0).getDate();
        const hoy = new Date().toISOString().split('T')[0];

        let diaInicioAjustado = diaInicio === 0 ? 6 : diaInicio - 1;
        let celdas = [];

        // Días vacíos
        for (let i = 0; i < diaInicioAjustado; i++) {
            celdas.push(<div key={`empty-${i}`} className="h-16 bg-gray-50 rounded-lg border border-gray-100"></div>);
        }

        // Días del mes
        for (let dia = 1; dia <= diasEnMes; dia++) {
            const fechaObj = new Date(añoActual, mesActual, dia);
            const fechaStr = fechaObj.toISOString().split('T')[0];
            const esHoy = fechaStr === hoy;
            const citasDelDia = obtenerCitasDelDia(fechaStr);

            celdas.push(
                <div
                    key={dia}
                    onClick={() => {
                        setDiaSeleccionado(fechaStr);
                        setFormData({
                            ...formData,
                            fecha: fechaStr
                        });
                    }}
                    className={`h-16 p-1 rounded-lg border cursor-pointer transition hover:shadow-md ${
                        esHoy ? 'border-[#20c997] bg-[#20c997]/5' : 'border-gray-200 hover:border-[#20c997]'
                    } ${diaSeleccionado === fechaStr ? 'ring-2 ring-[#20c997] bg-[#20c997]/10' : ''}`}
                >
                    <div className="flex justify-between items-start">
                        <span className={`text-sm font-semibold ${esHoy ? 'text-[#20c997]' : 'text-gray-700'}`}>
                            {dia}
                        </span>
                        {citasDelDia.length > 0 && (
                            <span className="text-xs bg-[#20c997] text-white rounded-full px-1.5 py-0.5">
                                {citasDelDia.length}
                            </span>
                        )}
                    </div>
                    {citasDelDia.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-0.5">
                            {citasDelDia.slice(0, 2).map((c, i) => (
                                <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#20c997]"></div>
                            ))}
                            {citasDelDia.length > 2 && (
                                <span className="text-[8px] text-gray-400">+{citasDelDia.length - 2}</span>
                            )}
                        </div>
                    )}
                </div>
            );
        }

        return celdas;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="text-4xl animate-spin">✈️</div>
                    <p className="mt-4 text-gray-500">Cargando agenda...</p>
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
            {/* FORMULARIO PARA CREAR CITA */}
            {/* ============================================================ */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-[#0c2340] mb-4">
                    <i className="fas fa-calendar-plus text-[#20c997] mr-2"></i>
                    {editandoId ? '✏️ Editar Cita' : '📅 Nueva Cita'}
                </h2>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">📅 Fecha *</label>
                        <input
                            type="date"
                            name="fecha"
                            value={formData.fecha}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] focus:ring-2 focus:ring-[#20c997]/20 transition"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">⏰ Hora *</label>
                        <input
                            type="time"
                            name="hora"
                            value={formData.hora}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] focus:ring-2 focus:ring-[#20c997]/20 transition"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">👨‍🎓 Alumno *</label>
                        <select
                            name="alumno"
                            value={formData.alumno}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] focus:ring-2 focus:ring-[#20c997]/20 transition bg-white"
                            required
                        >
                            <option value="">Seleccionar</option>
                            {alumnos.map((a) => (
                                <option key={a.id} value={a.id}>{a.nombre}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">⏱️ Duración (min)</label>
                        <select
                            name="duracion"
                            value={formData.duracion}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] focus:ring-2 focus:ring-[#20c997]/20 transition bg-white"
                        >
                            <option value="15">15 min</option>
                            <option value="30">30 min</option>
                            <option value="45">45 min</option>
                            <option value="60">60 min</option>
                            <option value="90">90 min</option>
                            <option value="120">120 min</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">📝 Título *</label>
                        <input
                            type="text"
                            name="titulo"
                            value={formData.titulo}
                            onChange={handleChange}
                            placeholder="Ej: Revisión de progreso"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] focus:ring-2 focus:ring-[#20c997]/20 transition"
                            required
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">📋 Descripción (opcional)</label>
                        <input
                            type="text"
                            name="descripcion"
                            value={formData.descripcion}
                            onChange={handleChange}
                            placeholder="Detalles de la cita..."
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] focus:ring-2 focus:ring-[#20c997]/20 transition"
                        />
                    </div>
                    <div className="md:col-span-4 flex gap-3">
                        <button
                            type="submit"
                            className="bg-gradient-to-r from-[#20c997] to-[#0c2340] text-white px-6 py-2.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#20c997]/30 transition flex items-center gap-2"
                        >
                            <i className="fas fa-save"></i>
                            {editandoId ? 'Actualizar cita' : 'Crear cita'}
                        </button>
                        {editandoId && (
                            <button
                                type="button"
                                onClick={() => {
                                    setEditandoId(null);
                                    setFormData({
                                        fecha: '',
                                        hora: '',
                                        alumno: '',
                                        titulo: '',
                                        descripcion: '',
                                        duracion: 30
                                    });
                                }}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2.5 rounded-xl font-semibold transition"
                            >
                                Cancelar
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* ============================================================ */}
            {/* CALENDARIO */}
            {/* ============================================================ */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-[#0c2340]">
                        <i className="fas fa-calendar-alt text-[#20c997] mr-2"></i>
                        Calendario de Citas
                    </h2>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => cambiarMes(-1)}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded-lg transition"
                        >
                            ◀
                        </button>
                        <span className="font-semibold text-[#0c2340] min-w-[120px] text-center">
                            {nombresMeses[mesActual]} {añoActual}
                        </span>
                        <button
                            onClick={() => cambiarMes(1)}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded-lg transition"
                        >
                            ▶
                        </button>
                        <button
                            onClick={() => {
                                const hoy = new Date();
                                setMesActual(hoy.getMonth());
                                setAñoActual(hoy.getFullYear());
                            }}
                            className="bg-[#20c997] hover:bg-[#1a9e7a] text-white px-3 py-1.5 rounded-lg text-sm transition"
                        >
                            Hoy
                        </button>
                    </div>
                </div>

                {/* Días de la semana */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {nombresDias.map((dia) => (
                        <div key={dia} className="text-center font-semibold text-sm text-gray-500 py-2">
                            {dia}
                        </div>
                    ))}
                </div>

                {/* Calendario grid */}
                <div className="grid grid-cols-7 gap-1">
                    {renderCalendario()}
                </div>

                {/* Leyenda */}
                <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-200 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#20c997]"></div>
                        <span className="text-gray-600">Hoy</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#20c997]/20 border border-[#20c997]"></div>
                        <span className="text-gray-600">Día seleccionado</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-gray-600">Cita completada</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-gray-600">Cita pendiente</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-gray-600">Cita pasada</span>
                    </div>
                </div>
            </div>

            {/* ============================================================ */}
            {/* LISTA DE CITAS DEL DÍA SELECCIONADO */}
            {/* ============================================================ */}
            {diaSeleccionado && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-[#0c2340] mb-4">
                        📋 Citas del {formatearFecha(diaSeleccionado)}
                        <span className="ml-2 text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            {obtenerCitasDelDia(diaSeleccionado).length} citas
                        </span>
                    </h3>

                    {obtenerCitasDelDia(diaSeleccionado).length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No hay citas para este día.</p>
                    ) : (
                        <div className="space-y-3">
                            {obtenerCitasDelDia(diaSeleccionado).map((cita) => (
                                <div
                                    key={cita.id}
                                    className={`flex flex-wrap justify-between items-center p-4 rounded-xl border ${getColorEstado(cita)} transition hover:shadow-md`}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="font-bold text-[#0c2340]">{cita.titulo}</span>
                                            <span className="text-sm">⏰ {formatearHora(cita.hora)}</span>
                                            <span className="text-sm">👤 {cita.alumno}</span>
                                            <span className="text-xs bg-white/50 px-2 py-0.5 rounded-full">
                                                {cita.duracion} min
                                            </span>
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                                cita.completada ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'
                                            }`}>
                                                {getLabelEstado(cita)}
                                            </span>
                                        </div>
                                        {cita.descripcion && (
                                            <p className="text-sm text-gray-600 mt-1">{cita.descripcion}</p>
                                        )}
                                    </div>
                                    <div className="flex gap-2 mt-2 sm:mt-0">
                                        <button
                                            onClick={() => completarCita(cita.id)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                                cita.completada
                                                    ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                                    : 'bg-green-500 hover:bg-green-600 text-white'
                                            }`}
                                        >
                                            {cita.completada ? '↩️ Reabrir' : '✅ Completar'}
                                        </button>
                                        <button
                                            onClick={() => editarCita(cita.id)}
                                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                                        >
                                            ✏️ Editar
                                        </button>
                                        <button
                                            onClick={() => eliminarCita(cita.id)}
                                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ============================================================ */}
            {/* RESUMEN DE CITAS */}
            {/* ============================================================ */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-[#0c2340] mb-4">
                    📊 Resumen de Citas
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-xl text-center">
                        <p className="text-2xl font-bold text-blue-600">{citas.length}</p>
                        <p className="text-sm text-gray-600">Total citas</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-xl text-center">
                        <p className="text-2xl font-bold text-yellow-600">
                            {citas.filter(c => !c.completada && c.fecha >= new Date().toISOString().split('T')[0]).length}
                        </p>
                        <p className="text-sm text-gray-600">Pendientes</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl text-center">
                        <p className="text-2xl font-bold text-green-600">
                            {citas.filter(c => c.completada).length}
                        </p>
                        <p className="text-sm text-gray-600">Completadas</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-xl text-center">
                        <p className="text-2xl font-bold text-red-600">
                            {citas.filter(c => !c.completada && c.fecha < new Date().toISOString().split('T')[0]).length}
                        </p>
                        <p className="text-sm text-gray-600">Pasadas</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminTrazabilidad;