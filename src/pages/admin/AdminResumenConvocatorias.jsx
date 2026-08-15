// src/pages/admin/AdminResumenConvocatorias.jsx
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabase';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const AdminResumenConvocatorias = () => {
    const [convocatorias, setConvocatorias] = useState([]);
    const [alumnos, setAlumnos] = useState([]);
    const [inscripciones, setInscripciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
    const [notas, setNotas] = useState({});
    const [notasOriginales, setNotasOriginales] = useState({});
    const [cambios, setCambios] = useState([]);
    const [guardando, setGuardando] = useState(false);
    const tablaRef = useRef(null);

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

    const modulosLista = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12', 'M13', 'M14', 'M15', 'M16', 'M17'];

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setLoading(true);

            const { data: alumnosData, error: alumnosError } = await supabase
                .from('alumnos')
                .select('*')
                .order('nombre', { ascending: true });

            if (alumnosError) throw alumnosError;
            setAlumnos(alumnosData || []);

            const { data: inscData, error: inscError } = await supabase
                .from('inscripciones_convocatorias')
                .select('*, convocatorias(*)')
                .eq('estado', 'Inscrito');

            if (inscError) throw inscError;
            setInscripciones(inscData || []);

            const { data: convData, error: convError } = await supabase
                .from('convocatorias')
                .select('*')
                .order('fecha', { ascending: true });

            if (convError) throw convError;
            setConvocatorias(convData || []);

            const { data: notasData, error: notasError } = await supabase
                .from('notas_alumnos')
                .select('*');

            if (notasError) {
                console.error('Error cargando notas:', notasError);
                setNotas({});
                setNotasOriginales({});
            } else {
                const notasMap = {};
                notasData.forEach(n => {
                    notasMap[`${n.alumno_id}_${n.modulo_id}`] = n.nota || '';
                });
                setNotas(notasMap);
                setNotasOriginales({ ...notasMap });
            }

        } catch (error) {
            console.error('Error cargando datos:', error);
            setMensaje({ texto: '❌ Error al cargar los datos', tipo: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleNotaChange = (alumnoId, moduloId, value) => {
        const key = `${alumnoId}_${moduloId}`;
        const notaAnterior = notas[key] || '';
        
        setNotas({ ...notas, [key]: value });
        
        if (value !== notaAnterior) {
            setCambios(prev => {
                const existente = prev.findIndex(c => c.alumnoId === alumnoId && c.moduloId === moduloId);
                if (existente >= 0) {
                    const nuevo = [...prev];
                    nuevo[existente] = { alumnoId, moduloId, nota: value };
                    return nuevo;
                }
                return [...prev, { alumnoId, moduloId, nota: value }];
            });
        } else {
            setCambios(prev => prev.filter(c => !(c.alumnoId === alumnoId && c.moduloId === moduloId)));
        }
    };

    const guardarTodosCambios = async () => {
        if (cambios.length === 0) {
            setMensaje({ texto: '⚠️ No hay cambios para guardar', tipo: 'info' });
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 2000);
            return;
        }

        try {
            setGuardando(true);
            let guardados = 0;
            let errores = 0;

            for (const cambio of cambios) {
                const { alumnoId, moduloId, nota } = cambio;
                
                let notaFinal = nota.trim();
                if (notaFinal === '') notaFinal = 'N/A';

                if (notaFinal !== 'N/A' && notaFinal !== 'NP') {
                    const num = parseFloat(notaFinal);
                    if (!isNaN(num) && (num < 0 || num > 100)) {
                        errores++;
                        continue;
                    }
                }

                try {
                    const { error } = await supabase
                        .from('notas_alumnos')
                        .upsert(
                            {
                                alumno_id: alumnoId,
                                modulo_id: moduloId,
                                nota: notaFinal,
                                updated_at: new Date().toISOString()
                            },
                            { 
                                onConflict: 'alumno_id, modulo_id',
                                ignoreDuplicates: false 
                            }
                        );

                    if (error) {
                        console.error('Error en upsert:', error);
                        errores++;
                        continue;
                    }

                    const numNota = parseFloat(notaFinal);
                    if (!isNaN(numNota) && numNota >= 70) {
                        await marcarModuloAprobado(alumnoId, moduloId, notaFinal);
                    }
                    guardados++;

                } catch (err) {
                    console.error('Error individual:', err);
                    errores++;
                }
            }

            setNotasOriginales({ ...notas });
            setCambios([]);

            if (errores > 0) {
                setMensaje({ 
                    texto: `⚠️ ${guardados} guardados, ${errores} errores.`, 
                    tipo: 'error' 
                });
            } else {
                setMensaje({ texto: `✅ ${guardados} cambios guardados correctamente`, tipo: 'success' });
            }

        } catch (error) {
            console.error('Error general:', error);
            setMensaje({ texto: '❌ Error al guardar: ' + error.message, tipo: 'error' });
        } finally {
            setGuardando(false);
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 4000);
        }
    };

    const marcarModuloAprobado = async (alumnoId, moduloId, nota) => {
        try {
            const { data: alumno, error: alumnoError } = await supabase
                .from('alumnos')
                .select('progreso')
                .eq('id', alumnoId)
                .single();

            if (alumnoError) throw alumnoError;

            const progreso = alumno.progreso || {};
            
            progreso[moduloId] = {
                ...progreso[moduloId],
                aprobado: true,
                nota: nota,
                fecha_aprobacion: new Date().toISOString().split('T')[0]
            };

            const { error } = await supabase
                .from('alumnos')
                .update({ progreso: progreso })
                .eq('id', alumnoId);

            if (error) throw error;

        } catch (error) {
            console.error('Error marcando módulo aprobado:', error);
        }
    };

    const getColorNota = (nota) => {
        if (!nota || nota === 'N/A' || nota === 'NP' || nota === '') return 'bg-gray-50 border-gray-200 text-gray-400';
        const num = parseFloat(nota.replace(',', '.'));
        if (isNaN(num)) return 'bg-gray-50 border-gray-200';
        if (num >= 70) return 'bg-green-50 border-green-500 text-green-700';
        return 'bg-red-50 border-red-500 text-red-700';
    };

    const exportarPDF = async () => {
        if (!tablaRef.current) return;

        try {
            setMensaje({ texto: '⏳ Generando PDF...', tipo: 'info' });

            const container = document.createElement('div');
            container.style.padding = '20px';
            container.style.backgroundColor = '#ffffff';
            container.style.fontFamily = 'Arial, sans-serif';
            container.style.width = '100%';
            container.style.maxWidth = '1200px';
            container.style.margin = '0 auto';

            const titulo = document.createElement('h2');
            titulo.textContent = 'Resumen de Convocatorias - Todos los Módulos';
            titulo.style.color = '#0c2340';
            titulo.style.marginBottom = '8px';
            titulo.style.fontSize = '18px';
            titulo.style.fontWeight = 'bold';
            container.appendChild(titulo);

            const fecha = document.createElement('p');
            fecha.textContent = `Fecha: ${new Date().toLocaleDateString('es-ES')}`;
            fecha.style.color = '#666';
            fecha.style.fontSize = '12px';
            fecha.style.marginBottom = '15px';
            container.appendChild(fecha);

            const clone = tablaRef.current.cloneNode(true);
            
            const botones = clone.querySelectorAll('button');
            botones.forEach(b => b.remove());

            const inputs = clone.querySelectorAll('input');
            inputs.forEach(input => {
                const value = input.value || 'N/A';
                const span = document.createElement('span');
                span.textContent = value;
                span.style.display = 'inline-block';
                span.style.padding = '4px 8px';
                span.style.borderRadius = '4px';
                span.style.fontWeight = 'bold';
                
                const num = parseFloat(value);
                if (value === 'N/A' || value === 'NP' || value === '') {
                    span.style.backgroundColor = '#e9ecef';
                    span.style.color = '#6c757d';
                } else if (!isNaN(num) && num >= 70) {
                    span.style.backgroundColor = '#d4edda';
                    span.style.color = '#155724';
                } else if (!isNaN(num)) {
                    span.style.backgroundColor = '#f8d7da';
                    span.style.color = '#721c24';
                }
                
                input.parentNode.replaceChild(span, input);
            });

            container.appendChild(clone);

            const style = document.createElement('style');
            style.textContent = `
                table { border-collapse: collapse; width: 100%; font-size: 10px; font-family: Arial, sans-serif; }
                th { background-color: #0c2340 !important; color: white !important; padding: 4px 2px !important; border: 1px solid #0c2340 !important; text-align: center !important; font-weight: bold !important; }
                td { padding: 4px 2px !important; border: 1px solid #ddd !important; text-align: center !important; }
                tr:nth-child(even) { background-color: #f9f9f9 !important; }
            `;
            container.appendChild(style);

            document.body.appendChild(container);

            const canvas = await html2canvas(container, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true,
                logging: false,
                width: container.scrollWidth,
                windowWidth: container.scrollWidth
            });

            document.body.removeChild(container);

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const pdf = new jsPDF('l', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`resumen_todos_modulos_${new Date().toISOString().split('T')[0]}.pdf`);

            setMensaje({ texto: '✅ PDF descargado correctamente', tipo: 'success' });

        } catch (error) {
            console.error('Error generando PDF:', error);
            setMensaje({ texto: '❌ Error al generar el PDF', tipo: 'error' });
        } finally {
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="text-4xl animate-spin">📊</div>
                    <p className="mt-4 text-gray-500">Cargando resumen...</p>
                </div>
            </div>
        );
    }

    // Obtener TODOS los alumnos que están inscritos en ALGUNA convocatoria
    const alumnosInscritos = alumnos.filter(alumno => {
        return inscripciones.some(i => i.alumno_id === alumno.id);
    });

    const tieneCambiosPendientes = cambios.length > 0;

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-[#0a1a2f] to-[#0c2340] rounded-2xl p-6 text-white">
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <i className="fas fa-chart-bar text-[#20c997]"></i>
                            Resumen de Convocatorias
                        </h1>
                        <p className="text-gray-300 text-sm mt-1">
                            Gestiona las notas de los alumnos por módulo
                        </p>
                    </div>
                    <button
                        onClick={exportarPDF}
                        className="bg-[#dc3545] hover:bg-[#c82333] text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2"
                    >
                        <i className="fas fa-file-pdf"></i> Exportar PDF
                    </button>
                </div>
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

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-wrap items-center gap-4">
                <span className="font-semibold text-[#0c2340]">
                    📊 Todos los módulos
                </span>
                <span className="text-sm text-gray-500">
                    {alumnosInscritos.length} alumnos inscritos en convocatorias
                </span>
                {tieneCambiosPendientes && (
                    <span className="text-sm text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
                        ⚠️ {cambios.length} cambios pendientes
                    </span>
                )}
            </div>

            <div ref={tablaRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr className="bg-[#0c2340] text-white">
                                <th className="p-3 text-left sticky left-0 bg-[#0c2340] min-w-[150px] z-10">STUDENT NAME</th>
                                {modulosLista.map(m => (
                                    <th key={m} className="p-3 text-center min-w-[60px] text-xs">
                                        <div>{m}</div>
                                        <div className="text-[8px] font-normal text-gray-300">{nombresModulos[m].substring(0, 6)}</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {alumnosInscritos.length === 0 ? (
                                <tr>
                                    <td colSpan={modulosLista.length + 1} className="p-6 text-center text-gray-500">
                                        No hay alumnos inscritos en convocatorias
                                    </td>
                                </tr>
                            ) : (
                                alumnosInscritos.map((alumno, rowIndex) => {
                                    // Verificar en qué módulos está inscrito
                                    const modulosInscritos = modulosLista.filter(m => {
                                        return convocatorias.some(conv => {
                                            return conv.modulo_id === m && inscripciones.some(i => 
                                                i.convocatoria_id === conv.id && i.alumno_id === alumno.id
                                            );
                                        });
                                    });

                                    return (
                                        <tr key={alumno.id} className={`border-b border-gray-100 hover:bg-gray-50 transition ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                            <td className="p-3 font-medium text-[#0c2340] sticky left-0 bg-inherit z-10">
                                                {alumno.nombre} {alumno.apellido || ''}
                                            </td>
                                            {modulosLista.map(m => {
                                                const estaInscrito = modulosInscritos.includes(m);
                                                const key = `${alumno.id}_${m}`;
                                                const nota = notas[key] || '';

                                                if (!estaInscrito) {
                                                    return (
                                                        <td key={`${alumno.id}_${m}`} className="p-2 text-center text-gray-300">
                                                            —
                                                        </td>
                                                    );
                                                }

                                                return (
                                                    <td key={`${alumno.id}_${m}`} className="p-2 text-center">
                                                        <input
                                                            type="text"
                                                            value={nota}
                                                            onChange={(e) => handleNotaChange(alumno.id, m, e.target.value)}
                                                            className={`w-full max-w-[55px] px-1.5 py-1.5 rounded-lg text-center font-semibold border-2 focus:outline-none focus:ring-2 focus:ring-[#20c997] ${getColorNota(nota)}`}
                                                            placeholder="N/A"
                                                        />
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-6">
                    <span className="text-sm font-semibold text-gray-700">📌 Leyenda:</span>
                    <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded bg-green-500"></span>
                        <span className="text-sm text-gray-600">Aprobado (≥70)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded bg-red-500"></span>
                        <span className="text-sm text-gray-600">Suspenso (&lt;70)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded bg-gray-300"></span>
                        <span className="text-sm text-gray-600">N/A - No presentado</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">—</span>
                        <span className="text-sm text-gray-600">No inscrito</span>
                    </div>
                </div>
                <button
                    onClick={guardarTodosCambios}
                    disabled={!tieneCambiosPendientes || guardando}
                    className={`px-6 py-2.5 rounded-xl font-semibold transition flex items-center gap-2 ${
                        tieneCambiosPendientes && !guardando
                            ? 'bg-gradient-to-r from-[#20c997] to-[#0c2340] text-white hover:shadow-lg'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                    <i className="fas fa-save"></i>
                    {guardando ? 'Guardando...' : `Guardar (${cambios.length} cambios)`}
                </button>
            </div>
        </div>
    );
};

export default AdminResumenConvocatorias;
