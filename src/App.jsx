// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';



// Páginas Públicas
import Home from './pages/Home';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Contacto from './pages/public/Contacto';

// Páginas del Alumno
import Dashboard from './pages/Dashboard';
import MisModulos from './pages/MisModulos';
import MisClases from './pages/alumno/MisClases';
import Convocatorias from './pages/Convocatorias';
import MisMensajes from './pages/MisMensajes';
import Avisos from './pages/alumno/Avisos';
import Chatbot from './pages/alumno/Chatbot';
import Perfil from './pages/Perfil';
import BancoPreguntas from './pages/BancoPreguntas';
import ContactarTutor from './pages/alumno/ContactarTutor';
import MisManuales from './pages/alumno/MisManuales';

// Páginas del Administrador
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminExpedientes from './pages/admin/AdminExpedientes';
import AdminMensajes from './pages/admin/AdminMensajes';
import AdminConsultasWeb from './pages/admin/AdminConsultasWeb';
import AdminConvocatorias from './pages/admin/AdminConvocatorias';
import AdminResumenConvocatorias from './pages/admin/AdminResumenConvocatorias';
import AdminManuales from './pages/admin/AdminManuales';
import AdminManualesIA from './pages/admin/AdminManualesIA';
import AdminAvisos from './pages/admin/AdminAvisos';
import AdminAvisosConvocatoria from './pages/admin/AdminAvisosConvocatoria';
import AdminTrazabilidad from './pages/admin/AdminTrazabilidad';
import AdminDocumentos from './pages/admin/AdminDocumentos';
import AdminClases from './pages/admin/AdminClases';
import ExpedienteAlumno from './pages/admin/ExpedienteAlumno';
import ResponderMensaje from './pages/admin/ResponderMensaje';
import ResponderConsultaWeb from './pages/admin/ResponderConsultaWeb';
import AdminTareasConvocatoria from './pages/admin/AdminTareasConvocatoria';

// Layouts
import AlumnoLayout from './layouts/AlumnoLayout'; // L mayúscula
import AdminLayout from './layouts/AdminLayout';

// ============================================================
// COMPONENTE DE RUTA PROTEGIDA
// ============================================================
const ProtectedRoute = ({ children, requireAdmin = false }) => {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('aerotraining_token');
        const userData = JSON.parse(localStorage.getItem('aerotraining_user') || 'null');

        if (!token || !userData) {
            navigate('/login');
            setLoading(false);
            return;
        }

        setUser(userData);
        setIsAdmin(userData.is_admin || userData.es_admin || false);
        setLoading(false);
    }, [navigate]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-4xl animate-spin">✈️</div>
                    <p className="mt-4 text-gray-500">Verificando acceso...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (requireAdmin && !isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

// ============================================================
// COMPONENTE PRINCIPAL APP
// ============================================================
function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* ========================================================== */}
                {/* Páginas Públicas */}
                {/* ========================================================== */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/contacto" element={<Contacto />} />

                {/* ========================================================== */}
                {/* Rutas del Alumno */}
                {/* ========================================================== */}
                <Route element={<ProtectedRoute><AlumnoLayout /></ProtectedRoute>}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/modulos" element={<MisModulos />} />
                    <Route path="/manuales" element={<MisManuales />} />
                    <Route path="/clases" element={<MisClases />} />
                    <Route path="/convocatorias" element={<Convocatorias />} />
                    <Route path="/mensajes" element={<MisMensajes />} />
                    <Route path="/avisos" element={<Avisos />} />
                    <Route path="/chatbot" element={<Chatbot />} />
                    <Route path="/perfil" element={<Perfil />} />
                    <Route path="/banco-preguntas" element={<BancoPreguntas />} />
                    <Route path="/contactar-tutor" element={<ContactarTutor />} />
                </Route>

                {/* ========================================================== */}
                {/* Rutas del Administrador */}
                {/* ========================================================== */}
                <Route element={<ProtectedRoute requireAdmin={true}><AdminLayout /></ProtectedRoute>}>
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/expedientes" element={<AdminExpedientes />} />
                    <Route path="/admin/mensajes" element={<AdminMensajes />} />
                    <Route path="/admin/consultas-web" element={<AdminConsultasWeb />} />
                    <Route path="/admin/consulta-web/:id" element={<ResponderConsultaWeb />} />
                    <Route path="/admin/convocatorias" element={<AdminConvocatorias />} />
                    <Route path="/admin/resumen-convocatorias" element={<AdminResumenConvocatorias />} />
                    <Route path="/admin/manuales" element={<AdminManuales />} />
                    <Route path="/admin/manuales-ia" element={<AdminManualesIA />} />
                    <Route path="/admin/avisos" element={<AdminAvisos />} />
                    <Route path="/admin/avisos-convocatoria" element={<AdminAvisosConvocatoria />} />
                    <Route path="/admin/trazabilidad" element={<AdminTrazabilidad />} />
                    <Route path="/admin/documentos/:alumnoId" element={<AdminDocumentos />} />
                    <Route path="/admin/clases" element={<AdminClases />} />
                    <Route path="/admin/responder-mensaje/:id" element={<ResponderMensaje />} />
                    <Route path="/admin/expediente/:id" element={<ExpedienteAlumno />} />
                    <Route path="/admin/tareas" element={<AdminTareasConvocatoria />} />
                </Route>

                {/* ========================================================== */}
                {/* 404 - No encontrada */}
                {/* ========================================================== */}
                <Route path="*" element={
                    <div className="min-h-screen flex items-center justify-center bg-gray-50">
                        <div className="text-center">
                            <h1 className="text-6xl font-bold text-[#0c2340]">404</h1>
                            <p className="text-xl text-gray-600 mt-4">Página no encontrada</p>
                            <a href="/" className="mt-6 inline-block text-[#20c997] hover:underline">Volver al inicio</a>
                        </div>
                    </div>
                } />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
