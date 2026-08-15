// src/services/iaService.js

// ============================================================
// CONFIGURACIÓN DE GOOGLE GEMINI
// ============================================================
const IA_CONFIG = {
    provider: 'gemini',
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || 'AQ.Ab8RN6ISM8Bm4EpGnhcK0MRP8rX0P3bKFbbbkzKhIMP5is1khQ',
    model: 'gemini-pro',
    url: 'https://generativelanguage.googleapis.com/v1beta/models/'
};

// ============================================================
// FUNCIÓN PARA PREGUNTAR A LA IA (CHAT)
// ============================================================
export const preguntarAIA = async (pregunta, contexto = '') => {
    try {
        const model = IA_CONFIG.model;
        const url = `${IA_CONFIG.url}${model}:generateContent?key=${IA_CONFIG.apiKey}`;

        const prompt = `
Eres el "Profesor Aero", un instructor experto en mantenimiento aeronáutico EASA Part 66.

## Reglas importantes:
1. Responde SIEMPRE en español.
2. Explica los conceptos de forma clara, didáctica y con ejemplos prácticos.
3. Usa un tono profesional pero cercano, como un profesor particular.
4. Si te preguntan algo fuera del temario aeronáutico, responde: "Lo siento, solo puedo ayudarte con temas de aeronáutica y mantenimiento EASA Part 66."

## Contexto del temario:
${contexto || 'Temario general EASA Part 66'}

## Pregunta del alumno:
${pregunta}
`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1500,
                    topP: 0.95,
                    topK: 40
                }
            })
        });

        const data = await response.json();

        if (data.error) {
            return {
                exito: false,
                error: data.error.message || 'Error en la API de Gemini'
            };
        }

        const respuesta = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                          'Lo siento, no pude procesar tu pregunta. Intenta reformularla.';

        return {
            exito: true,
            respuesta: respuesta
        };

    } catch (error) {
        console.error('Error en Gemini:', error);
        return {
            exito: false,
            error: error.message || 'Error de conexión con Gemini'
        };
    }
};

// ============================================================
// FUNCIÓN PARA GENERAR EXPLICACIÓN COMPLETA DE UN MANUAL
// ============================================================
export const generarExplicacionCompleta = async (manual, duracionMinutos = 10) => {
    try {
        const model = IA_CONFIG.model;
        const url = `${IA_CONFIG.url}${model}:generateContent?key=${IA_CONFIG.apiKey}`;

        const prompt = `
Eres el "Profesor Aero", un instructor experto en mantenimiento aeronáutico EASA Part 66.

## TAREA:
Vas a crear una explicación completa del siguiente manual/temario:

**Título:** ${manual.titulo}
**Módulo:** ${manual.modulo}
**Descripción:** ${manual.descripcion || 'Sin descripción'}

## DURACIÓN ESTIMADA:
El video debe durar aproximadamente ${duracionMinutos} minutos.

## INSTRUCCIONES:
1. Crea una explicación estructurada y didáctica para un alumno que está estudiando para su licencia EASA.
2. Divide el contenido en secciones lógicas.
3. Incluye:
   - 📚 **Introducción** (1-2 min)
   - 🔧 **Conceptos principales** (el núcleo de la explicación)
   - 💡 **Ejemplos prácticos** (aplicaciones reales en aviación)
   - 📝 **Resumen final** (conclusión y puntos clave)
   - ❓ **Preguntas para reflexionar** (3 preguntas para que el alumno se autoevalúe)

4. Cada sección debe tener un tiempo estimado.
5. Usa un tono profesional pero cercano, como un profesor particular.
6. Incluye emojis y formato para hacerlo más visual.

## CONTENIDO DEL MANUAL:
${manual.contenido || 'Manual técnico de mantenimiento aeronáutico EASA Part 66'}
`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.5,
                    maxOutputTokens: 4096,
                    topP: 0.95,
                    topK: 40
                }
            })
        });

        const data = await response.json();

        if (data.error) {
            return {
                exito: false,
                error: data.error.message || 'Error en la API de Gemini'
            };
        }

        const texto = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Intentar parsear como JSON
        try {
            const jsonMatch = texto.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const jsonData = JSON.parse(jsonMatch[0]);
                return {
                    exito: true,
                    data: jsonData,
                    texto_original: texto
                };
            }
        } catch (e) {
            console.log('No se pudo parsear JSON, devolviendo texto plano');
        }

        return {
            exito: true,
            data: {
                titulo: `Explicación de ${manual.titulo}`,
                duracion_total: duracionMinutos,
                secciones: [
                    {
                        nombre: "Contenido completo",
                        duracion: duracionMinutos,
                        contenido: texto
                    }
                ]
            },
            texto_original: texto
        };

    } catch (error) {
        console.error('Error en Gemini:', error);
        return {
            exito: false,
            error: error.message || 'Error de conexión con Gemini'
        };
    }
};

// ============================================================
// FUNCIÓN PARA ANALIZAR DOCUMENTO PDF
// ============================================================
export const analizarDocumento = async (pdfBase64, pregunta) => {
    try {
        const model = IA_CONFIG.model;
        const url = `${IA_CONFIG.url}${model}:generateContent?key=${IA_CONFIG.apiKey}`;

        const prompt = `
Eres el "Profesor Aero", un instructor experto en mantenimiento aeronáutico EASA Part 66.

## TAREA:
Analiza el siguiente documento PDF y responde a la pregunta del alumno basándote en su contenido.

## INSTRUCCIONES:
1. Responde basándote EXCLUSIVAMENTE en el contenido del documento.
2. Si la información no está en el documento, indica: "No encontré esa información en este manual."
3. Cita las secciones o páginas relevantes cuando sea posible.
4. Responde en español de forma clara y didáctica.

## PREGUNTA DEL ALUMNO:
${pregunta}
`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            },
                            {
                                inline_data: {
                                    mime_type: "application/pdf",
                                    data: pdfBase64.split(',')[1]
                                }
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 1500
                }
            })
        });

        const data = await response.json();

        if (data.error) {
            return null;
        }

        return data.candidates?.[0]?.content?.parts?.[0]?.text || null;

    } catch (error) {
        console.error('Error analizando documento:', error);
        return null;
    }
};

// ============================================================
// FUNCIÓN PARA EXTRAER TEXTO DE UN PDF (SIMULADA)
// ============================================================
export const extraerTextoDePDF = (pdfBase64) => {
    // Esta es una función simulada para cuando no hay API
    return "Contenido del manual extraído del PDF. Este es un texto de ejemplo para simular la extracción.";
};

export default {
    preguntarAIA,
    generarExplicacionCompleta,
    analizarDocumento,
    extraerTextoDePDF
};