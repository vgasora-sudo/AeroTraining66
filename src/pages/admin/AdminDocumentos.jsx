// src/pages/admin/AdminDocumentos.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const AdminDocumentos = () => {
    const { alumnoId } = useParams();
    const navigate = useNavigate();
    const [alumno, setAlumno] = useState(null);
    const [documentos, setDocumentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
    const [subiendo, setSubiendo] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [tipoDocumento, setTipoDocumento] = useState('identificacion');
    const [descripcion, setDescripcion] = useState('');
    const [filePreview, setFilePreview] = useState(null);

    // Obtener alumnos de localStorage
    const getAlumnos = () => {
        const data = localStorage.getItem('aerotraining_alumnos');
        return data ? JSON.parse(data) : [];
    };

    // Obtener documentos de localStorage
    const getDocumentos = (id) => {
        const key = `aerotraining_documentos_${id}`;
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    };

    // Guardar documentos en localStorage
    const guardarDocumentos = (id, docs) => {
        const key = `aerotraining_documentos_${id}`;
        localStorage.setItem(key, JSON.stringify(docs));
        setDocumentos(docs);
    };

    useEffect(() => {
        const alumnos = getAlumnos();
        const alumnoEncontrado = alumnos.find(a => a.id === parseInt(alumnoId));
        
        if (alumnoEncontrado) {
            setAlumno(alumnoEncontrado);
            const docs = getDocumentos(alumnoId);
            setDocumentos(docs);
        } else {
            setMensaje({ texto: '❌ Alumno no encontrado', tipo: 'error' });
        }
        setLoading(false);
    }, [alumnoId]);

    // Manejar selección de archivo
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validar tamaño (16MB)
            if (file.size > 16 * 1024 * 1024) {
                setMensaje({ texto: '❌ El archivo excede el tamaño máximo de 16MB', tipo: 'error' });
                setTimeout(() => setMensaje({ texto: '', tipo: '' }), 4000);
                e.target.value = '';
                return;
            }
            setSelectedFile(file);
            
            // Crear preview para imágenes
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    setFilePreview(event.target.result);
                };
                reader.readAsDataURL(file);
            } else {
                setFilePreview(null);
            }
        }
    };

    // Subir documento (guardando el archivo como base64)
    const subirDocumento = () => {
        if (!selectedFile) {
            setMensaje({ texto: '⚠️ Selecciona un archivo primero', tipo: 'error' });
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
            return;
        }

        setSubiendo(true);

        // Leer el archivo como base64 para guardarlo
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64Data = event.target.result;

            const nuevoDoc = {
                id: Date.now(),
                nombre: selectedFile.name,
                tipo: tipoDocumento,
                descripcion: descripcion || '',
                fecha_subida: new Date().toISOString().split('T')[0],
                tamaño: selectedFile.size,
                archivoBase64: base64Data,
                tipoMime: selectedFile.type || 'application/octet-stream'
            };

            const docsActualizados = [...documentos, nuevoDoc];
            guardarDocumentos(alumnoId, docsActualizados);

            setMensaje({ texto: '✅ Documento subido correctamente', tipo: 'success' });
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);

            // Resetear formulario
            setSelectedFile(null);
            setFilePreview(null);
            setDescripcion('');
            document.getElementById('fileInput').value = '';
            setSubiendo(false);
        };

        reader.onerror = () => {
            setMensaje({ texto: '❌ Error al leer el archivo', tipo: 'error' });
            setSubiendo(false);
        };

        reader.readAsDataURL(selectedFile);
    };

    // Eliminar documento
    const eliminarDocumento = (docId) => {
        if (window.confirm('⚠️ ¿Eliminar este documento permanentemente?')) {
            const docsActualizados = documentos.filter(d => d.id !== docId);
            guardarDocumentos(alumnoId, docsActualizados);
            setMensaje({ texto: '🗑️ Documento eliminado', tipo: 'success' });
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
        }
    };

    // Descargar documento individual (desde base64)
    const descargarDocumento = (doc) => {
        if (!doc.archivoBase64) {
            setMensaje({ texto: '⚠️ El archivo no está disponible para descargar', tipo: 'error' });
            return;
        }

        try {
            const link = document.createElement('a');
            link.href = doc.archivoBase64;
            link.download = doc.nombre;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setMensaje({ texto: `📥 Descargando ${doc.nombre}...`, tipo: 'success' });
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 2000);
        } catch (error) {
            setMensaje({ texto: '❌ Error al descargar el archivo', tipo: 'error' });
        }
    };

    // Descargar toda la carpeta
    const descargarCarpeta = () => {
        if (documentos.length === 0) {
            setMensaje({ texto: '⚠️ No hay documentos para descargar', tipo: 'error' });
            setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
            return;
        }

        documentos.forEach((doc, index) => {
            setTimeout(() => {
                descargarDocumento(doc);
            }, index * 500);
        });

        setMensaje({ texto: `📥 Descargando ${documentos.length} documentos...`, tipo: 'success' });
        setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
    };

    const getTipoLabel = (tipo) => {
        const tipos = {
            identificacion: '🪪 Identificación',
            licencia: '📜 Licencia',
            certificado: '📄 Certificado',
            foto: '📸 Foto',
            general: '📁 General'
        };
        return tipos[tipo] || tipo;
    };

    const getFileIcon = (nombre) => {
        const ext = nombre.split('.').pop().toLowerCase();
        if (['pdf'].includes(ext)) return '📄';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return '🖼️';
        if (['doc', 'docx'].includes(ext)) return '📝';
        if (['xls', 'xlsx'].includes(ext)) return '📊';
        if (['txt'].includes(ext)) return '📃';
        return '📁';
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="text-4xl animate-spin">✈️</div>
                    <p className="mt-4 text-gray-500">Cargando...</p>
                </div>
            </div>
        );
    }

    if (!alumno) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="text-6xl mb-4">❌</div>
                <h2 className="text-2xl font-bold text-[#0c2340]">Alumno no encontrado</h2>
                <p className="text-gray-500 mt-2">El alumno que buscas no existe</p>
                <button 
                    onClick={() => navigate('/admin/expedientes')}
                    className="mt-4 text-[#20c997] hover:underline"
                >
                    ← Volver a expedientes
                </button>
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

            {/* Header con información del alumno */}
            <div className="bg-gradient-to-r from-[#0a1a2f] to-[#0c2340] rounded-2xl p-6 text-white">
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">
                            <i className="fas fa-folder-open text-[#20c997] mr-2"></i>
                            Documentación de {alumno.nombre}
                        </h1>
                        <p className="text-gray-300 text-sm mt-1">
                            Gestión de documentos del alumno
                        </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {/* BOTÓN VER EXPEDIENTE - Color rojo para PDF */}
                        <button
                            onClick={() => navigate(`/admin/expediente/${alumno.id}`)}
                            className="bg-[#dc3545] hover:bg-[#c82333] text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
                        >
                            <i className="fas fa-file-pdf"></i> Ver Expediente
                        </button>
                        <button 
                            onClick={() => navigate('/admin/expedientes')}
                            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
                        >
                            <i className="fas fa-arrow-left"></i> Volver a expedientes
                        </button>
                    </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                    <span><strong className="text-[#20c997]">Usuario:</strong> {alumno.username}</span>
                    <span><strong className="text-[#20c997]">DNI:</strong> {alumno.documento || 'No especificado'}</span>
                    <span><strong className="text-[#20c997]">Licencia:</strong> {alumno.licencia || 'B1.1'}</span>
                    <span><strong className="text-[#20c997]">Documentos:</strong> {documentos.length}</span>
                </div>
            </div>

            {/* Carpeta del alumno */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-[#0c2340]">
                            <i className="fas fa-folder text-[#20c997] mr-2"></i>
                            Carpeta del alumno
                        </h2>
                        <div className="mt-2 flex items-center gap-3">
                            <span className="text-sm text-gray-500">
                                <i className="fas fa-folder mr-1"></i>
                                <strong>Nombre de carpeta:</strong>
                            </span>
                            <code className="bg-gray-100 px-3 py-1 rounded text-sm">
                                {alumno.username}_{alumno.id}
                            </code>
                        </div>
                    </div>
                    <button
                        onClick={descargarCarpeta}
                        disabled={documentos.length === 0}
                        className={`bg-[#20c997] hover:bg-[#1a9e7a] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition flex items-center gap-2 ${
                            documentos.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                        <i className="fas fa-file-archive"></i> Descargar todos ({documentos.length})
                    </button>
                </div>
            </div>

            {/* Subir documento */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-[#0c2340]">
                        <i className="fas fa-upload text-[#20c997] mr-2"></i>
                        Subir nuevo documento
                    </h2>
                    <span className="text-sm text-gray-500">Formatos: PDF, JPG, PNG, DOC, DOCX (max 16MB)</span>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-[#20c997] transition bg-gray-50 hover:bg-[#f0fcf8]">
                    <div className="text-5xl text-[#20c997] mb-3">📄</div>
                    <p className="text-gray-600">
                        <span className="text-[#20c997] font-semibold">Arrastra y suelta</span> tu archivo aquí o haz clic para seleccionarlo
                    </p>
                    <p className="text-sm text-gray-400 mt-2">PDF, JPG, PNG, DOC, DOCX (máx. 16MB)</p>
                    <input
                        id="fileInput"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <button
                        onClick={() => document.getElementById('fileInput').click()}
                        className="mt-4 bg-[#20c997] hover:bg-[#1a9e7a] text-white px-6 py-2 rounded-lg font-semibold transition text-sm"
                    >
                        <i className="fas fa-folder-open mr-2"></i> Seleccionar archivo
                    </button>
                    {selectedFile && (
                        <div className="mt-3">
                            <p className="text-sm text-[#20c997] font-medium">
                                <i className="fas fa-check-circle mr-1"></i>
                                Archivo seleccionado: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                            </p>
                            {filePreview && (
                                <div className="mt-2">
                                    <img src={filePreview} alt="Preview" className="max-h-32 mx-auto rounded-lg border" />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de documento</label>
                        <select
                            value={tipoDocumento}
                            onChange={(e) => setTipoDocumento(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] focus:shadow-[0_0_0_3px_rgba(32,201,151,0.1)] transition bg-white"
                        >
                            <option value="identificacion">🪪 Identificación (DNI/NIE)</option>
                            <option value="licencia">📜 Licencia EASA</option>
                            <option value="certificado">📄 Certificado académico</option>
                            <option value="foto">📸 Foto carnet</option>
                            <option value="general">📁 General</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Descripción (opcional)</label>
                        <input
                            type="text"
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            placeholder="Ej: DNI escaneado, Licencia B1.1..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] focus:shadow-[0_0_0_3px_rgba(32,201,151,0.1)] transition"
                        />
                    </div>
                </div>

                <button
                    onClick={subirDocumento}
                    disabled={!selectedFile || subiendo}
                    className="mt-4 bg-gradient-to-r from-[#20c997] to-[#0c2340] text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#20c997]/30 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {subiendo ? (
                        <>
                            <span className="animate-spin">⏳</span>
                            Subiendo...
                        </>
                    ) : (
                        <>
                            <i className="fas fa-cloud-upload-alt"></i>
                            Subir documento
                        </>
                    )}
                </button>
            </div>

            {/* Lista de documentos */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-[#0c2340]">
                        <i className="fas fa-list text-[#20c997] mr-2"></i>
                        Documentos subidos
                    </h2>
                    <span className="text-sm bg-gray-100 px-3 py-1 rounded-full text-gray-600">
                        {documentos.length} documentos
                    </span>
                </div>

                {documentos.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <div className="text-6xl mb-4">📭</div>
                        <h3 className="text-lg font-semibold text-[#0c2340]">No hay documentos subidos</h3>
                        <p className="text-sm mt-1">Sube los documentos del alumno utilizando el formulario superior.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="bg-[#0c2340] text-white rounded-xl">
                                    <th className="p-3 text-left rounded-l-xl">Nombre</th>
                                    <th className="p-3 text-left">Tipo</th>
                                    <th className="p-3 text-left">Descripción</th>
                                    <th className="p-3 text-left">Fecha</th>
                                    <th className="p-3 text-left">Tamaño</th>
                                    <th className="p-3 text-left rounded-r-xl">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {documentos.map((doc) => (
                                    <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                        <td className="p-3">
                                            <span className="text-xl mr-2">{getFileIcon(doc.nombre)}</span>
                                            <span className="font-medium text-[#0c2340]">{doc.nombre}</span>
                                        </td>
                                        <td className="p-3">
                                            <span className={`text-xs px-2 py-1 rounded-full ${
                                                doc.tipo === 'identificacion' ? 'bg-blue-100 text-blue-700' :
                                                doc.tipo === 'licencia' ? 'bg-green-100 text-green-700' :
                                                doc.tipo === 'certificado' ? 'bg-yellow-100 text-yellow-700' :
                                                doc.tipo === 'foto' ? 'bg-pink-100 text-pink-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                                {getTipoLabel(doc.tipo)}
                                            </span>
                                        </td>
                                        <td className="p-3 text-gray-500">{doc.descripcion || '—'}</td>
                                        <td className="p-3 text-gray-500 text-xs">{doc.fecha_subida}</td>
                                        <td className="p-3 text-gray-500 text-xs">{formatFileSize(doc.tamaño)}</td>
                                        <td className="p-3">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => descargarDocumento(doc)}
                                                    className="bg-[#17a2b8] hover:bg-[#138496] text-white px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                                                >
                                                    <i className="fas fa-download"></i> Descargar
                                                </button>
                                                <button
                                                    onClick={() => eliminarDocumento(doc.id)}
                                                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                                                >
                                                    <i className="fas fa-trash"></i>
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

export default AdminDocumentos;