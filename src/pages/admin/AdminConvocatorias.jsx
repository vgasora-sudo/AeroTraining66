// src/pages/admin/AdminConvocatorias.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { notificarConvocatoriaAModulo } from '../../services/emailService';

const AdminConvocatorias = () => {
    const [convocatorias, setConvocatorias] = useState([]);
    const [alumnos, setAlumnos] = useState([]);
    const [confirmaciones, setConfirmaciones] = useState({});
    const [listaEspera, setListaEspera] = useState({});
    const [loading, setLoading] = useState(true);
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
    
    const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0]);
    const [rangos, setRangos] = useState([]);
    const [convocatoriasFecha, setConvocatoriasFecha] = useState([]);
    const [expandedWeeks, setExpandedWeeks] = useState({});
    
    // 🆕 Estado para forzar recarga
    const [refreshKey, setRefreshKey] = useState(0);
    
    // 🆕 Estado para controlar qué convocatorias muestran la lista de alumnos
    const [convocatoriasVisibles, setConvocatoriasVisibles] = useState(new Set());

    // 🆕 Estados para convocatorias activas calculadas (en lugar de useMemo)
    const [convocatoriasActivas, setConvocatoriasActivas] = useState([]);
    const [convocatoriasPorSemana, setConvocatoriasPorSemana] = useState({});
    const [semanasOrdenadas, setSemanasOrdenadas] = useState([]);

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
    // Función para obtener número de semana (ISO)
    // ============================================================
    const getWeekNumber = (date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
        const week1 = new Date(d.getFullYear(), 0, 4);
        const weekNum = 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
        return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
    };

    // ============================================================
    // RECALCULAR CONVOCATORIAS ACTIVAS (se ejecuta cuando cambia convocatorias o refreshKey)
    // ============================================================
    useEffect(() => {
        console.log('🔄 Recalculando convocatorias activas. convocatorias.length:', convocatorias.length, 'refreshKey:', refreshKey);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const activas = convocatorias
            .filter(c => {
                const fechaConv = new Date(c.fecha + 'T00:00:00');
                return c.estado === 'Abierta' || fechaConv >= hoy;
            })
            .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

        console.log('📋 Convocatorias activas encontradas:', activas.length);
        setConvocatoriasActivas(activas);

        const porSemana = activas.reduce((acc, conv) => {
            const semana = getWeekNumber(conv.fecha);
            if (!acc[semana]) acc[semana] = [];
            acc[semana].push(conv);
            return acc;
        }, {});
        setConvocatoriasPorSemana(porSemana);

        const ordenadas = Object.keys(porSemana).sort();
        setSemanasOrdenadas(ordenadas);
    }, [convocatorias, refreshKey]);

    // ============================================================
    // ✅ Función para exportar alumnos de una convocatoria (CSV con ;)
    // ============================================================
    const exportarAlumnosConvocatoria = (convId) => {
        const alumnosConfirmados = getAlumnosConvocatoria(convId);
        const alumnosEspera = getListaEsperaConvocatoria(convId);
        const conv = convocatorias.find(c => c.id === convId);
        if (!conv) {
            setMensaje({ texto: '⚠️ Convocatoria no encontrada', tipo: 'error' });
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
            return;
        }

        const separador = ';';
        let csv = `CONVOCATORIA ${conv.modulo_id} - ${conv.fecha}\n\n`;
        csv += `Estado${separador}Nombre${separador}Documento${separador}Email\n`;
        alumnosConfirmados.forEach(a => {
            csv += `Confirmado${separador}${a.nombre}${separador}${a.documento || ''}${separador}${a.email}\n`;
        });
        alumnosEspera.forEach(a => {
            csv += `En espera${separador}${a.nombre}${separador}${a.documento || ''}${separador}${a.email}\n`;
        });

        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `convocatoria_${conv.modulo_id}_${conv.fecha}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        setMensaje({ texto: `📥 Exportados ${alumnosConfirmados.length + alumnosEspera.length} alumnos`, tipo: 'success' });
        setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
    };

    // ============================================================
    // ✅ Función para exportar TODA una semana (todas las convocatorias)
    // ============================================================
    const exportarSemanaCompleta = (semana) => {
        const convs = convocatoriasPorSemana[semana] || [];
        if (convs.length === 0) {
            setMensaje({ texto: '⚠️ No hay convocatorias en esta semana', tipo: 'error' });
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
            return;
        }

        const separador = ';';
        let csv = `CONVOCATORIAS SEMANA ${semana}\n\n`;

        const totalAlumnosUnicos = new Set();
        let totalConfirmados = 0;
        let totalEspera = 0;

        convs.forEach((conv) => {
            const confirmados = getAlumnosConvocatoria(conv.id);
            const espera = getListaEsperaConvocatoria(conv.id);
            const fecha = conv.fecha;
            const modulo = conv.modulo_id;

            confirmados.forEach(a => totalAlumnosUnicos.add(a.id));
            totalConfirmados += confirmados.length;
            totalEspera += espera.length;

            csv += `===== CONVOCATORIA ${modulo} - ${fecha} =====\n`;
            csv += `Estado${separador}Nombre${separador}Documento${separador}Email\n`;
            confirmados.forEach(a => {
                csv += `Confirmado${separador}${a.nombre}${separador}${a.documento || ''}${separador}${a.email}\n`;
            });
            espera.forEach(a => {
                csv += `En espera${separador}${a.nombre}${separador}${a.documento || ''}${separador}${a.email}\n`;
            });
            csv += '\n';
        });

        csv += `\nRESUMEN DE LA SEMANA\n`;
        csv += `Total de alumnos${separador}${totalAlumnosUnicos.size}\n`;
        csv += `Plazas confirmadas${separador}${totalConfirmados}\n`;
        csv += `En espera${separador}${totalEspera}\n`;
        csv += `Total de exámenes${separador}${totalConfirmados}\n`;

        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `convocatorias_semana_${semana}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        setMensaje({ texto: `📥 Exportada semana ${semana} con ${convs.length} convocatorias`, tipo: 'success' });
        setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
    };

    // ============================================================
    // ✅ Función para descargar todas las convocatorias de una fecha (CSV con ;)
    // ============================================================
    const descargarConvocatoriaExcel = () => {
        const convs = convocatorias.filter(c => c.fecha === fechaSeleccionada);
        if (convs.length === 0) {
            setMensaje({ texto: '⚠️ No hay convocatorias para descargar', tipo: 'error' });
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
            return;
        }

        const separador = ';';
        let csv = `CONVOCATORIA ${fechaSeleccionada}\n\n`;
        csv += `Módulo${separador}Hora Inicio${separador}Hora Fin${separador}Plazas Totales${separador}Plazas Ocupadas${separador}En Espera\n`;
        convs.forEach(c => {
            const ocupadas = getPlazasOcupadas(c.id);
            const espera = (listaEspera[c.id] || []).length;
            csv += `${c.modulo_id}${separador}${c.hora_inicio}${separador}${c.hora_fin}${separador}${c.plazas_totales || 10}${separador}${ocupadas}${separador}${espera}\n`;
        });

        csv += '\nALUMNOS CONFIRMADOS:\n';
        csv += `Nombre${separador}Documento${separador}Email${separador}Módulo\n`;
        convs.forEach(c => {
            const alumnosConv = getAlumnosConvocatoria(c.id);
            alumnosConv.forEach(a => {
                csv += `${a.nombre}${separador}${a.documento || ''}${separador}${a.email}${separador}${c.modulo_id}\n`;
            });
        });

        csv += '\nLISTA DE ESPERA:\n';
        csv += `Nombre${separador}Documento${separador}Email${separador}Módulo${separador}Posición\n`;
        convs.forEach(c => {
            const espera = getListaEsperaConvocatoria(c.id);
            espera.forEach((a, index) => {
                csv += `${a.nombre}${separador}${a.documento || ''}${separador}${a.email}${separador}${c.modulo_id}${separador}${index + 1}\n`;
            });
        });

        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `convocatoria_${fechaSeleccionada}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        setMensaje({ texto: '📥 Convocatoria descargada correctamente', tipo: 'success' });
        setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
    };

    // ============================================================
    // Función para alternar el despliegue de semanas
    // ============================================================
    const toggleWeek = (semana) => {
        setExpandedWeeks(prev => ({ ...prev, [semana]: !prev[semana] }));
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
            
            const { data: convData, error: convError } = await supabase
                .from('convocatorias')
                .select('*')
                .order('fecha', { ascending: true });

            if (convError) throw convError;
            console.log('📦 Convocatorias cargadas:', convData.length);
            setConvocatorias(convData || []); // No clonamos, el array ya es nuevo

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

            cargarConvocatoriasFecha(fechaSeleccionada, convData || []);

        } catch (error) {
            console.error('Error cargando datos:', error);
            setMensaje({ texto: '❌ Error al cargar los datos', tipo: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const cargarConvocatoriasFecha = (fecha, convs = null) => {
        const convsData = convs || convocatorias;
        const convsFiltradas = convsData.filter(c => c.fecha === fecha);
        setConvocatoriasFecha(convsFiltradas);
        
        if (convsFiltradas.length > 0) {
            setRangos(convsFiltradas.map(c => ({
                hora_inicio: c.hora_inicio || '08:00',
                hora_fin: c.hora_fin || '10:00',
                modulo: c.modulo_id,
                plazas_totales: c.plazas_totales || 10,
                tiempo_limite: c.limite_confirmacion || 20,
                id: c.id
            })));
        } else {
            setRangos([]);
        }
    };

    const handleFechaChange = (e) => {
        const fecha = e.target.value;
        setFechaSeleccionada(fecha);
        cargarConvocatoriasFecha(fecha);
    };

    const generarOpcionesTiempo = () => {
        let opts = [];
        for(let h=8; h<=20; h++) {
            for(let m=0; m<60; m+=15) {
                opts.push(h.toString().padStart(2,'0')+':'+m.toString().padStart(2,'0'));
            }
        }
        return opts;
    };

    const generarOpcionesModulos = () => {
        const modulosNombres = {
            1: "Matemáticas", 2: "Física", 3: "Electricidad", 4: "Electrónica Básica",
            5: "Sistemas Digitales", 6: "Materiales", 7: "Prácticas de Mantenimiento",
            8: "Aerodinámica", 9: "Factores Humanos", 10: "Legislación",
            11: "Estructuras de Avión", 12: "Helicópteros", 13: "Sistemas de Aviónica",
            14: "Propulsión", 15: "Motores de Turbina", 16: "Motores Alternativos",
            17: "Sistemas de Hélice"
        };
        let mods = [];
        for(let i=1;i<=17;i++) {
            mods.push({valor:"M"+i, texto:"Módulo "+i+" - "+modulosNombres[i]});
        }
        return mods;
    };

    const añadirRango = () => {
        const ultimaHora = rangos.length > 0 ? rangos[rangos.length-1].hora_fin : "08:00";
        setRangos([...rangos, {
            hora_inicio: ultimaHora,
            hora_fin: ultimaHora,
            modulo: "M1",
            plazas_totales: 10,
            tiempo_limite: 20
        }]);
    };

    const eliminarRango = (index) => {
        const nuevosRangos = rangos.filter((_, i) => i !== index);
        setRangos(nuevosRangos);
    };

    const actualizarRango = (index, campo, valor) => {
        const nuevosRangos = [...rangos];
        nuevosRangos[index][campo] = valor;
        setRangos(nuevosRangos);
    };

    // ✅ GUARDAR CONVOCATORIAS (ELIMINA + INSERTA + ENVÍA CORREOS)
    const guardarConvocatorias = async () => {
        if (!fechaSeleccionada || rangos.length === 0) {
            setMensaje({ texto: '⚠️ Selecciona una fecha y añade al menos un examen', tipo: 'error' });
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
            return;
        }

        try {
            setLoading(true);

            const { error: deleteError } = await supabase
                .from('convocatorias')
                .delete()
                .eq('fecha', fechaSeleccionada);

            if (deleteError) throw deleteError;

            const nuevasConvs = rangos.map(r => ({
                fecha: fechaSeleccionada,
                hora_inicio: r.hora_inicio,
                hora_fin: r.hora_fin,
                modulo_id: r.modulo,
                plazas_totales: parseInt(r.plazas_totales) || 10,
                plazas_disponibles: parseInt(r.plazas_totales) || 10,
                limite_confirmacion: parseInt(r.tiempo_limite) || 20,
                titulo: `Convocatoria ${r.modulo}`,
                estado: 'Abierta'
            }));

            const { error: insertError } = await supabase
                .from('convocatorias')
                .insert(nuevasConvs);

            if (insertError) throw insertError;

            setMensaje({ texto: '✅ Convocatorias guardadas correctamente', tipo: 'success' });

            try {
                const { data: alumnosModulos, error: alumnosError } = await supabase
                    .from('alumnos')
                    .select('id, email, nombre, habilitados')
                    .eq('activo', true);

                if (!alumnosError && alumnosModulos && alumnosModulos.length > 0) {
                    for (const nuevaConv of nuevasConvs) {
                        const alumnosDelModulo = alumnosModulos.filter(a => 
                            a.habilitados && a.habilitados.includes(nuevaConv.modulo_id)
                        );

                        if (alumnosDelModulo.length > 0) {
                            const resultados = await notificarConvocatoriaAModulo(alumnosDelModulo, nuevaConv);
                            if (resultados && Array.isArray(resultados)) {
                                const enviados = resultados.filter(r => r && r.success).length;
                                console.log(`✅ Enviados ${enviados} correos de convocatoria para ${nuevaConv.modulo_id}`);
                            }
                        }
                    }
                }
            } catch (emailError) {
                console.error('⚠️ Error en envío de correos (no crítico):', emailError);
            }

            // ✅ RECARGAR DATOS Y FORZAR ACTUALIZACIÓN
            console.log('🔄 Recargando datos después de guardar...');
            await cargarDatos();
            console.log('📈 Incrementando refreshKey a', refreshKey + 1);
            setRefreshKey(prev => prev + 1);

            // 🆕 Log para verificar que el estado convocatorias se actualizó
            console.log('📊 Estado convocatorias después de cargar:', convocatorias.length);

        } catch (error) {
            console.error('Error guardando convocatorias:', error);
            setMensaje({ texto: '❌ Error al guardar: ' + error.message, tipo: 'error' });
        } finally {
            setLoading(false);
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
        }
    };

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

    const reasignarPlaza = async (convocatoriaId) => {
        if (!confirm('¿Reasignar la plaza al primer alumno de la lista de espera?')) return;

        try {
            setLoading(true);
            const { data, error } = await supabase.rpc('reasignar_plaza_espera', {
                p_convocatoria_id: convocatoriaId
            });

            if (error) throw error;

            if (data && data.success) {
                setMensaje({ texto: '✅ Plaza reasignada correctamente', tipo: 'success' });
                await cargarDatos();
                setRefreshKey(prev => prev + 1);
            } else {
                setMensaje({ texto: '⚠️ ' + (data?.mensaje || 'No hay alumnos en lista de espera'), tipo: 'info' });
            }
        } catch (error) {
            console.error('Error reasignando plaza:', error);
            setMensaje({ texto: '❌ Error al reasignar', tipo: 'error' });
        } finally {
            setLoading(false);
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
        }
    };

    const eliminarConvocatoriaGuardada = async (id) => {
        if (!window.confirm('⚠️ ¿Eliminar esta convocatoria?')) return;

        try {
            setLoading(true);
            
            await supabase
                .from('inscripciones_convocatorias')
                .delete()
                .eq('convocatoria_id', id);

            const { error } = await supabase
                .from('convocatorias')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setMensaje({ texto: '🗑️ Convocatoria eliminada correctamente', tipo: 'success' });
            await cargarDatos();
            setRefreshKey(prev => prev + 1);

        } catch (error) {
            console.error('Error eliminando:', error);
            setMensaje({ texto: '❌ Error al eliminar', tipo: 'error' });
        } finally {
            setLoading(false);
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
        }
    };

    // ============================================================
    // RENDER
    // ============================================================
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

    const optsTiempo = generarOpcionesTiempo();
    const optsModulos = generarOpcionesModulos();

    return (
        <div className="space-y-6">
            {mensaje.texto && (
                <div className={`p-4 rounded-xl border-l-4 ${
                    mensaje.tipo === 'success' ? 'bg-green-50 border-green-500 text-green-700' :
                    mensaje.tipo === 'error' ? 'bg-red-50 border-red-500 text-red-700' :
                    'bg-blue-50 border-blue-500 text-blue-700'
                }`}>
                    {mensaje.texto}
                </div>
            )}

            {/* SECCIÓN 1: GESTIÓN DE CONVOCATORIAS */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-[#0c2340] mb-4">
                    <i className="fas fa-calendar-plus text-[#20c997] mr-2"></i>
                    Gestión de Convocatorias
                </h2>

                <div className="flex flex-wrap items-center gap-4 mb-4">
                    <div>
                        <label className="font-semibold text-sm text-[#0c2340]">📅 Selecciona fecha:</label>
                        <input
                            type="date"
                            value={fechaSeleccionada}
                            onChange={handleFechaChange}
                            className="ml-2 px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997]"
                        />
                    </div>
                    <button
                        onClick={() => cargarConvocatoriasFecha(fechaSeleccionada)}
                        className="bg-[#007bff] hover:bg-[#0056b3] text-white px-4 py-2 rounded-xl font-semibold text-sm transition flex items-center gap-2"
                    >
                        <i className="fas fa-database"></i> Cargar datos
                    </button>
                </div>

                <div className="space-y-3">
                    {rangos.map((r, index) => (
                        <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-semibold text-gray-600">⏰ Inicio:</label>
                                <select
                                    value={r.hora_inicio}
                                    onChange={(e) => actualizarRango(index, 'hora_inicio', e.target.value)}
                                    className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
                                >
                                    {optsTiempo.map(o => (
                                        <option key={o} value={o}>{o}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-semibold text-gray-600">Fin:</label>
                                <select
                                    value={r.hora_fin}
                                    onChange={(e) => actualizarRango(index, 'hora_fin', e.target.value)}
                                    className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
                                >
                                    {optsTiempo.map(o => (
                                        <option key={o} value={o}>{o}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-semibold text-gray-600">📚 Módulo:</label>
                                <select
                                    value={r.modulo}
                                    onChange={(e) => actualizarRango(index, 'modulo', e.target.value)}
                                    className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
                                >
                                    {optsModulos.map(m => (
                                        <option key={m.valor} value={m.valor}>{m.texto}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-semibold text-gray-600">🎟️ Plazas:</label>
                                <input
                                    type="number"
                                    value={r.plazas_totales}
                                    onChange={(e) => actualizarRango(index, 'plazas_totales', parseInt(e.target.value) || 10)}
                                    min="1"
                                    max="100"
                                    className="w-20 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-center"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-semibold text-gray-600">⏱️ Límite (min):</label>
                                <input
                                    type="number"
                                    value={r.tiempo_limite}
                                    onChange={(e) => actualizarRango(index, 'tiempo_limite', parseInt(e.target.value) || 20)}
                                    min="5"
                                    max="120"
                                    step="5"
                                    className="w-20 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-center"
                                />
                                <span className="text-xs text-gray-400">para confirmar</span>
                            </div>
                            <button
                                onClick={() => eliminarRango(index)}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm transition"
                            >
                                <i className="fas fa-trash"></i> Eliminar
                            </button>
                        </div>
                    ))}
                </div>

                <button
                    onClick={añadirRango}
                    className="mt-3 bg-[#28a745] hover:bg-[#218838] text-white px-4 py-2 rounded-xl font-semibold text-sm transition flex items-center gap-2"
                >
                    <i className="fas fa-plus"></i> Añadir otro examen
                </button>

                <button
                    onClick={guardarConvocatorias}
                    className="mt-4 bg-gradient-to-r from-[#28a745] to-[#1e7e34] text-white px-6 py-3 rounded-xl font-semibold transition hover:shadow-lg flex items-center gap-2 w-full md:w-auto"
                >
                    <i className="fas fa-save"></i> Guardar todas las convocatorias de esta fecha
                </button>
            </div>

            {/* SECCIÓN 2: CONVOCATORIAS GUARDADAS PARA ESTA FECHA */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-[#0c2340] mb-4">
                    📋 Convocatorias guardadas para esta fecha
                </h3>

                {convocatoriasFecha.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No hay convocatorias guardadas.</p>
                ) : (
                    <div className="space-y-3">
                        {convocatoriasFecha.map((conv) => {
                            const ocupadas = getPlazasOcupadas(conv.id);
                            const enEspera = (listaEspera[conv.id] || []).length;
                            const disponibles = (conv.plazas_totales || 10) - ocupadas;
                            return (
                                <div key={conv.id} className="flex flex-wrap justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200 hover:shadow-md transition">
                                    <div>
                                        <div className="font-semibold text-[#0c2340]">
                                            {conv.hora_inicio} - {conv.hora_fin}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            📚 {conv.modulo_id} - {nombresModulos[conv.modulo_id] || conv.modulo_id} · 
                                            🎟️ {disponibles}/{conv.plazas_totales || 10} plazas libres
                                            {enEspera > 0 && (
                                                <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                                                    ⏳ {enEspera} en espera
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-2 sm:mt-0 flex-wrap">
                                        <button
                                            onClick={() => {
                                                const alumnosConv = getAlumnosConvocatoria(conv.id);
                                                const espera = getListaEsperaConvocatoria(conv.id);
                                                let msg = `✅ Alumnos confirmados (${alumnosConv.length}):\n`;
                                                alumnosConv.forEach(a => {
                                                    msg += `- ${a.nombre} ${a.apellido || ''} (${a.documento || 'Sin DNI'})\n`;
                                                });
                                                if (espera.length > 0) {
                                                    msg += `\n⏳ Lista de espera (${espera.length}):\n`;
                                                    espera.forEach((a, i) => {
                                                        msg += `- #${i+1} ${a.nombre} ${a.apellido || ''} (${a.documento || 'Sin DNI'})\n`;
                                                    });
                                                }
                                                alert(msg);
                                            }}
                                            className="bg-[#17a2b8] hover:bg-[#138496] text-white px-3 py-1.5 rounded-lg text-sm transition"
                                        >
                                            <i className="fas fa-users"></i> Ver
                                        </button>
                                        {enEspera > 0 && (
                                            <button
                                                onClick={() => reasignarPlaza(conv.id)}
                                                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-sm transition"
                                            >
                                                <i className="fas fa-arrow-right"></i> Reasignar
                                            </button>
                                        )}
                                        <button
                                            onClick={() => eliminarConvocatoriaGuardada(conv.id)}
                                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm transition"
                                        >
                                            <i className="fas fa-trash"></i> Eliminar
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="mt-6 pt-4 border-t border-gray-200 flex flex-wrap items-center gap-4">
                    <button
                        onClick={descargarConvocatoriaExcel}
                        className="bg-gradient-to-r from-[#28a745] to-[#1e7e34] text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition hover:shadow-lg flex items-center gap-2"
                    >
                        <i className="fas fa-download"></i> 📥 Descargar convocatoria (Excel)
                    </button>
                    <span className="text-sm text-gray-500">
                        <i className="fas fa-info-circle"></i> Genera un Excel con todos los módulos y alumnos apuntados
                    </span>
                </div>
            </div>

            {/* ============================================================ */}
            {/* SECCIÓN 3: CONVOCATORIAS ACTIVAS AGRUPADAS POR SEMANA */}
            {/* ============================================================ */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-[#0c2340] mb-4 flex flex-wrap justify-between items-center gap-2">
                    <span>📋 Convocatorias Activas (Todas)</span>
                    <div className="flex gap-2">
                        <button
                            onClick={async () => {
                                await cargarDatos();
                                setRefreshKey(prev => prev + 1);
                            }}
                            className="bg-[#007bff] hover:bg-[#0056b3] text-white px-4 py-2 rounded-xl text-sm transition flex items-center gap-2"
                        >
                            <i className="fas fa-sync"></i> Recargar
                        </button>
                        <button
                            onClick={() => {
                                // 🔥 Forzar recarga de página para depuración
                                window.location.reload();
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm transition flex items-center gap-2"
                        >
                            <i className="fas fa-power-off"></i> Forzar Recarga
                        </button>
                    </div>
                </h3>

                <div className="text-sm text-gray-400 mb-2">
                    Convocatorias en estado: {convocatorias.length} total, {convocatoriasActivas.length} activas
                </div>

                {semanasOrdenadas.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No hay convocatorias activas.</p>
                ) : (
                    <div className="space-y-4">
                        {semanasOrdenadas.map(semana => {
                            const totalConvs = convocatoriasPorSemana[semana]?.length || 0;
                            return (
                                <div key={semana} className="border border-gray-200 rounded-xl overflow-hidden">
                                    <div className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 flex justify-between items-center transition">
                                        <button
                                            onClick={() => toggleWeek(semana)}
                                            className="flex-1 text-left font-semibold text-[#0c2340] flex items-center gap-2"
                                        >
                                            <span>📅 Semana {semana}</span>
                                            <span className="text-sm font-normal text-gray-500">({totalConvs} convocatorias)</span>
                                        </button>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => exportarSemanaCompleta(semana)}
                                                className="bg-[#28a745] hover:bg-[#218838] text-white px-3 py-1.5 rounded-lg text-sm transition flex items-center gap-1"
                                            >
                                                <i className="fas fa-download"></i> Exportar semana completa
                                            </button>
                                            <button
                                                onClick={() => toggleWeek(semana)}
                                                className="text-2xl text-[#0c2340] px-2"
                                            >
                                                {expandedWeeks[semana] ? '▲' : '▼'}
                                            </button>
                                        </div>
                                    </div>

                                    {expandedWeeks[semana] && (
                                        <div className="p-4 space-y-3 bg-white">
                                            {convocatoriasPorSemana[semana].map(conv => {
                                                const ocupadas = getPlazasOcupadas(conv.id);
                                                const enEspera = (listaEspera[conv.id] || []).length;
                                                const disponibles = (conv.plazas_totales || 10) - ocupadas;

                                                return (
                                                    <div key={conv.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200 hover:shadow-md transition">
                                                        <div className="flex flex-wrap justify-between items-center">
                                                            <div>
                                                                <div className="font-semibold text-[#0c2340]">
                                                                    {conv.modulo_id} - {nombresModulos[conv.modulo_id] || conv.modulo_id}
                                                                </div>
                                                                <div className="text-sm text-gray-600">
                                                                    📅 {conv.fecha} · {conv.hora_inicio} - {conv.hora_fin}
                                                                </div>
                                                                <div className="text-sm text-gray-600">
                                                                    🎟️ {disponibles}/{conv.plazas_totales || 10} plazas libres
                                                                    <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                                                        {ocupadas} confirmados
                                                                    </span>
                                                                    {enEspera > 0 && (
                                                                        <span className="ml-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                                                                            ⏳ {enEspera} en espera
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2 mt-2 sm:mt-0 flex-wrap">
                                                                <button
                                                                    onClick={() => exportarAlumnosConvocatoria(conv.id)}
                                                                    className="bg-[#17a2b8] hover:bg-[#138496] text-white px-3 py-1.5 rounded-lg text-sm transition flex items-center gap-1"
                                                                >
                                                                    <i className="fas fa-download"></i> Exportar
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        const alumnosConv = getAlumnosConvocatoria(conv.id);
                                                                        const espera = getListaEsperaConvocatoria(conv.id);
                                                                        let msg = `✅ Alumnos confirmados (${alumnosConv.length}):\n`;
                                                                        alumnosConv.forEach(a => {
                                                                            msg += `- ${a.nombre} ${a.apellido || ''} (${a.documento || 'Sin DNI'})\n`;
                                                                        });
                                                                        if (espera.length > 0) {
                                                                            msg += `\n⏳ Lista de espera (${espera.length}):\n`;
                                                                            espera.forEach((a, i) => {
                                                                                msg += `- #${i+1} ${a.nombre} ${a.apellido || ''} (${a.documento || 'Sin DNI'})\n`;
                                                                            });
                                                                        }
                                                                        alert(msg);
                                                                    }}
                                                                    className="bg-[#007bff] hover:bg-[#0056b3] text-white px-3 py-1.5 rounded-lg text-sm transition"
                                                                >
                                                                    <i className="fas fa-users"></i> Ver
                                                                </button>
                                                                {/* Botón para mostrar/ocultar lista de alumnos */}
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
                                                            </div>
                                                        </div>

                                                        {/* Lista de alumnos desplegable */}
                                                        {convocatoriasVisibles.has(conv.id) && (
                                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                                <div className="grid md:grid-cols-2 gap-4">
                                                                    {/* Confirmados */}
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

                                                                    {/* En espera */}
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
