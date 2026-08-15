// src/pages/admin/ExpedienteAlumno.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const ExpedienteAlumno = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [alumno, setAlumno] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        documento: '',
        telefono: '',
        email: '',
        username: '',
        password: '',
        licencia: 'B1.1',
        estado: 'Activo'
    });
    const [modulos, setModulos] = useState([]);
    const [conexiones, setConexiones] = useState([]);
    const [totalMinutos, setTotalMinutos] = useState(0);
    const [mostrarTodos, setMostrarTodos] = useState(false);
    const expedienteRef = useRef(null);

    const nombresModulos = {
        1: 'Matemáticas',
        2: 'Física',
        3: 'Electricidad',
        4: 'Electrónica',
        5: 'Tec. Digitales',
        6: 'Materiales',
        7: 'Prácticas Mant.',
        8: 'Aerodinámica',
        9: 'Factores Humanos',
        10: 'Legislación',
        11: 'Estructuras Avión',
        12: 'Helicópteros',
        13: 'Aviónica',
        14: 'Propulsión',
        15: 'Turbinas',
        16: 'Alternativos',
        17: 'Hélices'
    };

    useEffect(() => {
        if (id) {
            cargarAlumnoDesdeSupabase();
        }
    }, [id]);

    // ✅ CARGAR ALUMNO DESDE SUPABASE
    const cargarAlumnoDesdeSupabase = async () => {
        try {
            setLoading(true);
            
            const { data, error } = await supabase
                .from('alumnos')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error cargando alumno:', error);
                setMensaje({ texto: '❌ Error al cargar el alumno', tipo: 'error' });
                setLoading(false);
                return;
            }

            if (!data) {
                setMensaje({ texto: '❌ Alumno no encontrado', tipo: 'error' });
                setLoading(false);
                return;
            }

            setAlumno(data);
            setFormData({
                nombre: data.nombre || '',
                apellido: data.apellido || '',
                documento: data.documento || '',
                telefono: data.telefono || '',
                email: data.email || '',
                username: data.username || '',
                password: '********',
                licencia: data.licencia || 'B1.1',
                estado: data.activo ? 'Activo' : 'Finalizado'
            });

            // ✅ CARGAR MÓDULOS DESDE SUPABASE
            const progreso = data.progreso || {};
            const habilitados = data.habilitados || [];
            const modulosData = [];

            console.log('📦 Habilitados desde BD:', habilitados);
            console.log('📦 Progreso desde BD:', progreso);

            for (let i = 1; i <= 17; i++) {
                const key = 'M' + i;
                modulosData.push({
                    id: key,
                    nombre: nombresModulos[i] || 'Módulo ' + i,
                    mostrar: habilitados.includes(key) || false,
                    cursando: progreso[key]?.cursando || false,
                    aprobado: progreso[key]?.aprobado || false,
                    fecha: progreso[key]?.fecha_aprobacion || ''
                });
            }
            setModulos(modulosData);

            // Cargar conexiones
            await cargarConexionesReales(data.id);

        } catch (error) {
            console.error('Error:', error);
            setMensaje({ texto: '❌ Error al cargar el expediente', tipo: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // ✅ CARGAR CONEXIONES REALES
    const cargarConexionesReales = async (alumnoId) => {
        try {
            const { data, error } = await supabase
                .from('conexiones')
                .select('*')
                .eq('alumno_id', alumnoId)
                .order('fecha', { ascending: false });

            if (error) throw error;

            if (data && data.length > 0) {
                const conexionesFormateadas = data.map(conn => ({
                    id: conn.id,
                    fecha: conn.fecha,
                    entrada: conn.entrada.substring(0, 5),
                    salida: conn.salida ? conn.salida.substring(0, 5) : '00:00'
                }));
                setConexiones(conexionesFormateadas);
                recalcularTotalMinutos(conexionesFormateadas);
            } else {
                setConexiones([]);
                setTotalMinutos(0);
            }
        } catch (error) {
            console.error('Error cargando conexiones:', error);
            setConexiones([]);
            setTotalMinutos(0);
        }
    };

    // ✅ GUARDAR CONEXIONES
    const guardarConexiones = async () => {
        try {
            const { error: deleteError } = await supabase
                .from('conexiones')
                .delete()
                .eq('alumno_id', id);

            if (deleteError) throw deleteError;

            if (conexiones.length > 0) {
                const conexionesParaInsertar = conexiones.map(conn => ({
                    alumno_id: id,
                    fecha: conn.fecha,
                    entrada: conn.entrada + ':00',
                    salida: conn.salida !== '00:00' ? conn.salida + ':00' : null
                }));

                const { error: insertError } = await supabase
                    .from('conexiones')
                    .insert(conexionesParaInsertar);

                if (insertError) throw insertError;
            }

            return { success: true };
        } catch (error) {
            console.error('Error guardando conexiones:', error);
            return { success: false, error: error.message };
        }
    };

    const recalcularTotalMinutos = (conexionesData) => {
        let total = 0;
        conexionesData.forEach(conn => {
            const entrada = conn.entrada || '00:00';
            const salida = conn.salida || '00:00';
            const minutos = calcularDiferenciaMinutos(entrada, salida);
            total += minutos;
        });
        setTotalMinutos(total);
    };

    const calcularDiferenciaMinutos = (horaEntrada, horaSalida) => {
        if (!horaEntrada || !horaSalida) return 0;
        const [h1, m1] = horaEntrada.split(':').map(Number);
        const [h2, m2] = horaSalida.split(':').map(Number);
        let minutosEntrada = h1 * 60 + m1;
        let minutosSalida = h2 * 60 + m2;
        if (minutosSalida < minutosEntrada) {
            minutosSalida += 24 * 60;
        }
        return minutosSalida - minutosEntrada;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleModuloChange = (index, field, value) => {
        const nuevosModulos = [...modulos];
        nuevosModulos[index][field] = value;
        if (field === 'aprobado' && !value) {
            nuevosModulos[index].fecha = '';
        }
        setModulos(nuevosModulos);
    };

    const handleConexionChange = (index, field, value) => {
        const nuevasConexiones = [...conexiones];
        nuevasConexiones[index][field] = value;
        setConexiones(nuevasConexiones);
        recalcularTotalMinutos(nuevasConexiones);
    };

    const toggleMostrarTodos = () => {
        const nuevoEstado = !mostrarTodos;
        setMostrarTodos(nuevoEstado);
        const nuevosModulos = modulos.map(m => ({ ...m, mostrar: nuevoEstado }));
        setModulos(nuevosModulos);
    };

    // ✅ GUARDAR CAMBIOS EN SUPABASE
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // 1. Construir progreso y habilitados
            const progreso = {};
            const habilitados = [];
            modulos.forEach(m => {
                if (m.mostrar) habilitados.push(m.id);
                progreso[m.id] = {
                    cursando: m.cursando || false,
                    aprobado: m.aprobado || false,
                    fecha_aprobacion: m.aprobado ? m.fecha : ''
                };
            });

            console.log('📦 Guardando habilitados:', habilitados);
            console.log('📦 Guardando progreso:', progreso);

            // 2. Actualizar en Supabase
            const { error } = await supabase
                .from('alumnos')
                .update({
                    nombre: formData.nombre,
                    apellido: formData.apellido || '',
                    documento: formData.documento,
                    telefono: formData.telefono || '',
                    email: formData.email,
                    username: formData.username,
                    licencia: formData.licencia,
                    activo: formData.estado === 'Activo',
                    progreso: progreso,
                    habilitados: habilitados
                })
                .eq('id', id);

            if (error) {
                console.error('Error guardando:', error);
                setMensaje({ texto: '❌ Error al guardar: ' + error.message, tipo: 'error' });
                return;
            }

            // 3. Guardar conexiones
            const resultadoConexiones = await guardarConexiones();
            if (!resultadoConexiones.success) {
                setMensaje({ texto: '⚠️ Alumno guardado pero error en conexiones', tipo: 'error' });
                return;
            }

            setMensaje({ texto: '✅ Cambios guardados correctamente', tipo: 'success' });
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);

            // 4. Recargar datos
            await cargarAlumnoDesdeSupabase();

        } catch (error) {
            console.error('Error:', error);
            setMensaje({ texto: '❌ Error al guardar: ' + error.message, tipo: 'error' });
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('aerotraining_token');
        localStorage.removeItem('aerotraining_user');
        navigate('/login');
    };

    // ============================================================
    // GENERAR PDF
    // ============================================================
    const descargarPDF = async () => {
        try {
            setMensaje({ texto: '⏳ Generando PDF...', tipo: 'info' });

            const generarPaginaPDF = (contenido, esPrimera = true) => {
                const encabezado = esPrimera ? `
                    <div style="text-align:center; border-bottom:4px solid #0c2340; padding-bottom:15px; margin-bottom:25px;">
                        <div style="display:flex; align-items:center; justify-content:center; gap:12px;">
                            <span style="font-size:32px;">✈️</span>
                            <h1 style="font-size:26px; font-weight:900; color:#0c2340; margin:0;">AeroTraining 66</h1>
                        </div>
                        <p style="font-size:15px; font-weight:600; color:#6c757d; margin:4px 0;">Formación EASA Part 66 - Licencias TMA</p>
                        <div style="display:inline-block; background-color:#0c2340; color:#20c997; font-size:12px; font-weight:bold; padding:5px 20px; border-radius:20px; margin-top:4px;">
                            Centro Autorizado · EASA Part 147
                        </div>
                    </div>
                ` : `
                    <div style="text-align:center; border-bottom:3px solid #0c2340; padding-bottom:10px; margin-bottom:20px;">
                        <div style="display:flex; align-items:center; justify-content:center; gap:10px;">
                            <span style="font-size:24px;">✈️</span>
                            <h2 style="font-size:20px; font-weight:800; color:#0c2340; margin:0;">AeroTraining 66</h2>
                        </div>
                        <p style="font-size:12px; font-weight:500; color:#6c757d; margin:2px 0;">Expediente Académico - Continuación</p>
                    </div>
                `;

                const footer = `
                    <div style="text-align:center; font-size:10px; color:#6c757d; border-top:2px solid #dee2e6; padding-top:10px; margin-top:20px;">
                        Documento oficial de trazabilidad EASA Part 66.
                        <br />
                        Fecha de emisión: ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </div>
                `;

                return `
                    <div style="width:794px; min-height:1123px; background:#ffffff; padding:40px 50px; font-family:Arial, Helvetica, sans-serif; color:#0c2340; font-size:14px; line-height:1.5; box-sizing:border-box;">
                        ${encabezado}
                        ${contenido}
                        ${footer}
                    </div>
                `;
            };

            // PÁGINA 1
            const modulosHTML1 = modulos.slice(0, 10).map((modulo, index) => {
                const bgColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
                return `
                    <tr style="background-color:${bgColor};">
                        <td style="padding:6px 10px; border:1px solid #dee2e6; font-weight:600; font-size:12px;">${modulo.id} - ${modulo.nombre}</td>
                        <td style="padding:6px 10px; border:1px solid #dee2e6; text-align:center; font-size:12px;">${modulo.mostrar ? '✅' : '—'}</td>
                        <td style="padding:6px 10px; border:1px solid #dee2e6; text-align:center; font-size:12px;">${modulo.cursando ? '✅' : '—'}</td>
                        <td style="padding:6px 10px; border:1px solid #dee2e6; text-align:center; font-size:12px;">${modulo.aprobado ? '✅' : '—'}</td>
                        <td style="padding:6px 10px; border:1px solid #dee2e6; text-align:center; font-size:12px;">${modulo.aprobado && modulo.fecha ? modulo.fecha : '—'}</td>
                    </tr>
                `;
            }).join('');

            const pagina1 = `
                <h3 style="font-size:17px; font-weight:bold; color:#0c2340; border-bottom:2px solid #20c997; padding-bottom:8px; margin-bottom:16px;">
                    📋 Datos del Alumno
                </h3>
                <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:10px; background:#f8f9fa; padding:16px; border-radius:10px; margin-bottom:25px; border:1px solid #e9ecef;">
                    <div>
                        <p style="font-size:10px; font-weight:bold; color:#6c757d; margin:0; text-transform:uppercase; letter-spacing:0.5px;">Nombre</p>
                        <p style="font-weight:bold; margin:4px 0 0; font-size:14px; color:#0c2340;">${formData.nombre || '—'} ${formData.apellido || ''}</p>
                    </div>
                    <div>
                        <p style="font-size:10px; font-weight:bold; color:#6c757d; margin:0; text-transform:uppercase; letter-spacing:0.5px;">DNI / NIE</p>
                        <p style="font-weight:bold; margin:4px 0 0; font-size:14px; color:#0c2340;">${formData.documento || '—'}</p>
                    </div>
                    <div>
                        <p style="font-size:10px; font-weight:bold; color:#6c757d; margin:0; text-transform:uppercase; letter-spacing:0.5px;">Teléfono</p>
                        <p style="font-weight:bold; margin:4px 0 0; font-size:14px; color:#0c2340;">${formData.telefono || '—'}</p>
                    </div>
                    <div>
                        <p style="font-size:10px; font-weight:bold; color:#6c757d; margin:0; text-transform:uppercase; letter-spacing:0.5px;">Email</p>
                        <p style="font-weight:bold; margin:4px 0 0; font-size:14px; color:#0c2340;">${formData.email || '—'}</p>
                    </div>
                    <div>
                        <p style="font-size:10px; font-weight:bold; color:#6c757d; margin:0; text-transform:uppercase; letter-spacing:0.5px;">Usuario</p>
                        <p style="font-weight:bold; margin:4px 0 0; font-size:14px; color:#0c2340;">${formData.username || '—'}</p>
                    </div>
                    <div>
                        <p style="font-size:10px; font-weight:bold; color:#6c757d; margin:0; text-transform:uppercase; letter-spacing:0.5px;">Licencia</p>
                        <p style="font-weight:bold; margin:4px 0 0; font-size:14px; color:#0c2340;">
                            <span style="background-color:#0c2340; color:white; padding:2px 14px; border-radius:12px; font-size:12px;">${formData.licencia || 'B1.1'}</span>
                        </p>
                    </div>
                    <div>
                        <p style="font-size:10px; font-weight:bold; color:#6c757d; margin:0; text-transform:uppercase; letter-spacing:0.5px;">Estado</p>
                        <p style="font-weight:bold; margin:4px 0 0; font-size:14px; color:${formData.estado === 'Activo' ? '#28a745' : '#6c757d'};">${formData.estado || 'Activo'}</p>
                    </div>
                </div>

                <h3 style="font-size:17px; font-weight:bold; color:#0c2340; border-bottom:2px solid #20c997; padding-bottom:8px; margin-bottom:16px;">
                    📚 Módulos EASA (1/2)
                </h3>
                <table style="width:100%; border-collapse:collapse; font-size:12px; border-radius:8px; overflow:hidden;">
                    <thead>
                        <tr style="background-color:#0c2340; color:white;">
                            <th style="padding:8px 12px; text-align:left; border:1px solid #0c2340; font-size:12px;">Módulo</th>
                            <th style="padding:8px 12px; text-align:center; border:1px solid #0c2340; font-size:12px;">Mostrar</th>
                            <th style="padding:8px 12px; text-align:center; border:1px solid #0c2340; font-size:12px;">Cursa</th>
                            <th style="padding:8px 12px; text-align:center; border:1px solid #0c2340; font-size:12px;">Aprobado</th>
                            <th style="padding:8px 12px; text-align:center; border:1px solid #0c2340; font-size:12px;">Fecha</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${modulosHTML1}
                    </tbody>
                </table>
            `;

            // PÁGINA 2
            const modulosHTML2 = modulos.slice(10, 17).map((modulo, index) => {
                const bgColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
                return `
                    <tr style="background-color:${bgColor};">
                        <td style="padding:6px 10px; border:1px solid #dee2e6; font-weight:600; font-size:12px;">${modulo.id} - ${modulo.nombre}</td>
                        <td style="padding:6px 10px; border:1px solid #dee2e6; text-align:center; font-size:12px;">${modulo.mostrar ? '✅' : '—'}</td>
                        <td style="padding:6px 10px; border:1px solid #dee2e6; text-align:center; font-size:12px;">${modulo.cursando ? '✅' : '—'}</td>
                        <td style="padding:6px 10px; border:1px solid #dee2e6; text-align:center; font-size:12px;">${modulo.aprobado ? '✅' : '—'}</td>
                        <td style="padding:6px 10px; border:1px solid #dee2e6; text-align:center; font-size:12px;">${modulo.aprobado && modulo.fecha ? modulo.fecha : '—'}</td>
                    </tr>
                `;
            }).join('');

            const conexionesHTML = conexiones.map((conn, index) => {
                const minutos = calcularDiferenciaMinutos(conn.entrada, conn.salida);
                const bgColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
                const esActiva = conn.salida === '00:00' || conn.salida === '';
                return `
                    <tr style="background-color:${bgColor};">
                        <td style="padding:6px 10px; border:1px solid #dee2e6; font-weight:600; font-size:12px;">${conn.fecha}</td>
                        <td style="padding:6px 10px; border:1px solid #dee2e6; text-align:center; font-size:12px;">${conn.entrada}</td>
                        <td style="padding:6px 10px; border:1px solid #dee2e6; text-align:center; font-size:12px;">${esActiva ? '🔴 En curso' : conn.salida}</td>
                        <td style="padding:6px 10px; border:1px solid #dee2e6; text-align:center; font-weight:bold; font-size:12px;">${minutos.toFixed(2)}</td>
                    </tr>
                `;
            }).join('');

            const pagina2 = `
                <h3 style="font-size:17px; font-weight:bold; color:#0c2340; border-bottom:2px solid #20c997; padding-bottom:8px; margin-bottom:16px;">
                    📚 Módulos EASA (2/2)
                </h3>
                <table style="width:100%; border-collapse:collapse; font-size:12px; border-radius:8px; overflow:hidden; margin-bottom:25px;">
                    <thead>
                        <tr style="background-color:#0c2340; color:white;">
                            <th style="padding:8px 12px; text-align:left; border:1px solid #0c2340; font-size:12px;">Módulo</th>
                            <th style="padding:8px 12px; text-align:center; border:1px solid #0c2340; font-size:12px;">Mostrar</th>
                            <th style="padding:8px 12px; text-align:center; border:1px solid #0c2340; font-size:12px;">Cursa</th>
                            <th style="padding:8px 12px; text-align:center; border:1px solid #0c2340; font-size:12px;">Aprobado</th>
                            <th style="padding:8px 12px; text-align:center; border:1px solid #0c2340; font-size:12px;">Fecha</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${modulosHTML2}
                    </tbody>
                </table>

                <h3 style="font-size:17px; font-weight:bold; color:#0c2340; border-bottom:2px solid #20c997; padding-bottom:8px; margin-bottom:16px;">
                    📊 Historial de conexiones
                </h3>
                <table style="width:100%; border-collapse:collapse; font-size:12px; border-radius:8px; overflow:hidden;">
                    <thead>
                        <tr style="background-color:#0c2340; color:white;">
                            <th style="padding:8px 12px; text-align:left; border:1px solid #0c2340; font-size:12px;">📅 Fecha</th>
                            <th style="padding:8px 12px; text-align:center; border:1px solid #0c2340; font-size:12px;">⏰ Entrada</th>
                            <th style="padding:8px 12px; text-align:center; border:1px solid #0c2340; font-size:12px;">⏰ Salida</th>
                            <th style="padding:8px 12px; text-align:center; border:1px solid #0c2340; font-size:12px;">⏱️ Tiempo</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${conexionesHTML}
                    </tbody>
                </table>

                <div style="text-align:right; font-weight:bold; margin-top:16px; padding:12px 16px; background:linear-gradient(135deg, #e9ecef, #dee2e6); border-radius:10px; font-size:14px;">
                    📊 TOTAL ACUMULADO: <span style="color:#0c2340; font-size:16px;">${totalMinutos.toFixed(2)}</span> minutos
                </div>
            `;

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            const paginas = [
                { html: generarPaginaPDF(pagina1, true) },
                { html: generarPaginaPDF(pagina2, false) }
            ];

            for (let i = 0; i < paginas.length; i++) {
                const container = document.createElement('div');
                container.style.position = 'absolute';
                container.style.left = '-9999px';
                container.style.top = '-9999px';
                container.innerHTML = paginas[i].html;
                document.body.appendChild(container);

                const canvas = await html2canvas(container, {
                    scale: 2.0,
                    backgroundColor: '#ffffff',
                    useCORS: true,
                    logging: false,
                    allowTaint: true,
                    width: 794,
                    windowWidth: 794
                });

                document.body.removeChild(container);

                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                
                if (i > 0) {
                    pdf.addPage();
                }
                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            }

            pdf.save(`Expediente_${formData.nombre || 'alumno'}.pdf`);

            setMensaje({ texto: '✅ PDF descargado correctamente', tipo: 'success' });
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
        } catch (error) {
            console.error('Error al generar PDF:', error);
            setMensaje({ texto: '❌ Error al generar el PDF: ' + error.message, tipo: 'error' });
        }
    };

    const imprimirExpediente = () => {
        window.print();
    };

    const cerrar = () => {
        navigate('/admin/expedientes');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="text-4xl animate-spin">✈️</div>
                    <p className="mt-4 text-gray-500">Cargando expediente...</p>
                </div>
            </div>
        );
    }

    if (!alumno) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="text-6xl mb-4">❌</div>
                <h2 className="text-2xl font-bold text-[#0c2340]">Alumno no encontrado</h2>
                <button onClick={cerrar} className="mt-4 text-[#20c997] hover:underline">
                    ← Volver a expedientes
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {mensaje.texto && (
                <div className={`p-4 mx-6 mt-4 rounded-xl border-l-4 ${
                    mensaje.tipo === 'success' ? 'bg-green-50 border-green-500 text-green-700' :
                    mensaje.tipo === 'error' ? 'bg-red-50 border-red-500 text-red-700' :
                    'bg-blue-50 border-blue-500 text-blue-700'
                }`}>
                    {mensaje.texto}
                </div>
            )}

            <div className="bg-gradient-to-r from-[#0c2340] to-[#1a3a5c] p-6 text-white flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <i className="fas fa-id-card text-[#20c997]"></i>
                        Expediente EASA
                    </h3>
                    <p className="text-sm text-gray-300 mt-1">Editar módulos y trazabilidad del alumno</p>
                </div>
                <div className="flex gap-3 flex-wrap">
                    <button
                        onClick={descargarPDF}
                        className="bg-[#dc3545] hover:bg-[#c82333] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition flex items-center gap-2"
                    >
                        <i className="fas fa-file-pdf"></i> Descargar PDF
                    </button>
                    <button
                        onClick={imprimirExpediente}
                        className="bg-[#17a2b8] hover:bg-[#138496] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition flex items-center gap-2"
                    >
                        <i className="fas fa-print"></i> Imprimir
                    </button>
                    <button
                        onClick={cerrar}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition flex items-center gap-2"
                    >
                        <i className="fas fa-times"></i> Cerrar
                    </button>
                    <button
                        onClick={handleLogout}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition flex items-center gap-2"
                    >
                        <i className="fas fa-sign-out-alt"></i> Cerrar Sesión
                    </button>
                </div>
            </div>

            <div ref={expedienteRef} style={{ display: 'none' }}></div>

            <form onSubmit={handleSubmit} className="p-6">
                <div className="mb-8">
                    <h4 className="text-lg font-bold text-[#0c2340] flex items-center gap-2 mb-4">
                        <span className="w-1 h-6 bg-[#20c997] rounded-full"></span>
                        Datos del Alumno
                    </h4>
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Nombre</label>
                                <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] focus:ring-2 focus:ring-[#20c997]/20 transition text-sm bg-white" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Apellido</label>
                                <input type="text" name="apellido" value={formData.apellido} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] focus:ring-2 focus:ring-[#20c997]/20 transition text-sm bg-white" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">DNI / NIE</label>
                                <input type="text" name="documento" value={formData.documento} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] focus:ring-2 focus:ring-[#20c997]/20 transition text-sm bg-white" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Teléfono</label>
                                <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] focus:ring-2 focus:ring-[#20c997]/20 transition text-sm bg-white" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] focus:ring-2 focus:ring-[#20c997]/20 transition text-sm bg-white" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Usuario</label>
                                <input type="text" name="username" value={formData.username} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] focus:ring-2 focus:ring-[#20c997]/20 transition text-sm bg-white" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Licencia</label>
                                <select name="licencia" value={formData.licencia} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] focus:ring-2 focus:ring-[#20c997]/20 transition text-sm bg-white">
                                    <option value="B1.1">B1.1 (Turbina)</option>
                                    <option value="B2">B2 (Aviónica)</option>
                                    <option value="B1.3">B1.3 (Helicópteros)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Estado</label>
                                <select name="estado" value={formData.estado} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] focus:ring-2 focus:ring-[#20c997]/20 transition text-sm bg-white">
                                    <option value="Activo">✅ Activo</option>
                                    <option value="Finalizado">🎓 Finalizado</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-8">
                    <h4 className="text-lg font-bold text-[#0c2340] flex items-center gap-2 mb-4">
                        <span className="w-1 h-6 bg-[#20c997] rounded-full"></span>
                        Módulos EASA
                    </h4>

                    <div className="mb-4">
                        <label className="cursor-pointer flex items-center gap-3 text-sm font-semibold text-gray-700 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 transition">
                            <input type="checkbox" checked={mostrarTodos} onChange={toggleMostrarTodos} className="w-4 h-4 rounded border-gray-300 text-[#20c997] focus:ring-[#20c997]" />
                            <span>✅ Marcar todos los módulos (Mostrar)</span>
                        </label>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-gray-200">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="bg-[#0c2340] text-white">
                                    <th className="p-3 text-left rounded-tl-xl">Módulo</th>
                                    <th className="p-3 text-center">Mostrar</th>
                                    <th className="p-3 text-center">Cursa</th>
                                    <th className="p-3 text-center">Aprobado</th>
                                    <th className="p-3 text-center rounded-tr-xl">Fecha Aprobación</th>
                                </tr>
                            </thead>
                            <tbody>
                                {modulos.map((modulo, index) => (
                                    <tr key={modulo.id} className={`border-b border-gray-100 transition ${index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/50 hover:bg-gray-100'}`}>
                                        <td className="p-3 font-medium text-[#0c2340]">
                                            <span className="inline-block w-8 h-8 text-center leading-8 rounded-full bg-[#0c2340]/10 text-[#0c2340] font-bold text-xs mr-2">
                                                {modulo.id.replace('M', '')}
                                            </span>
                                            {modulo.nombre}
                                        </td>
                                        <td className="p-3 text-center">
                                            <label className="inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={modulo.mostrar} onChange={(e) => handleModuloChange(index, 'mostrar', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-[#20c997] focus:ring-[#20c997]" />
                                            </label>
                                        </td>
                                        <td className="p-3 text-center">
                                            <label className="inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={modulo.cursando} onChange={(e) => handleModuloChange(index, 'cursando', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-[#20c997] focus:ring-[#20c997]" />
                                            </label>
                                        </td>
                                        <td className="p-3 text-center">
                                            <label className="inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={modulo.aprobado} onChange={(e) => handleModuloChange(index, 'aprobado', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-[#20c997] focus:ring-[#20c997]" />
                                            </label>
                                        </td>
                                        <td className="p-3 text-center">
                                            <input type="date" value={modulo.fecha} onChange={(e) => handleModuloChange(index, 'fecha', e.target.value)} disabled={!modulo.aprobado} className={`w-full max-w-[140px] px-3 py-1.5 rounded-lg border text-sm ${!modulo.aprobado ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-50' : 'border-gray-200 focus:outline-none focus:border-[#20c997] focus:ring-2 focus:ring-[#20c997]/20'}`} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mb-8">
                    <h4 className="text-lg font-bold text-[#0c2340] flex items-center gap-2 mb-4">
                        <span className="w-1 h-6 bg-[#20c997] rounded-full"></span>
                        Historial de conexiones
                    </h4>

                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                        {conexiones.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <i className="fas fa-clock text-4xl block mb-3 opacity-50"></i>
                                <p>No hay conexiones registradas para este alumno.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-[#0c2340] text-white">
                                            <th className="p-3 text-left rounded-tl-xl">📅 Fecha</th>
                                            <th className="p-3 text-center">⏰ Entrada</th>
                                            <th className="p-3 text-center">⏰ Salida</th>
                                            <th className="p-3 text-center rounded-tr-xl">⏱️ Tiempo (min)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {conexiones.map((conn, index) => {
                                            const minutos = calcularDiferenciaMinutos(conn.entrada, conn.salida);
                                            const esActiva = conn.salida === '00:00' || conn.salida === '';
                                            return (
                                                <tr key={index} className={`border-b border-gray-200 transition ${index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/50 hover:bg-gray-100'}`}>
                                                    <td className="p-3 font-medium text-[#0c2340]">{conn.fecha}</td>
                                                    <td className="p-3 text-center">
                                                        <input type="time" value={conn.entrada} onChange={(e) => handleConexionChange(index, 'entrada', e.target.value)} className="w-24 px-2 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#20c997] focus:ring-2 focus:ring-[#20c997]/20 text-sm text-center" />
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <input type="time" value={conn.salida} onChange={(e) => handleConexionChange(index, 'salida', e.target.value)} className={`w-24 px-2 py-1.5 rounded-lg border text-sm text-center ${esActiva ? 'border-yellow-300 bg-yellow-50 text-yellow-700' : 'border-gray-200 focus:outline-none focus:border-[#20c997] focus:ring-2 focus:ring-[#20c997]/20'}`} placeholder="00:00" />
                                                        {esActiva && <span className="ml-1 text-xs text-yellow-600 font-medium">🔴 En curso</span>}
                                                    </td>
                                                    <td className="p-3 text-center font-bold text-[#0c2340]">{minutos.toFixed(2)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="text-right font-bold mt-4 p-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl">
                            📊 TOTAL ACUMULADO: <span className="text-[#0c2340] text-lg">{totalMinutos.toFixed(2)}</span> minutos
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                    <button type="submit" className="w-full bg-gradient-to-r from-[#20c997] to-[#0c2340] text-white py-4 rounded-xl font-bold text-base hover:shadow-lg hover:shadow-[#20c997]/30 transition-all flex items-center justify-center gap-2">
                        <i className="fas fa-save"></i> Guardar todos los cambios
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ExpedienteAlumno;
