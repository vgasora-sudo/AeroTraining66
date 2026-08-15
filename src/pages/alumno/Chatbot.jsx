// src/pages/alumno/Chatbot.jsx
import { useState, useEffect, useRef } from 'react';
import { preguntarAIA, analizarDocumento } from '../../services/iaService';

const Chatbot = () => {
    const [mensajes, setMensajes] = useState([]);
    const [pregunta, setPregunta] = useState('');
    const [cargando, setCargando] = useState(false);
    const [manualSeleccionado, setManualSeleccionado] = useState(null);
    const [manuales, setManuales] = useState([]);
    const [modulosAlumno, setModulosAlumno] = useState([]);
    const [modoAnalisis, setModoAnalisis] = useState(false);
    const chatEndRef = useRef(null);
    const user = JSON.parse(localStorage.getItem('aerotraining_user') || 'null');

    useEffect(() => {
        cargarDatos();
        setMensajes([
            {
                tipo: 'bot',
                texto: `✈️ ¡Hola! Soy el **Profesor Aero**, tu asistente de estudio especializado en mantenimiento aeronáutico EASA Part 66.
                
📚 Puedo ayudarte con:
- Explicar conceptos de los manuales
- Resolver dudas sobre el temario
- Analizar documentos PDF completos

🔍 Selecciona un manual de la lista y empieza a preguntar.`
            }
        ]);
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [mensajes]);

    const cargarDatos = () => {
        const alumnos = JSON.parse(localStorage.getItem('aerotraining_alumnos') || '[]');
        const alumno = alumnos.find(a => a.id === user?.id || a.username === user?.username);
        
        let modulos = [];
        if (alumno && alumno.habilitados) {
            modulos = alumno.habilitados;
        } else if (alumno && alumno.progreso) {
            modulos = Object.keys(alumno.progreso);
        }
        setModulosAlumno(modulos);

        const data = localStorage.getItem('aerotraining_manuales');
        if (data) {
            const todos = JSON.parse(data);
            const filtrados = todos.filter(m => modulos.includes(m.modulo));
            setManuales(filtrados);
            if (filtrados.length > 0) {
                setManualSeleccionado(filtrados[0]);
                setMensajes(prev => [
                    ...prev,
                    {
                        tipo: 'bot',
                        texto: `📚 He cargado el manual **"${filtrados[0].titulo}"** (Módulo ${filtrados[0].modulo}).
                        
🤖 Ahora puedes preguntarme sobre este tema.`
                    }
                ]);
            }
        }
    };

    const seleccionarManual = async (manual) => {
        setManualSeleccionado(manual);
        setCargando(true);
        
        setMensajes(prev => [
            ...prev,
            {
                tipo: 'bot',
                texto: `📚 Cargando el manual **"${manual.titulo}"** (Módulo ${manual.modulo})...`
            }
        ]);

        // Si el manual tiene PDF, intentamos extraer el texto
        if (manual.archivoBase64) {
            try {
                setMensajes(prev => [
                    ...prev,
                    {
                        tipo: 'bot',
                        texto: `✅ Manual cargado correctamente. ¡Ya puedes hacer preguntas sobre **${manual.titulo}**!`
                    }
                ]);
            } catch (error) {
                setMensajes(prev => [
                    ...prev,
                    {
                        tipo: 'bot',
                        texto: `⚠️ El manual se ha cargado, pero no pude extraer todo el texto. Aun así, puedo ayudarte con preguntas generales sobre el tema.`
                    }
                ]);
            }
        } else {
            setMensajes(prev => [
                ...prev,
                {
                    tipo: 'bot',
                    texto: `📚 Manual **"${manual.titulo}"** seleccionado. Pregúntame sobre este tema.`
                }
            ]);
        }
        
        setCargando(false);
    };

    const enviarPregunta = async () => {
        if (!pregunta.trim()) return;
        if (!manualSeleccionado) {
            setMensajes(prev => [
                ...prev,
                {
                    tipo: 'bot',
                    texto: '⚠️ Primero selecciona un manual de la lista para poder ayudarte.'
                }
            ]);
            return;
        }

        const preguntaUsuario = pregunta;
        setPregunta('');
        setCargando(true);

        setMensajes(prev => [
            ...prev,
            { tipo: 'usuario', texto: preguntaUsuario }
        ]);

        // Construir contexto
        let contexto = `Manual: ${manualSeleccionado.titulo} (Módulo ${manualSeleccionado.modulo})`;
        
        // Si tiene PDF, lo analizamos con Gemini
        let respuesta = '';
        if (manualSeleccionado.archivoBase64) {
            try {
                const analisis = await analizarDocumento(manualSeleccionado.archivoBase64, preguntaUsuario);
                if (analisis && !analisis.includes('No encontré esa información')) {
                    respuesta = analisis;
                }
            } catch (error) {
                console.error('Error analizando documento:', error);
            }
        }

        // Si no hubo respuesta del PDF, usamos el modo general
        if (!respuesta) {
            const result = await preguntarAIA(preguntaUsuario, contexto);
            if (result.exito) {
                respuesta = result.respuesta;
            } else {
                respuesta = `❌ Lo siento, he tenido un problema: ${result.error}. Por favor, intenta de nuevo más tarde.`;
            }
        }

        setMensajes(prev => [
            ...prev,
            { tipo: 'bot', texto: respuesta }
        ]);

        setCargando(false);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            enviarPregunta();
        }
    };

    const formatearTexto = (texto) => {
        return texto.split('\n').map((line, i) => (
            <span key={i}>
                {line}
                <br />
            </span>
        ));
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Título */}
            <div className="bg-gradient-to-r from-[#0a1a2f] to-[#0c2340] rounded-2xl p-6 text-white">
                <div className="flex items-center gap-3">
                    <div className="text-5xl">🤖</div>
                    <div>
                        <h1 className="text-2xl font-bold">Profesor Aero</h1>
                        <p className="text-gray-300 text-sm">
                            Tu asistente IA para estudiar los manuales EASA Part 66
                        </p>
                        <span className="inline-block mt-1 text-xs bg-[#20c997]/20 text-[#20c997] px-2 py-0.5 rounded-full">
                            ✨ Potenciado por Google Gemini
                        </span>
                    </div>
                </div>
            </div>

            {/* Selección de manual */}
            {manuales.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        📚 Selecciona el manual que quieres consultar:
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {manuales.map((manual) => (
                            <button
                                key={manual.id}
                                onClick={() => seleccionarManual(manual)}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                                    manualSeleccionado?.id === manual.id
                                        ? 'bg-[#0c2340] text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {manual.titulo}
                            </button>
                        ))}
                    </div>
                    {manualSeleccionado && (
                        <p className="text-xs text-gray-400 mt-2">
                            <i className="fas fa-check-circle text-[#20c997] mr-1"></i>
                            Manual seleccionado: <strong>{manualSeleccionado.titulo}</strong>
                            {manualSeleccionado.archivoBase64 && (
                                <span className="ml-2 text-[#20c997]">✅ PDF cargado</span>
                            )}
                        </p>
                    )}
                </div>
            )}

            {manuales.length === 0 && (
                <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-200 text-yellow-700">
                    <i className="fas fa-info-circle mr-2"></i>
                    No tienes manuales disponibles. Contacta con Jefatura para que te asignen módulos.
                </div>
            )}

            {/* Chat */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 max-h-[500px] overflow-y-auto bg-gray-50 min-h-[300px]">
                    {mensajes.map((msg, index) => (
                        <div
                            key={index}
                            className={`mb-4 flex ${msg.tipo === 'usuario' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] rounded-2xl p-4 ${
                                    msg.tipo === 'usuario'
                                        ? 'bg-gradient-to-r from-[#20c997] to-[#0c2340] text-white'
                                        : 'bg-white border border-gray-200 shadow-sm'
                                }`}
                            >
                                {msg.tipo === 'bot' && (
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xl">🤖</span>
                                        <span className="text-xs font-semibold text-[#20c997]">Profesor Aero</span>
                                    </div>
                                )}
                                <div className={`text-sm ${msg.tipo === 'usuario' ? 'text-white' : 'text-gray-700'} whitespace-pre-wrap`}>
                                    {formatearTexto(msg.texto)}
                                </div>
                            </div>
                        </div>
                    ))}
                    {cargando && (
                        <div className="flex justify-start mb-4">
                            <div className="bg-white border border-gray-200 rounded-2xl p-4 max-w-[80%]">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">🤖</span>
                                    <span className="text-sm text-gray-500">Profesor Aero está analizando...</span>
                                    <span className="flex gap-1">
                                        <span className="w-2 h-2 bg-[#20c997] rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                                        <span className="w-2 h-2 bg-[#20c997] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                        <span className="w-2 h-2 bg-[#20c997] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">📚 Leyendo el manual...</p>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex gap-2">
                        <textarea
                            value={pregunta}
                            onChange={(e) => setPregunta(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Escribe tu pregunta sobre el manual..."
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] focus:ring-2 focus:ring-[#20c997]/20 transition resize-none"
                            rows="2"
                            disabled={cargando || manuales.length === 0}
                        />
                        <button
                            onClick={enviarPregunta}
                            disabled={cargando || !pregunta.trim() || manuales.length === 0}
                            className="bg-gradient-to-r from-[#20c997] to-[#0c2340] text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#20c997]/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {cargando ? (
                                <span className="animate-spin">⏳</span>
                            ) : (
                                <i className="fas fa-paper-plane text-xl"></i>
                            )}
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 flex items-center justify-between">
                        <span>
                            <i className="fas fa-info-circle mr-1"></i>
                            Pregunta sobre el manual seleccionado. El Profesor Aero te responderá con explicaciones claras.
                        </span>
                        <span className="text-[#20c997] text-[10px]">
                            ✨ Gemini AI
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Chatbot;