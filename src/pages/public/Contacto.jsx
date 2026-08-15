// src/pages/public/Contacto.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { enviarConsultaPorEmail } from '../../services/emailService';

const Contacto = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        telefono: '',
        asunto: '',
        mensaje: ''
    });
    const [loading, setLoading] = useState(false);
    const [mensajeResultado, setMensajeResultado] = useState({ texto: '', tipo: '' });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validar que email o teléfono sea obligatorio
        if (!formData.email && !formData.telefono) {
            setMensajeResultado({
                texto: '⚠️ Debes proporcionar al menos un email o un teléfono para contactarte',
                tipo: 'error'
            });
            setTimeout(() => setMensajeResultado({ texto: '', tipo: '' }), 4000);
            return;
        }

        if (!formData.nombre || !formData.asunto || !formData.mensaje) {
            setMensajeResultado({
                texto: '⚠️ Por favor, completa todos los campos obligatorios',
                tipo: 'error'
            });
            setTimeout(() => setMensajeResultado({ texto: '', tipo: '' }), 4000);
            return;
        }

        setLoading(true);

        // 1. Guardar en localStorage (para el admin)
        let consultas = [];
        const stored = localStorage.getItem('aerotraining_consultas_web');
        if (stored) {
            try {
                consultas = JSON.parse(stored);
                if (!Array.isArray(consultas)) {
                    consultas = [];
                }
            } catch (e) {
                consultas = [];
            }
        }

        const nuevaConsulta = {
            id: Date.now(),
            nombre: formData.nombre,
            email: formData.email || 'No especificado',
            telefono: formData.telefono || 'No especificado',
            asunto: formData.asunto,
            mensaje: formData.mensaje,
            fecha_envio: new Date().toISOString().replace('T', ' ').slice(0, 16),
            leido: false,
            respondido: false,
            respuesta_admin: null,
            fecha_respuesta: null
        };

        consultas.push(nuevaConsulta);
        localStorage.setItem('aerotraining_consultas_web', JSON.stringify(consultas));

        // 2. Enviar correo al administrador
        const emailResult = await enviarConsultaPorEmail(formData);

        if (emailResult.success) {
            setMensajeResultado({
                texto: '✅ ¡Mensaje enviado con éxito! Te responderemos en menos de 24 horas. ✈️',
                tipo: 'success'
            });
        } else {
            setMensajeResultado({
                texto: '⚠️ Mensaje guardado. Hubo un problema al enviar el correo, pero nos pondremos en contacto.',
                tipo: 'warning'
            });
        }

        setFormData({
            nombre: '',
            email: '',
            telefono: '',
            asunto: '',
            mensaje: ''
        });
        setLoading(false);

        setTimeout(() => {
            setMensajeResultado({ texto: '', tipo: '' });
        }, 5000);
    };

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-[#0c2340]">📬 Contacta con nosotros</h1>
                <p className="text-gray-500 mt-2">
                    ¿Tienes dudas sobre nuestra formación? Escríbenos y te responderemos en menos de 24 horas.
                </p>
            </div>

            {mensajeResultado.texto && (
                <div className={`p-4 rounded-xl border-l-4 mb-6 ${
                    mensajeResultado.tipo === 'success' 
                        ? 'bg-green-50 border-green-500 text-green-700' 
                        : mensajeResultado.tipo === 'warning'
                        ? 'bg-yellow-50 border-yellow-500 text-yellow-700'
                        : 'bg-red-50 border-red-500 text-red-700'
                }`}>
                    {mensajeResultado.texto}
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <i className="fas fa-user text-[#20c997] mr-2"></i>
                            Nombre completo *
                        </label>
                        <input
                            type="text"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            placeholder="Ej: Juan Pérez"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] focus:ring-2 focus:ring-[#20c997]/20 transition"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <i className="fas fa-envelope text-[#20c997] mr-2"></i>
                                Correo electrónico
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="tu@email.com"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] focus:ring-2 focus:ring-[#20c997]/20 transition"
                                disabled={loading}
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <i className="fas fa-phone text-[#20c997] mr-2"></i>
                                Teléfono
                            </label>
                            <input
                                type="tel"
                                name="telefono"
                                value={formData.telefono}
                                onChange={handleChange}
                                placeholder="Ej: 600 000 000"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] focus:ring-2 focus:ring-[#20c997]/20 transition"
                                disabled={loading}
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                * Email o teléfono son obligatorios
                            </p>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <i className="fas fa-tag text-[#20c997] mr-2"></i>
                            Asunto *
                        </label>
                        <select
                            name="asunto"
                            value={formData.asunto}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] focus:ring-2 focus:ring-[#20c997]/20 transition bg-white"
                            required
                            disabled={loading}
                        >
                            <option value="">Selecciona un asunto</option>
                            <option value="Información general">📋 Información general</option>
                            <option value="Matriculación">📝 Matriculación</option>
                            <option value="Convocatorias">📅 Convocatorias</option>
                            <option value="Clases">📺 Clases del Campus</option>
                            <option value="Soporte técnico">🔧 Soporte técnico</option>
                            <option value="Otro">❓ Otro</option>
                        </select>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <i className="fas fa-comment text-[#20c997] mr-2"></i>
                            Mensaje *
                        </label>
                        <textarea
                            name="mensaje"
                            value={formData.mensaje}
                            onChange={handleChange}
                            rows="5"
                            placeholder="Cuéntanos qué necesitas..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] focus:ring-2 focus:ring-[#20c997]/20 transition resize-none"
                            required
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-[#20c997] to-[#0c2340] text-white py-4 rounded-xl font-bold text-base hover:shadow-lg hover:shadow-[#20c997]/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin">⏳</span>
                                Enviando...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-paper-plane"></i>
                                Enviar mensaje
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Contacto;