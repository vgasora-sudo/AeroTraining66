// src/pages/admin/AdminExpedientes.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import ConfirmarMaster from '../../components/ConfirmarMaster';

const AdminExpedientes = () => {
    const navigate = useNavigate();

    // Estado para el formulario
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        documento: '',
        telefono: '',
        email: '',
        username: '',
        password: '',
        licencia: 'B1.1',
        estado: 'Activo',
        es_admin: false,
        puede_aprobar: false
    });

    // Estado para la lista de alumnos
    const [alumnos, setAlumnos] = useState([]);
    const [editandoId, setEditandoId] = useState(null);
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
    const [loading, setLoading] = useState(false);
    
    // Estado para el modal de confirmación de master_admin
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [accionPendiente, setAccionPendiente] = useState(null);
    const [datosPendientes, setDatosPendientes] = useState(null);

    // Cargar alumnos al iniciar
    useEffect(() => {
        cargarAlumnos();
    }, []);

    // ✅ FUNCIÓN PARA CARGAR ALUMNOS DESDE SUPABASE
    const cargarAlumnos = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('alumnos')
                .select('*')
                .order('nombre', { ascending: true });

            if (error) throw error;

            const alumnosFormateados = data.map(alumno => ({
                id: alumno.id,
                nombre: alumno.nombre,
                apellido: alumno.apellido || '',
                documento: alumno.documento || 'N/A',
                telefono: alumno.telefono || '',
                email: alumno.email,
                username: alumno.username || alumno.email,
                password: '********',
                licencia: alumno.licencia || 'B1.1',
                estado: alumno.activo ? 'Activo' : 'Finalizado',
                fecha_registro: alumno.fecha_registro?.split('T')[0] || new Date().toISOString().split('T')[0],
                user_id: alumno.user_id,
                es_admin: alumno.es_admin || false,
                puede_aprobar: alumno.puede_aprobar || false
            }));

            setAlumnos(alumnosFormateados);
        } catch (error) {
            console.error('Error cargando alumnos:', error);
            setMensaje({ texto: '❌ Error al cargar los alumnos', tipo: 'error' });
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 4000);
        } finally {
            setLoading(false);
        }
    };

    // ✅ FUNCIÓN PARA VERIFICAR SI ES MASTER_ADMIN
    const esMasterAdmin = () => {
        const userData = JSON.parse(localStorage.getItem('aerotraining_user') || 'null');
        return userData?.username === 'master_admin';
    };

    // ✅ FUNCIÓN PARA VERIFICAR CONTRASEÑA DE MASTER_ADMIN
    const verificarMasterPassword = async (password) => {
        try {
            const { data, error } = await supabase
                .from('alumnos')
                .select('password')
                .eq('username', 'master_admin')
                .single();

            if (error) throw error;
            return data.password === password;
        } catch (error) {
            console.error('Error verificando master_admin:', error);
            return false;
        }
    };

    // ✅ FUNCIÓN PARA GUARDAR ALUMNO (CON APROBACIÓN DE MASTER_ADMIN)
    const guardarAlumno = async (datos) => {
        try {
            const userData = JSON.parse(localStorage.getItem('aerotraining_user') || 'null');
            const esMaster = userData?.username === 'master_admin';
            
            // Si se está creando un administrador y no es master_admin, pedir aprobación
            if (datos.es_admin && !esMaster) {
                return new Promise((resolve, reject) => {
                    setDatosPendientes(datos);
                    setAccionPendiente({ type: 'guardar', resolve, reject });
                    setShowConfirmModal(true);
                });
            }

            return await ejecutarGuardarAlumno(datos);
        } catch (error) {
            console.error('Error guardando alumno:', error);
            return { success: false, error: error.message };
        }
    };

    // ✅ EJECUTAR GUARDADO REAL
    const ejecutarGuardarAlumno = async (datos) => {
        try {
            let userId = null;

            // 1. Verificar si el email ya existe en auth.users
            const { data: existingUsers, error: searchError } = await supabase
                .from('auth.users')
                .select('id')
                .eq('email', datos.email);

            if (existingUsers && existingUsers.length > 0) {
                userId = existingUsers[0].id;
            } else {
                // 2. Crear usuario en auth
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: datos.email,
                    password: datos.password,
                    options: {
                        data: {
                            nombre: datos.nombre,
                            apellido: datos.apellido || '',
                            licencia: datos.licencia
                        }
                    }
                });

                if (authError) {
                    if (authError.message.includes('already registered')) {
                        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                            email: datos.email,
                            password: datos.password
                        });
                        
                        if (signInError) {
                            throw new Error(`No se pudo autenticar: ${signInError.message}`);
                        }
                        
                        userId = signInData.user.id;
                    } else {
                        throw authError;
                    }
                } else {
                    userId = authData.user.id;
                }
            }

            if (!userId) {
                throw new Error('No se pudo obtener el ID del usuario');
            }

            // 3. Insertar en alumnos (con manejo de conflicto)
            const { data, error } = await supabase
                .from('alumnos')
                .insert([{
                    user_id: userId,
                    nombre: datos.nombre,
                    apellido: datos.apellido || '',
                    documento: datos.documento,
                    telefono: datos.telefono || '',
                    email: datos.email,
                    username: datos.username,
                    licencia: datos.licencia,
                    activo: datos.estado === 'Activo',
                    progreso: {},
                    habilitados: [],
                    es_admin: datos.es_admin || false,
                    puede_aprobar: datos.puede_aprobar || false
                }]);

            if (error) {
                // Si el error es 409 (conflicto), mostrar mensaje amigable
                if (error.code === '23505' || error.message?.includes('duplicate')) {
                    // Intentar identificar qué campo duplica
                    const { data: existingAlumno } = await supabase
                        .from('alumnos')
                        .select('email, username')
                        .or(`email.eq.${datos.email},username.eq.${datos.username}`)
                        .maybeSingle();

                    let campo = 'email o username';
                    if (existingAlumno) {
                        if (existingAlumno.email === datos.email) campo = 'email';
                        else if (existingAlumno.username === datos.username) campo = 'username';
                    }
                    throw new Error(`Ya existe un alumno con ese ${campo}.`);
                }
                throw error;
            }

            return { success: true, data };
        } catch (error) {
            console.error('Error guardando alumno:', error);
            return { success: false, error: error.message };
        }
    };

    // ✅ FUNCIÓN PARA ACTUALIZAR ALUMNO (CON APROBACIÓN)
    const actualizarAlumno = async (id, datos) => {
        try {
            const userData = JSON.parse(localStorage.getItem('aerotraining_user') || 'null');
            const esMaster = userData?.username === 'master_admin';
            
            // Verificar si se está cambiando el rol a administrador
            const alumnoActual = alumnos.find(a => a.id === id);
            const cambiandoARolAdmin = datos.es_admin && !alumnoActual?.es_admin;

            // Si se está convirtiendo a admin y no es master_admin, pedir aprobación
            if (cambiandoARolAdmin && !esMaster) {
                return new Promise((resolve, reject) => {
                    setDatosPendientes({ id, datos });
                    setAccionPendiente({ type: 'actualizar', resolve, reject });
                    setShowConfirmModal(true);
                });
            }

            return await ejecutarActualizarAlumno(id, datos);
        } catch (error) {
            console.error('Error actualizando alumno:', error);
            return { success: false, error: error.message };
        }
    };

    // ✅ EJECUTAR ACTUALIZACIÓN REAL
    const ejecutarActualizarAlumno = async (id, datos) => {
        try {
            // Verificar duplicados en email o username para otros alumnos
            const { data: existingAlumno } = await supabase
                .from('alumnos')
                .select('email, username')
                .or(`email.eq.${datos.email},username.eq.${datos.username}`)
                .neq('id', id)
                .maybeSingle();

            if (existingAlumno) {
                let campo = 'email o username';
                if (existingAlumno.email === datos.email) campo = 'email';
                else if (existingAlumno.username === datos.username) campo = 'username';
                throw new Error(`Ya existe otro alumno con ese ${campo}.`);
            }

            const { data, error } = await supabase
                .from('alumnos')
                .update({
                    nombre: datos.nombre,
                    apellido: datos.apellido || '',
                    documento: datos.documento,
                    telefono: datos.telefono || '',
                    email: datos.email,
                    username: datos.username,
                    licencia: datos.licencia,
                    activo: datos.estado === 'Activo',
                    es_admin: datos.es_admin || false,
                    puede_aprobar: datos.puede_aprobar || false
                })
                .eq('id', id);

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Error actualizando alumno:', error);
            return { success: false, error: error.message };
        }
    };

    // ✅ FUNCIÓN PARA ELIMINAR ALUMNO (CON APROBACIÓN)
    const eliminarAlumnoSupabase = async (id) => {
        try {
            const userData = JSON.parse(localStorage.getItem('aerotraining_user') || 'null');
            const esMaster = userData?.username === 'master_admin';
            
            // Obtener el alumno para verificar si es admin
            const alumno = alumnos.find(a => a.id === id);
            
            // Si es admin y no es master_admin, pedir aprobación
            if (alumno?.es_admin && !esMaster) {
                return new Promise((resolve, reject) => {
                    setDatosPendientes(id);
                    setAccionPendiente({ type: 'eliminar', resolve, reject });
                    setShowConfirmModal(true);
                });
            }

            return await ejecutarEliminarAlumno(id);
        } catch (error) {
            console.error('Error eliminando alumno:', error);
            return { success: false, error: error.message };
        }
    };

    // ✅ EJECUTAR ELIMINACIÓN REAL
    const ejecutarEliminarAlumno = async (id) => {
        try {
            const { error } = await supabase
                .from('alumnos')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error eliminando alumno:', error);
            return { success: false, error: error.message };
        }
    };

    // ✅ FUNCIÓN PARA CAMBIAR ESTADO
    const cambiarEstadoSupabase = async (id, activo) => {
        try {
            const { data, error } = await supabase
                .from('alumnos')
                .update({ activo: activo })
                .eq('id', id);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error cambiando estado:', error);
            return { success: false, error: error.message };
        }
    };

    // ✅ MANEJAR CONFIRMACIÓN DE MASTER_ADMIN
    const handleConfirmMaster = async () => {
        setShowConfirmModal(false);
        
        if (!accionPendiente) return;

        const { type, resolve, reject } = accionPendiente;

        try {
            let resultado;
            switch (type) {
                case 'guardar':
                    resultado = await ejecutarGuardarAlumno(datosPendientes);
                    break;
                case 'actualizar':
                    resultado = await ejecutarActualizarAlumno(datosPendientes.id, datosPendientes.datos);
                    break;
                case 'eliminar':
                    resultado = await ejecutarEliminarAlumno(datosPendientes);
                    break;
                default:
                    resultado = { success: false, error: 'Acción desconocida' };
            }

            if (resultado.success) {
                setMensaje({ texto: '✅ Operación completada con aprobación de master_admin', tipo: 'success' });
                await cargarAlumnos();
                if (type === 'guardar' || type === 'actualizar') {
                    resetearFormulario();
                }
                resolve(resultado);
            } else {
                setMensaje({ texto: `❌ Error: ${resultado.error}`, tipo: 'error' });
                reject(resultado);
            }
        } catch (error) {
            setMensaje({ texto: `❌ Error: ${error.message}`, tipo: 'error' });
            reject(error);
        } finally {
            setAccionPendiente(null);
            setDatosPendientes(null);
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 4000);
        }
    };

    const handleCancelMaster = () => {
        setShowConfirmModal(false);
        setAccionPendiente(null);
        setDatosPendientes(null);
        setMensaje({ texto: '⚠️ Operación cancelada', tipo: 'error' });
        setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
    };

    // Manejar cambios en el formulario
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    // Resetear formulario
    const resetearFormulario = () => {
        setFormData({
            nombre: '',
            apellido: '',
            documento: '',
            telefono: '',
            email: '',
            username: '',
            password: '',
            licencia: 'B1.1',
            estado: 'Activo',
            es_admin: false,
            puede_aprobar: false
        });
        setEditandoId(null);
    };

    // ✅ ENVIAR FORMULARIO
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validar campos obligatorios
        if (!formData.nombre || !formData.apellido || !formData.documento || !formData.email || !formData.username || !formData.password) {
            setMensaje({ texto: '⚠️ Los campos marcados con * son obligatorios', tipo: 'error' });
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 4000);
            return;
        }

        setLoading(true);

        try {
            let resultado;
            if (editandoId) {
                resultado = await actualizarAlumno(editandoId, formData);
            } else {
                resultado = await guardarAlumno(formData);
            }

            if (resultado.success) {
                setMensaje({ 
                    texto: editandoId ? '✅ Alumno actualizado correctamente' : '✅ Alumno matriculado correctamente', 
                    tipo: 'success' 
                });
                setEditandoId(null);
                await cargarAlumnos();
                resetearFormulario();
            } else {
                setMensaje({ texto: `❌ ${resultado.error}`, tipo: 'error' });
            }
        } catch (error) {
            setMensaje({ texto: `❌ Error: ${error.message}`, tipo: 'error' });
        } finally {
            setLoading(false);
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 4000);
        }
    };

    // ✅ EDITAR ALUMNO
    const editarAlumno = (id) => {
        const alumno = alumnos.find(a => a.id === id);
        if (alumno) {
            setFormData({
                nombre: alumno.nombre,
                apellido: alumno.apellido || '',
                documento: alumno.documento,
                telefono: alumno.telefono || '',
                email: alumno.email,
                username: alumno.username,
                password: '********',
                licencia: alumno.licencia,
                estado: alumno.estado,
                es_admin: alumno.es_admin || false,
                puede_aprobar: alumno.puede_aprobar || false
            });
            setEditandoId(id);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // ✅ ELIMINAR ALUMNO
    const eliminarAlumno = async (id) => {
        if (!window.confirm('⚠️ ¿Estás seguro de eliminar este alumno?')) return;

        setLoading(true);
        const resultado = await eliminarAlumnoSupabase(id);
        if (resultado.success) {
            setMensaje({ texto: '🗑️ Alumno eliminado', tipo: 'success' });
            await cargarAlumnos();
        } else {
            setMensaje({ texto: `❌ ${resultado.error}`, tipo: 'error' });
        }
        setLoading(false);
        setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
    };

    // ✅ CAMBIAR ESTADO
    const cambiarEstado = async (id, estadoActual) => {
        const nuevoEstado = estadoActual === 'Activo' ? false : true;
        const nuevoEstadoTexto = nuevoEstado ? 'Activo' : 'Finalizado';

        setLoading(true);
        const resultado = await cambiarEstadoSupabase(id, nuevoEstado);
        if (resultado.success) {
            setMensaje({ texto: `✅ Estado cambiado a ${nuevoEstadoTexto}`, tipo: 'success' });
            await cargarAlumnos();
        } else {
            setMensaje({ texto: `❌ ${resultado.error}`, tipo: 'error' });
        }
        setLoading(false);
        setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
    };

    // Exportar a CSV
    const exportarCSV = () => {
        const headers = ['Nombre', 'Apellido', 'DNI/NIE', 'Teléfono', 'Email', 'Usuario', 'Licencia', 'Estado', 'Fecha Registro', 'Rol'];
        const rows = alumnos.map(a => [
            a.nombre, a.apellido || '', a.documento, a.telefono || '', a.email,
            a.username, a.licencia, a.estado, a.fecha_registro,
            a.es_admin ? 'Administrador' : 'Alumno'
        ]);

        let csv = headers.join(',') + '\n';
        rows.forEach(row => {
            csv += row.join(',') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `alumnos_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    // Importar desde CSV (simulación)
    const importarCSV = () => {
        alert('📤 Funcionalidad de importación desde Excel/CSV en desarrollo');
    };

    // Limpiar corruptos
    const limpiarCorruptos = () => {
        if (window.confirm('⚠️ ¿Eliminar TODOS los alumnos corruptos?')) {
            const limpios = alumnos.filter(a => a.nombre && a.documento && a.email);
            if (limpios.length < alumnos.length) {
                const limpiar = async () => {
                    for (const alumno of alumnos) {
                        if (!alumno.nombre || !alumno.documento || !alumno.email) {
                            await eliminarAlumnoSupabase(alumno.id);
                        }
                    }
                    await cargarAlumnos();
                    setMensaje({ texto: `🧹 Se eliminaron ${alumnos.length - limpios.length} registros corruptos`, tipo: 'success' });
                };
                limpiar();
            } else {
                setMensaje({ texto: '✅ No se encontraron registros corruptos', tipo: 'info' });
            }
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 4000);
        }
    };

    // Navegar a documentos del alumno
    const irADocumentos = (alumnoId) => {
        navigate(`/admin/documentos/${alumnoId}`);
    };

    // Navegar a expediente del alumno
    const irAExpediente = (alumnoId) => {
        navigate(`/admin/expediente/${alumnoId}`);
    };

    return (
        <div className="space-y-6">
            {/* Modal de confirmación de master_admin */}
            {showConfirmModal && (
                <ConfirmarMaster
                    onConfirm={handleConfirmMaster}
                    onCancel={handleCancelMaster}
                    mensaje="⚠️ Esta acción requiere la aprobación de master_admin. Introduce la contraseña para continuar."
                />
            )}

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
            {/* FORMULARIO DE ALTA DE ALUMNOS */}
            {/* ============================================================ */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-[#0c2340]">
                        <i className="fas fa-user-plus text-[#20c997] mr-2"></i>
                        {editandoId ? '✏️ Editar Alumno' : 'Alta de nuevos alumnos'}
                    </h2>
                    {editandoId && (
                        <button
                            onClick={resetearFormulario}
                            className="text-gray-500 hover:text-red-500 text-sm"
                        >
                            Cancelar edición ✕
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <input type="hidden" name="add_user" value="1" />

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre *</label>
                        <input
                            type="text"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            placeholder="Nombre"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] focus:shadow-[0_0_0_3px_rgba(32,201,151,0.1)] transition"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Apellidos *</label>
                        <input
                            type="text"
                            name="apellido"
                            value={formData.apellido}
                            onChange={handleChange}
                            placeholder="Apellidos"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] focus:shadow-[0_0_0_3px_rgba(32,201,151,0.1)] transition"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">DNI / NIE *</label>
                        <input
                            type="text"
                            name="documento"
                            value={formData.documento}
                            onChange={handleChange}
                            placeholder="DNI / NIE"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] focus:shadow-[0_0_0_3px_rgba(32,201,151,0.1)] transition"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Teléfono</label>
                        <input
                            type="text"
                            name="telefono"
                            value={formData.telefono}
                            onChange={handleChange}
                            placeholder="Teléfono"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] focus:shadow-[0_0_0_3px_rgba(32,201,151,0.1)] transition"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Correo Electrónico *</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Correo Electrónico"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] focus:shadow-[0_0_0_3px_rgba(32,201,151,0.1)] transition"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Usuario *</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Usuario"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] focus:shadow-[0_0_0_3px_rgba(32,201,151,0.1)] transition"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Contraseña *</label>
                        <input
                            type="text"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder={editandoId ? '●●●●●●●●' : 'Contraseña'}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] focus:shadow-[0_0_0_3px_rgba(32,201,151,0.1)] transition"
                            required={!editandoId}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Licencia</label>
                        <select
                            name="licencia"
                            value={formData.licencia}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] focus:shadow-[0_0_0_3px_rgba(32,201,151,0.1)] transition bg-white"
                        >
                            <option value="B1.1">B1.1 (Turbina)</option>
                            <option value="B2">B2 (Aviónica)</option>
                            <option value="B1.3">B1.3 (Helicópteros)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Estado</label>
                        <select
                            name="estado"
                            value={formData.estado}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] focus:shadow-[0_0_0_3px_rgba(32,201,151,0.1)] transition bg-white"
                        >
                            <option value="Activo">Activo</option>
                            <option value="Finalizado">Finalizado</option>
                        </select>
                    </div>

                    {/* CAMPOS DE ROL - SOLO VISIBLES PARA ADMINISTRADORES */}
                    {JSON.parse(localStorage.getItem('aerotraining_user') || 'null')?.es_admin && (
                        <>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Rol</label>
                                <select
                                    name="es_admin"
                                    value={formData.es_admin ? 'admin' : 'alumno'}
                                    onChange={(e) => setFormData({ ...formData, es_admin: e.target.value === 'admin' })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] bg-white"
                                >
                                    <option value="alumno">Alumno</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>
                            {formData.es_admin && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Permisos de aprobación</label>
                                    <select
                                        name="puede_aprobar"
                                        value={formData.puede_aprobar ? 'si' : 'no'}
                                        onChange={(e) => setFormData({ ...formData, puede_aprobar: e.target.value === 'si' })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] bg-white"
                                    >
                                        <option value="no">Solo administrador</option>
                                        <option value="si">Puede aprobar cambios</option>
                                    </select>
                                    <p className="text-xs text-gray-400 mt-1">(Requiere aprobación de master_admin)</p>
                                </div>
                            )}
                        </>
                    )}

                    <div className="md:col-span-2 lg:col-span-3 flex gap-3 flex-wrap">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-gradient-to-r from-[#20c997] to-[#0c2340] text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#20c997]/30 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            <i className="fas fa-graduation-cap"></i>
                            {loading ? 'Guardando...' : (editandoId ? 'Actualizar Alumno' : 'Matricular')}
                        </button>
                    </div>
                </form>

                {/* Botones de Excel */}
                <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200">
                    <button
                        onClick={importarCSV}
                        className="bg-gradient-to-r from-[#17a2b8] to-[#138496] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:shadow-lg transition flex items-center gap-2"
                    >
                        <i className="fas fa-file-excel"></i> Importar desde Excel
                    </button>
                    <button
                        onClick={exportarCSV}
                        className="bg-gradient-to-r from-[#28a745] to-[#1e7e34] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:shadow-lg transition flex items-center gap-2"
                    >
                        <i className="fas fa-download"></i> Exportar alumnos
                    </button>
                    <button
                        onClick={limpiarCorruptos}
                        className="bg-gradient-to-r from-[#dc3545] to-[#c82333] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:shadow-lg transition flex items-center gap-2"
                    >
                        <i className="fas fa-trash-alt"></i> Limpiar corruptos
                    </button>
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200 text-sm text-blue-700">
                    <i className="fas fa-info-circle mr-2"></i>
                    <strong>master_admin</strong> es el único que puede crear o modificar administradores sin aprobación. 
                    Los demás administradores necesitarán su contraseña para acciones críticas.
                </div>
            </div>

            {/* ============================================================ */}
            {/* LISTA DE ALUMNOS */}
            {/* ============================================================ */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-[#0c2340]">
                        <i className="fas fa-users text-[#20c997] mr-2"></i>
                        Alumnos registrados
                        <span className="ml-2 text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            {alumnos.length} total
                        </span>
                    </h2>
                    <div className="flex gap-2">
                        <span className="text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full">
                            ✅ {alumnos.filter(a => a.estado === 'Activo').length} activos
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            🎓 {alumnos.filter(a => a.estado === 'Finalizado').length} finalizados
                        </span>
                        <span className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                            👑 {alumnos.filter(a => a.es_admin).length} admins
                        </span>
                    </div>
                </div>

                {loading && alumnos.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                        <i className="fas fa-spinner fa-spin text-4xl block mb-3"></i>
                        Cargando alumnos...
                    </p>
                ) : alumnos.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                        <i className="fas fa-inbox text-4xl block mb-3 opacity-50"></i>
                        No hay alumnos registrados
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="bg-[#0c2340] text-white rounded-xl">
                                    <th className="p-3 text-left rounded-l-xl">Alumno</th>
                                    <th className="p-3 text-left">Documento</th>
                                    <th className="p-3 text-left">Email</th>
                                    <th className="p-3 text-left">Usuario</th>
                                    <th className="p-3 text-left">Licencia</th>
                                    <th className="p-3 text-left">Estado</th>
                                    <th className="p-3 text-left">Rol</th>
                                    <th className="p-3 text-left rounded-r-xl">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {alumnos.map((alumno) => (
                                    <tr key={alumno.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                        <td className="p-3 font-medium text-[#0c2340]">
                                            <button
                                                onClick={() => irAExpediente(alumno.id)}
                                                className="hover:text-[#20c997] hover:underline transition flex items-center gap-2"
                                            >
                                                <i className="fas fa-user-graduate text-gray-400"></i>
                                                {alumno.nombre} {alumno.apellido}
                                                <span className="block text-xs text-gray-400">
                                                    {alumno.fecha_registro}
                                                </span>
                                            </button>
                                        </td>
                                        <td className="p-3">{alumno.documento}</td>
                                        <td className="p-3">{alumno.email}</td>
                                        <td className="p-3">
                                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">{alumno.username}</code>
                                        </td>
                                        <td className="p-3">
                                            <span className="bg-[#0c2340] text-white text-xs px-3 py-1 rounded-full">
                                                {alumno.licencia}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                                                alumno.estado === 'Activo'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-500'
                                            }`}>
                                                {alumno.estado === 'Activo' ? '✅ Activo' : '🎓 Finalizado'}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                                                alumno.es_admin
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-gray-100 text-gray-500'
                                            }`}>
                                                {alumno.es_admin ? '👑 Admin' : '👤 Alumno'}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex gap-2 flex-wrap">
                                                <button
                                                    onClick={() => irADocumentos(alumno.id)}
                                                    className="bg-[#20c997] hover:bg-[#1a9e7a] text-white text-xs font-semibold px-3 py-1 rounded-lg transition flex items-center gap-1"
                                                >
                                                    <i className="fas fa-folder-open"></i> Documentos
                                                </button>
                                                <button
                                                    onClick={() => editarAlumno(alumno.id)}
                                                    className="text-blue-600 hover:text-blue-800 text-xs font-semibold bg-blue-50 px-3 py-1 rounded-lg hover:bg-blue-100 transition"
                                                >
                                                    ✏️ Editar
                                                </button>
                                                <button
                                                    onClick={() => cambiarEstado(alumno.id, alumno.estado)}
                                                    className={`text-xs font-semibold px-3 py-1 rounded-lg transition ${
                                                        alumno.estado === 'Activo'
                                                            ? 'text-gray-500 bg-gray-100 hover:bg-gray-200'
                                                            : 'text-green-600 bg-green-50 hover:bg-green-100'
                                                    }`}
                                                >
                                                    {alumno.estado === 'Activo' ? '⏹️ Finalizar' : '▶️ Activar'}
                                                </button>
                                                <button
                                                    onClick={() => eliminarAlumno(alumno.id)}
                                                    className="text-red-600 hover:text-red-800 text-xs font-semibold bg-red-50 px-3 py-1 rounded-lg hover:bg-red-100 transition"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminExpedientes;
