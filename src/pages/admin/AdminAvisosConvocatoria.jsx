// src/pages/admin/AdminConvocatorias.jsx
import { useState, useEffect } from 'react';

const AdminConvocatorias = () => {
    const [convocatorias, setConvocatorias] = useState([]);
    const [alumnos, setAlumnos] = useState([]);
    const [confirmaciones, setConfirmaciones] = useState({});
    const [listaEspera, setListaEspera] = useState({});
    const [loading, setLoading] = useState(true);
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
    const [diaExpandido, setDiaExpandido] = useState(null);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = () => {
        // Cargar convocatorias
        const convData = localStorage.getItem('aerotraining_convocatorias');
        if (convData) {
            setConvocatorias(JSON.parse(convData));
        } else {
            const convEjemplo = [
                { id: 37, fecha: '2026-07-11', modulo: 'M10', hora_inicio: '08:00', hora_fin: '09:45', plazas_totales: 10 },
                { id: 38, fecha: '2026-07-11', modulo: 'M2', hora_inicio: '09:45', hora_fin: '10:45', plazas_totales: 8 },
                { id: 39, fecha: '2026-07-11', modulo: 'M6', hora_inicio: '10:45', hora_fin: '11:45', plazas_totales: 6 },
                { id: 34, fecha: '2026-07-02', modulo: 'M1', hora_inicio: '08:00', hora_fin: '09:30', plazas_totales: 10 },
                { id: 35, fecha: '2026-07-02', modulo: 'M1', hora_inicio: '09:30', hora_fin: '11:00', plazas_totales: 8 },
                { id: 36, fecha: '2026-07-02', modulo: 'M6', hora_inicio: '11:00', hora_fin: '11:00', plazas_totales: 6 },
                { id: 28, fecha: '2026-06-27', modulo: 'M2', hora_inicio: '10:00', hora_fin: '11:30', plazas_totales: 12 },
            ];
            setConvocatorias(convEjemplo);
            localStorage.setItem('aerotraining_convocatorias', JSON.stringify(convEjemplo));
        }

        // Cargar alumnos
        const alumnosData = localStorage.getItem('aerotraining_alumnos');
        if (alumnosData) {
            setAlumnos(JSON.parse(alumnosData));
        } else {
            const alumnosEjemplo = [
                { id: 1, nombre: 'María González', documento: '12345678A', email: 'maria@email.com' },
                { id: 2, nombre: 'Carlos Rodríguez', documento: '87654321B', email: 'carlos@email.com' },
                { id: 3, nombre: 'Ana Martínez', documento: '11223344C', email: 'ana@email.com' },
                { id: 4, nombre: 'Gabriel Sora', documento: '44455566D', email: 'gabriel@email.com' },
                { id: 5, nombre: 'Laura Gómez', documento: '55566677E', email: 'laura@email.com' },
                { id: 6, nombre: 'Juan Pérez', documento: '66677788F', email: 'juan@email.com' },
                { id: 7, nombre: 'Sofía Ramírez', documento: '77788899G', email: 'sofia@email.com' },
                { id: 8, nombre: 'Javier Lorente', documento: '88899900H', email: 'javier@email.com' },
                { id: 9, nombre: 'Elena Castillo', documento: '99900011I', email: 'elena@email.com' },
                { id: 10, nombre: 'Pablo Serrano', documento: '00011122J', email: 'pablo@email.com' },
            ];
            setAlumnos(alumnosEjemplo);
            localStorage.setItem('aerotraining_alumnos', JSON.stringify(alumnosEjemplo));
        }

        // Cargar confirmaciones y lista de espera simuladas
        const confirmacionesSimuladas = {};
        const listaEsperaSimulada = {};

        const convIds = JSON.parse(convData || JSON.stringify([
            { id: 37 }, { id: 38 }, { id: 39 }, { id: 34 }, { id: 35 }, { id: 36 }, { id: 28 }
        ]));

        convIds.forEach((conv, index) => {
            // Asignar alumnos aleatorios a cada convocatoria
            const numAlumnos = Math.floor(Math.random() * 5) + 2;
            const alumnosSeleccionados = alumnos.slice(0, numAlumnos).map(a => a.id);
            confirmacionesSimuladas[conv.id] = alumnosSeleccionados;

            // Lista de espera (algunos tienen)
            if (index % 2 === 0 && numAlumnos > 3) {
                listaEsperaSimulada[conv.id] = alumnos.slice(numAlumnos, numAlumnos + 2).map(a => a.id);
            } else {
                listaEsperaSimulada[conv.id] = [];
            }
        });

        setConfirmaciones(confirmacionesSimuladas);
        setListaEspera(listaEsperaSimulada);
        setLoading(false);
    };

    // Agrupar convocatorias por día
    const agruparPorDia = () => {
        const grupos = {};
        convocatorias.forEach(conv => {
            if (!grupos[conv.fecha]) {
                grupos[conv.fecha] = [];
            }
            grupos[conv.fecha].push(conv);
        });
        // Ordenar fechas de más reciente a más antigua
        return Object.keys(grupos).sort((a, b) => new Date(b) - new Date(a));
    };

    // Obtener alumnos de una convocatoria
    const getAlumnosConvocatoria = (convId) => {
        const ids = confirmaciones[convId] || [];
        return alumnos.filter(a => ids.includes(a.id));
    };

    // Obtener lista de espera de una convocatoria
    const getListaEsperaConvocatoria = (convId) => {
        const ids = listaEspera[convId] || [];
        return alumnos.filter(a => ids.includes(a.id));
    };

    // Contar plazas ocupadas
    const getPlazasOcupadas = (convId) => {
        return (confirmaciones[convId] || []).length;
    };

    // Eliminar convocatoria
    const eliminarConvocatoria = (id) => {
        if (window.confirm('⚠️ ¿Eliminar esta convocatoria? Se perderán confirmaciones, listas de espera y avisos asociados.')) {
            const nuevasConvocatorias = convocatorias.filter(c => c.id !== id);
            setConvocatorias(nuevasConvocatorias);
            localStorage.setItem('aerotraining_convocatorias', JSON.stringify(nuevasConvocatorias));
            
            // Eliminar confirmaciones y lista de espera
            const nuevasConfirmaciones = { ...confirmaciones };
            delete nuevasConfirmaciones[id];
            setConfirmaciones(nuevasConfirmaciones);
            
            const nuevaListaEspera = { ...listaEspera };
            delete nuevaListaEspera[id];
            setListaEspera(nuevaListaEspera);

            setMensaje({ texto: '🗑️ Convocatoria eliminada correctamente', tipo: 'success' });
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
        }
    };

    // Descargar lista de inscritos (CSV)
    const descargarLista = (convId, modulo, fecha) => {
        const alumnosConv = getAlumnosConvocatoria(convId);
        const espera = getListaEsperaConvocatoria(convId);

        if (alumnosConv.length === 0 && espera.length === 0) {
            setMensaje({ texto: '⚠️ No hay alumnos inscritos en esta convocatoria', tipo: 'error' });
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
            return;
        }

        let csv = `LISTA DE INSCRITOS - ${modulo} (${fecha})\n\n`;
        csv += `CONFIRMADOS (${alumnosConv.length}):\n`;
        csv += 'Nombre,Documento,Email\n';
        alumnosConv.forEach(a => {
            csv += `${a.nombre},${a.documento},${a.email}\n`;
        });

        if (espera.length > 0) {
            csv += `\nLISTA DE ESPERA (${espera.length}):\n`;
            csv += 'Nombre,Documento,Email\n';
            espera.forEach(a => {
                csv += `${a.nombre},${a.documento},${a.email}\n`;
            });
        }

        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inscritos_${modulo}_${fecha}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        setMensaje({ texto: `📥 Lista de ${modulo} descargada (${alumnosConv.length} confirmados, ${espera.length} en espera)`, tipo: 'success' });
        setTimeout(() => setMensaje({ texto: '', tipo: '' }), 4000);
    };

    // Alternar expansión de día
    const toggleDia = (fecha) => {
        setDiaExpandido(diaExpandido === fecha ? null : fecha);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="text-4xl animate-spin">✈️</div>
                    <p className="mt-4 text-gray-500">Cargando convocatorias...</p>
                </div>
            </div>
        );
    }

    const dias = agruparPorDia();

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

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-[#0c2340]">
                        <i className="fas fa-calendar-check text-[#20c997] mr-2"></i>
                        Convocatorias por Día
                    </h2>
                    <span className="text-sm bg-gray-100 px-3 py-1 rounded-full text-gray-600">
                        {convocatorias.length} convocatorias
                    </span>
                </div>

                {dias.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                        <i className="fas fa-calendar-times text-4xl block mb-3 opacity-50"></i>
                        No hay convocatorias programadas
                    </p>
                ) : (
                    <div className="space-y-4">
                        {dias.map((fecha) => {
                            const convsDelDia = convocatorias.filter(c => c.fecha === fecha);
                            const fechaObj = new Date(fecha + 'T00:00:00');
                            const fechaFormateada = fechaObj.toLocaleDateString('es-ES', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            });
                            const totalPlazas = convsDelDia.reduce((sum, c) => sum + (c.plazas_totales || 10), 0);
                            const totalOcupadas = convsDelDia.reduce((sum, c) => sum + getPlazasOcupadas(c.id), 0);

                            return (
                                <div key={fecha} className="border border-gray-200 rounded-xl overflow-hidden">
                                    {/* Cabecera del día - click para expandir */}
                                    <div
                                        className={`p-4 cursor-pointer flex justify-between items-center transition ${
                                            diaExpandido === fecha ? 'bg-[#0c2340] text-white' : 'bg-gray-50 hover:bg-gray-100'
                                        }`}
                                        onClick={() => toggleDia(fecha)}
                                    >
                                        <div>
                                            <span className="font-bold text-lg">
                                                📅 {fechaFormateada}
                                            </span>
                                            <span className={`ml-3 text-sm ${diaExpandido === fecha ? 'text-gray-300' : 'text-gray-500'}`}>
                                                {convsDelDia.length} módulos · {totalOcupadas}/{totalPlazas} plazas ocupadas
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-sm ${diaExpandido === fecha ? 'text-gray-300' : 'text-gray-500'}`}>
                                                {diaExpandido === fecha ? '▼' : '▶'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Contenido del día (expandible) */}
                                    {diaExpandido === fecha && (
                                        <div className="p-4 space-y-4 bg-white">
                                            {convsDelDia.map((conv) => {
                                                const alumnosConv = getAlumnosConvocatoria(conv.id);
                                                const esperaConv = getListaEsperaConvocatoria(conv.id);
                                                const plazasTotales = conv.plazas_totales || 10;
                                                const plazasOcupadas = alumnosConv.length;

                                                return (
                                                    <div key={conv.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition">
                                                        <div className="flex flex-wrap justify-between items-start gap-4">
                                                            <div>
                                                                <div className="flex items-center gap-3">
                                                                    <span className="bg-[#0c2340] text-white text-sm font-bold px-3 py-1 rounded-full">
                                                                        {conv.modulo}
                                                                    </span>
                                                                    <span className="text-sm text-gray-500">
                                                                        🕐 {conv.hora_inicio} - {conv.hora_fin}
                                                                    </span>
                                                                </div>
                                                                <div className="mt-2 flex flex-wrap gap-3">
                                                                    <span className={`text-sm font-semibold ${
                                                                        plazasOcupadas > plazasTotales * 0.8 ? 'text-orange-500' : 'text-[#20c997]'
                                                                    }`}>
                                                                        ✅ {plazasOcupadas}/{plazasTotales} plazas ocupadas
                                                                    </span>
                                                                    {esperaConv.length > 0 && (
                                                                        <span className="text-sm font-semibold text-orange-500">
                                                                            ⏳ {esperaConv.length} en lista de espera
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                <button
                                                                    onClick={() => descargarLista(conv.id, conv.modulo, conv.fecha)}
                                                                    className="bg-[#20c997] hover:bg-[#1a9e7a] text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2"
                                                                >
                                                                    <i className="fas fa-download"></i> Descargar lista
                                                                </button>
                                                                <button
                                                                    onClick={() => eliminarConvocatoria(conv.id)}
                                                                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2"
                                                                >
                                                                    <i className="fas fa-trash"></i>
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Lista de alumnos confirmados */}
                                                        {alumnosConv.length > 0 && (
                                                            <div className="mt-3">
                                                                <div className="flex items-center gap-2 text-sm font-semibold text-[#0c2340] mb-2">
                                                                    <i className="fas fa-check-circle text-[#20c997]"></i>
                                                                    Confirmados ({alumnosConv.length})
                                                                </div>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {alumnosConv.map((a) => (
                                                                        <span key={a.id} className="bg-green-50 text-green-700 text-xs px-3 py-1 rounded-full border border-green-200">
                                                                            {a.nombre}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Lista de espera */}
                                                        {esperaConv.length > 0 && (
                                                            <div className="mt-3">
                                                                <div className="flex items-center gap-2 text-sm font-semibold text-orange-600 mb-2">
                                                                    <i className="fas fa-clock"></i>
                                                                    Lista de espera ({esperaConv.length})
                                                                </div>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {esperaConv.map((a) => (
                                                                        <span key={a.id} className="bg-orange-50 text-orange-700 text-xs px-3 py-1 rounded-full border border-orange-200">
                                                                            {a.nombre}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {alumnosConv.length === 0 && esperaConv.length === 0 && (
                                                            <p className="text-sm text-gray-400 mt-3">
                                                                No hay alumnos inscritos en esta convocatoria
                                                            </p>
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
        </div>
    );
};

export default AdminConvocatorias;