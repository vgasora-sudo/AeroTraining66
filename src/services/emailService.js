// src/services/emailService.js
import emailjs from '@emailjs/browser';

// ============================================================
// 🔴 CONFIGURACIÓN DE EMAILJS
// ============================================================
const EMAIL_CONFIG = {
    SERVICE_ID: 'service_gtsc82a',
    TEMPLATE_ID_CONSULTA: 'template_v9becy9',
    TEMPLATE_ID_RESPUESTA: 'template_p7n06p6',
    TEMPLATE_ID_CONVOCATORIA: 'template_CONVOCATORIA', // ← Crea este template en EmailJS
    TEMPLATE_ID_AVISO: 'template_AVISO',               // ← Crea este template en EmailJS
    PUBLIC_KEY: 'p_DRGnfn97YPzcvS8'
};

// Inicializar EmailJS
emailjs.init(EMAIL_CONFIG.PUBLIC_KEY);

// ============================================================
// ENVIAR CONSULTA AL ADMINISTRADOR
// ============================================================
export const enviarConsultaPorEmail = async (datosConsulta) => {
    try {
        const templateParams = {
            nombre: datosConsulta.nombre,
            email: datosConsulta.email,
            telefono: datosConsulta.telefono || 'No especificado',
            asunto: datosConsulta.asunto,
            mensaje: datosConsulta.mensaje,
            fecha: new Date().toLocaleString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        };

        const response = await emailjs.send(
            EMAIL_CONFIG.SERVICE_ID,
            EMAIL_CONFIG.TEMPLATE_ID_CONSULTA,
            templateParams,
            EMAIL_CONFIG.PUBLIC_KEY
        );

        console.log('✅ Correo de consulta enviado:', response);
        return { success: true, response };
    } catch (error) {
        console.error('❌ Error en consulta:', error);
        return { success: false, error };
    }
};

// ============================================================
// ENVIAR RESPUESTA AL CONTACTO
// ============================================================
export const enviarRespuestaPorEmail = async (datosRespuesta) => {
    try {
        const templateParams = {
            nombre: datosRespuesta.nombre,
            asunto: datosRespuesta.asunto,
            respuesta: datosRespuesta.respuesta
        };

        const response = await emailjs.send(
            EMAIL_CONFIG.SERVICE_ID,
            EMAIL_CONFIG.TEMPLATE_ID_RESPUESTA,
            templateParams,
            EMAIL_CONFIG.PUBLIC_KEY
        );

        console.log('✅ Respuesta enviada:', response);
        return { success: true, response };
    } catch (error) {
        console.error('❌ Error en respuesta:', error);
        return { success: false, error };
    }
};

// ============================================================
// NOTIFICAR NUEVA CONVOCATORIA
// ============================================================
export const notificarConvocatoria = async (alumnoEmail, alumnoNombre, convocatoria) => {
    try {
        const templateParams = {
            nombre: alumnoNombre,
            email: alumnoEmail,
            modulo: convocatoria.modulo_id,
            fecha: new Date(convocatoria.fecha).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }),
            hora_inicio: convocatoria.hora_inicio || '10:00',
            hora_fin: convocatoria.hora_fin || '12:00',
            plazas: convocatoria.plazas_totales || 10,
            link: 'https://aerotraining-web.vercel.app/convocatorias'
        };

        const response = await emailjs.send(
            EMAIL_CONFIG.SERVICE_ID,
            EMAIL_CONFIG.TEMPLATE_ID_CONVOCATORIA,
            templateParams,
            EMAIL_CONFIG.PUBLIC_KEY
        );

        console.log(`✅ Correo de convocatoria enviado a ${alumnoEmail}`);
        return { success: true, response };
    } catch (error) {
        console.error(`❌ Error enviando convocatoria a ${alumnoEmail}:`, error);
        return { success: false, error };
    }
};

// ============================================================
// NOTIFICAR NUEVO AVISO
// ============================================================
export const notificarAviso = async (alumnoEmail, alumnoNombre, aviso) => {
    try {
        const templateParams = {
            nombre: alumnoNombre,
            email: alumnoEmail,
            titulo: aviso.titulo,
            contenido: aviso.contenido,
            tipo: aviso.tipo || 'General',
            fecha: new Date(aviso.fecha || aviso.created_at).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
            link: 'https://aerotraining-web.vercel.app/avisos'
        };

        const response = await emailjs.send(
            EMAIL_CONFIG.SERVICE_ID,
            EMAIL_CONFIG.TEMPLATE_ID_AVISO,
            templateParams,
            EMAIL_CONFIG.PUBLIC_KEY
        );

        console.log(`✅ Correo de aviso enviado a ${alumnoEmail}`);
        return { success: true, response };
    } catch (error) {
        console.error(`❌ Error enviando aviso a ${alumnoEmail}:`, error);
        return { success: false, error };
    }
};

// ============================================================
// NOTIFICAR A TODOS LOS ALUMNOS DE UN MÓDULO
// ============================================================
export const notificarConvocatoriaAModulo = async (alumnos, convocatoria) => {
    const resultados = [];
    for (const alumno of alumnos) {
        const result = await notificarConvocatoria(alumno.email, alumno.nombre, convocatoria);
        resultados.push(result);
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    return resultados;
};

// ============================================================
// NOTIFICAR AVISO A TODOS LOS ALUMNOS
// ============================================================
export const notificarAvisoATodos = async (alumnos, aviso) => {
    const resultados = [];
    for (const alumno of alumnos) {
        const result = await notificarAviso(alumno.email, alumno.nombre, aviso);
        resultados.push(result);
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    return resultados;
};

// ============================================================
// EXPORTAR TODO
// ============================================================
export default {
    enviarConsultaPorEmail,
    enviarRespuestaPorEmail,
    notificarConvocatoria,
    notificarAviso,
    notificarConvocatoriaAModulo,
    notificarAvisoATodos,
};
