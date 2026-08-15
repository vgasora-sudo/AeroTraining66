// src/config.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API = {
    baseURL: API_URL,
    endpoints: {
        // Auth
        login: `${API_URL}/api/login`,
        logout: `${API_URL}/api/logout`,
        forgotPassword: `${API_URL}/api/forgot-password`,
        
        // Alumno
        dashboard: `${API_URL}/api/alumno/dashboard`,
        modulos: `${API_URL}/api/alumno/modulos`,
        clases: `${API_URL}/api/alumno/clases`,
        convocatorias: `${API_URL}/api/alumno/convocatorias_calendario`,
        confirmarAsistencia: `${API_URL}/api/confirmar_asistencia`,
        cancelarAsistencia: `${API_URL}/api/cancelar_asistencia`,
        misMensajes: `${API_URL}/api/alumno/mis_mensajes`,
        enviarMensaje: `${API_URL}/api/alumno/enviar_mensaje`,
        avisos: `${API_URL}/api/alumno/avisos_convocatoria`,
        perfil: `${API_URL}/api/alumno/perfil`,
        chatbot: `${API_URL}/api/chatbot/preguntar`,
        
        // Admin
        adminStats: `${API_URL}/api/admin/estadisticas`,
        adminAlumnos: `${API_URL}/api/admin/alumnos`,
        adminMensajes: `${API_URL}/api/admin/mensajes_json`,
        adminConsultasWeb: `${API_URL}/api/admin/consultas_web_json`,
        adminConexiones: `${API_URL}/api/admin/live_connections`,
        adminConvocatorias: `${API_URL}/api/admin/convocatorias`,
        adminManuales: `${API_URL}/api/admin/manuales`,
        adminAvisos: `${API_URL}/api/admin/avisos`,
        adminAvisosConvocatoria: `${API_URL}/api/admin/avisos_convocatoria`,
    }
};