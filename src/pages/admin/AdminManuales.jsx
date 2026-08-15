// src/pages/admin/AdminManuales.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

const AdminManuales = () => {
    const [manuales, setManuales] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
    const [formData, setFormData] = useState({
        titulo: '',
        descripcion: '',
        modulo_id: '',
        archivo: null
    });
    const [editandoId, setEditandoId] = useState(null);

    const modulos = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12', 'M13', 'M14', 'M15', 'M16', 'M17'];

    useEffect(() => {
        cargarManuales();
    }, []);

    const cargarManuales = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('manuales')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setManuales(data || []);
        } catch (error) {
            console.error('Error cargando manuales:', error);
            setMensaje({ texto: '❌ Error al cargar los manuales', tipo: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.titulo || !formData.modulo_id || !formData.archivo) {
            setMensaje({ texto: '⚠️ Todos los campos son obligatorios', tipo: 'error' });
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
            return;
        }

        try {
            setLoading(true);
            const file = formData.archivo;
            const fileName = `${formData.modulo_id}_${Date.now()}_${file.name}`;

            console.log('📤 Subiendo archivo:', fileName);
            console.log('📦 Bucket:', 'manuals');

            // 1. Subir a Storage (BUCKET: manuals)
            const { error: uploadError } = await supabase.storage
                .from('manuals')
                .upload(fileName, file);

            if (uploadError) {
                console.error('Error upload:', uploadError);
                setMensaje({ texto: '❌ Error subiendo: ' + uploadError.message, tipo: 'error' });
                setLoading(false);
                return;
            }

            console.log('✅ Archivo subido');

            // 2. Obtener URL pública
            const { data: urlData } = supabase.storage
                .from('manuals')
                .getPublicUrl(fileName);

            // 3. Guardar en tabla
            const { error: dbError } = await supabase
                .from('manuales')
                .insert([{
                    titulo: formData.titulo,
                    descripcion: formData.descripcion || '',
                    modulo_id: formData.modulo_id,
                    archivo: fileName,
                    url_externa: urlData?.publicUrl || null
                }]);

            if (dbError) {
                console.error('Error DB:', dbError);
                setMensaje({ texto: '❌ Error guardando: ' + dbError.message, tipo: 'error' });
                setLoading(false);
                return;
            }

            console.log('✅ Manual guardado');

            setMensaje({ texto: '✅ Manual subido correctamente', tipo: 'success' });
            setFormData({ titulo: '', descripcion: '', modulo_id: '', archivo: null });
            document.getElementById('fileInput').value = '';
            await cargarManuales();

        } catch (error) {
            console.error('Error:', error);
            setMensaje({ texto: '❌ Error: ' + error.message, tipo: 'error' });
        } finally {
            setLoading(false);
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 4000);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            if (file.size > 20 * 1024 * 1024) {
                setMensaje({ texto: '⚠️ El archivo no puede superar los 20MB', tipo: 'error' });
                setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
                return;
            }
            setFormData({ ...formData, archivo: file });
        } else {
            setMensaje({ texto: '⚠️ Solo se permiten PDFs', tipo: 'error' });
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
        }
    };

    const eliminarManual = async (id, archivo) => {
        if (!confirm('¿Eliminar este manual?')) return;

        try {
            setLoading(true);
            if (archivo) {
                await supabase.storage.from('manuals').remove([archivo]);
            }
            await supabase.from('manuales').delete().eq('id', id);
            setMensaje({ texto: '✅ Manual eliminado', tipo: 'success' });
            await cargarManuales();
        } catch (error) {
            console.error('Error:', error);
            setMensaje({ texto: '❌ Error al eliminar', tipo: 'error' });
        } finally {
            setLoading(false);
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
        }
    };

    const editarManual = (id) => {
        const manual = manuales.find(m => m.id === id);
        if (manual) {
            setFormData({
                titulo: manual.titulo,
                descripcion: manual.descripcion || '',
                modulo_id: manual.modulo_id,
                archivo: null
            });
            setEditandoId(id);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const cancelarEdicion = () => {
        setEditandoId(null);
        setFormData({
            titulo: '',
            descripcion: '',
            modulo_id: '',
            archivo: null
        });
        document.getElementById('fileInput').value = '';
    };

    const actualizarManual = async (e) => {
        e.preventDefault();

        if (!formData.titulo || !formData.modulo_id) {
            setMensaje({ texto: '⚠️ Título y módulo son obligatorios', tipo: 'error' });
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
            return;
        }

        try {
            setLoading(true);

            let archivoActual = null;

            if (formData.archivo) {
                const file = formData.archivo;
                const fileName = `${formData.modulo_id}_${Date.now()}_${file.name}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('manuals')
                    .upload(fileName, file);

                if (uploadError) {
                    console.error('Error subiendo archivo:', uploadError);
                    setMensaje({ texto: '❌ Error al subir el archivo', tipo: 'error' });
                    setLoading(false);
                    return;
                }

                archivoActual = fileName;
            }

            const updateData = {
                titulo: formData.titulo,
                descripcion: formData.descripcion || '',
                modulo_id: formData.modulo_id
            };

            if (archivoActual) {
                updateData.archivo = archivoActual;
                const { data: urlData } = supabase.storage
                    .from('manuals')
                    .getPublicUrl(archivoActual);
                updateData.url_externa = urlData?.publicUrl || null;
            }

            const { error: dbError } = await supabase
                .from('manuales')
                .update(updateData)
                .eq('id', editandoId);

            if (dbError) {
                console.error('Error actualizando:', dbError);
                setMensaje({ texto: '❌ Error al actualizar', tipo: 'error' });
                setLoading(false);
                return;
            }

            setMensaje({ texto: '✅ Manual actualizado correctamente', tipo: 'success' });
            setEditandoId(null);
            setFormData({
                titulo: '',
                descripcion: '',
                modulo_id: '',
                archivo: null
            });
            document.getElementById('fileInput').value = '';
            await cargarManuales();

        } catch (error) {
            console.error('Error:', error);
            setMensaje({ texto: '❌ Error al actualizar', tipo: 'error' });
        } finally {
            setLoading(false);
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 4000);
        }
    };

    const verManual = (url) => {
        if (url) {
            window.open(url, '_blank');
        } else {
            alert('⚠️ No hay URL disponible para este manual.');
        }
    };

    const exportarCSV = () => {
        const headers = ['Título', 'Descripción', 'Módulo', 'Archivo', 'Fecha Subida'];
        const rows = manuales.map(m => [
            m.titulo,
            m.descripcion || '',
            m.modulo_id,
            m.archivo || '',
            m.fecha_subida ? new Date(m.fecha_subida).toLocaleDateString('es-ES') : ''
        ]);

        let csv = headers.join(',') + '\n';
        rows.forEach(row => {
            csv += row.join(',') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `manuales_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const importarCSV = () => {
        alert('📤 Funcionalidad de importación desde Excel/CSV en desarrollo');
    };

    return (
        <div className="space-y-6">
            {mensaje.texto && (
                <div className={`p-4 rounded-xl border-l-4 ${mensaje.tipo === 'success' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-red-50 border-red-500 text-red-700'}`}>
                    {mensaje.texto}
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-[#0c2340] flex items-center gap-2">
                        <i className="fas fa-upload text-[#20c997]"></i>
                        {editandoId ? '✏️ Editar manual' : 'Subir nuevo manual'}
                    </h2>
                    {editandoId && (
                        <button onClick={cancelarEdicion} className="text-gray-500 hover:text-red-500 text-sm">
                            Cancelar edición ✕
                        </button>
                    )}
                </div>

                <form onSubmit={editandoId ? actualizarManual : handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Título del manual *</label>
                        <input type="text" name="titulo" value={formData.titulo} onChange={handleChange} placeholder="Ej: Manual Módulo 3 – Electricidad" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997]" required disabled={loading} />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Descripción (opcional)</label>
                        <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} placeholder="Breve descripción del manual..." rows="3" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997]" disabled={loading} />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Módulo EASA *</label>
                        <select name="modulo_id" value={formData.modulo_id} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] bg-white" required disabled={loading}>
                            <option value="">Selecciona un módulo</option>
                            {modulos.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Archivo (PDF) {editandoId && '(opcional)'}</label>
                        <input id="fileInput" type="file" accept=".pdf" onChange={handleFileChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#20c997] file:text-white hover:file:bg-[#1a9e7a]" disabled={loading} required={!editandoId} />
                        <p className="text-xs text-gray-400 mt-1">* Solo archivos PDF, máximo 20MB</p>
                    </div>

                    <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#20c997] to-[#0c2340] text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2">
                        <i className="fas fa-cloud-upload-alt"></i>
                        {loading ? 'Guardando...' : (editandoId ? 'Actualizar manual' : 'Subir material')}
                    </button>
                </form>
            </div>

            <div className="flex flex-wrap gap-3">
                <button onClick={importarCSV} className="bg-gradient-to-r from-[#17a2b8] to-[#138496] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:shadow-lg transition flex items-center gap-2">
                    <i className="fas fa-file-excel"></i> Importar desde Excel
                </button>
                <button onClick={exportarCSV} className="bg-gradient-to-r from-[#28a745] to-[#1e7e34] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:shadow-lg transition flex items-center gap-2">
                    <i className="fas fa-download"></i> Exportar manuales
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-[#0c2340] mb-4">📚 Biblioteca de Materiales Técnicos ({manuales.length})</h2>

                {manuales.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No hay manuales subidos</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="bg-[#0c2340] text-white">
                                    <th className="p-3 text-left">Título</th>
                                    <th className="p-3 text-left">Módulo</th>
                                    <th className="p-3 text-left">Archivo</th>
                                    <th className="p-3 text-left">Fecha</th>
                                    <th className="p-3 text-left">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {manuales.map(m => (
                                    <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="p-3 font-medium">{m.titulo}</td>
                                        <td className="p-3"><span className="bg-[#0c2340] text-white text-xs px-3 py-1 rounded-full">{m.modulo_id}</span></td>
                                        <td className="p-3 text-xs text-gray-500">{m.archivo}</td>
                                        <td className="p-3 text-xs text-gray-500">{m.fecha_subida ? new Date(m.fecha_subida).toLocaleDateString('es-ES') : '—'}</td>
                                        <td className="p-3">
                                            <div className="flex gap-2">
                                                <button onClick={() => verManual(m.url_externa)} className="text-[#20c997] text-xs bg-green-50 px-3 py-1 rounded-lg" title="Ver">
                                                    <i className="fas fa-eye"></i>
                                                </button>
                                                <button onClick={() => editarManual(m.id)} className="text-blue-600 text-xs bg-blue-50 px-3 py-1 rounded-lg" title="Editar">
                                                    ✏️
                                                </button>
                                                <button onClick={() => eliminarManual(m.id, m.archivo)} className="text-red-600 text-xs bg-red-50 px-3 py-1 rounded-lg" title="Eliminar">
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

export default AdminManuales;
