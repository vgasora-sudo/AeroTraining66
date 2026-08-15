// server.js
import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.static('dist'));

// ============================================================
// CONFIGURACIÓN DE GEMINI
// ============================================================
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.warn('⚠️ No hay API Key de Gemini. Usando modo simulado.');
}

const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

// ============================================================
// RESPUESTAS LOCALES (FALLBACK)
// ============================================================
const generarRespuestaLocal = (pregunta) => {
    const respuestas = [
        `📚 **Según el manual M14_B2 (Págs. 43-45 / Apartado 14.2.4)**

El sistema de indicación de presión utiliza un **tubo Bourdon** que se desenrolla al aplicar presión, moviendo un mecanismo de engranajes que acciona la aguja del indicador.

💡 **Dato técnico:** El tubo tiene sección ovalada y forma de "C". Al aumentar la presión, tiende a enderezarse.

📖 **Referencia:** Manual M14_B2, Sección 14.2.4`,

        `✈️ **Sistema FADEC (Págs. 22-27 / Apartado 14.1.B)**

El FADEC es el "cerebro" del motor moderno.

🎯 **Componentes:**
1. **ECU** - Procesa datos
2. **HMU** - Actúa sobre el combustible
3. **Sensores** - Temperatura, presión, RPM

🔧 **Redundancia:** Dos canales (A y B) con cross-talk.`,

        `🛠️ **Sistema de Termopar (Págs. 34-39 / Apartado 14.2.2)**

Los termopares miden la temperatura de gases de escape (EGT).

⚡ **Funcionamiento:**
1. Unión caliente → expuesta a los gases
2. Unión fría → compensada con termistor NTC
3. Diferencia de temperatura genera tensión (mV)`
    ];

    return respuestas[Math.floor(Math.random() * respuestas.length)];
};

// ============================================================
// ENDPOINT: CHAT
// ============================================================
app.post('/api/chat', async (req, res) => {
    const { messages, manual } = req.body;

    if (!messages || messages.length === 0) {
        return res.status(400).json({ error: 'No se enviaron mensajes' });
    }

    const userMessage = messages[messages.length - 1]?.content || '';
    const manualContext = manual || 'M14_B2 - Propulsión';

    // Si no hay API Key, usar respuestas locales
    if (!ai) {
        console.log('⚠️ Usando modo simulado');
        return res.json({ text: generarRespuestaLocal(userMessage) });
    }

    try {
        const prompt = `
Eres el "Asistente Técnico M14_B2", experto en mantenimiento aeronáutico EASA Part 66.

## REGLAS:
1. Responde en español.
2. Solo responde basándote en el manual M14_B2.
3. Si no está en el manual, di: "No encontré esa información en el manual M14_B2."
4. Cita páginas y apartados.

## MANUAL:
${manualContext}

## PREGUNTA:
${userMessage}
`;

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt
        });

        const text = response.text || generarRespuestaLocal(userMessage);
        res.json({ text });

    } catch (error) {
        console.error('Error Gemini:', error);
        res.json({ text: generarRespuestaLocal(userMessage) });
    }
});

// ============================================================
// ENDPOINT: MANUALES
// ============================================================
app.get('/api/manuales', (req, res) => {
    res.json({
        manuales: [
            {
                id: 'm14_b2',
                titulo: 'M14_B2 - Propulsión',
                modulo: 'M14',
                descripcion: 'Manual de Propulsión para Licencia B2',
                archivo: 'M14_B2.pdf'
            }
        ]
    });
});

// ============================================================
// INICIAR SERVIDOR
// ============================================================
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📚 Modo: ${ai ? 'Gemini API' : 'Simulación local'}`);
});