// src/layouts/AlumnoLayout.jsx
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

const AlumnoLayout = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    
    // ============================================================
    // ESTADOS PARA NOTIFICACIONES
    // ============================================================
    const [mensajesNuevos, setMensajesNuevos] = useState(0);
    const [convocatoriasNoLeidas, setConvocatoriasNoLeidas] = useState(0);
    const [avisosNoLeidos, setAvisosNoLeidos] = useState(0);
    const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);
    const [ultimosAvisos, setUltimosAvisos] = useState([]);
    const [ultimasConvocatorias, setUltimasConvocatorias] = useState([]);
    const [todasNotificaciones, setTodasNotificaciones] = useState([]);

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('aerotraining_user') || 'null');
        const token = localStorage.getItem('aerotraining_token');
        
        if (!token || !userData) {
            navigate('/login');
            return;
        }
        
        setUser(userData);
        cargarNotificaciones(userData);
    }, [navigate]);

    // ============================================================
    // CARGAR TODAS LAS NOTIFICACIONES (AVISOS + CONVOCATORIAS)
    // ============================================================
    const cargarNotificaciones = async (userData) => {
        try {
            if (!userData) return;

            let alumnoId = null;
            let modulosAlumno = [];
            
            if (userData?.username) {
                const { data: alumno, error: alumnoError } = await supabase
                    .from('alumnos')
                    .select('id, habilitados')
                    .eq('username', userData.username)
                    .maybeSingle();

                if (alumnoError) {
                    console.error('Error buscando alumno:', alumnoError);
                }

                if (alumno) {
                    alumnoId = alumno.id;
                    modulosAlumno = alumno.habilitados || [];
                }
            }

            // 1. CARGAR AVISOS NO LEÍDOS
            const { data: avisosData, error: avisosError } = await supabase
                .from('avisos')
                .select('*')
                .or(`para_todos.eq.true,alumno_id.eq.${alumnoId || '00000000-0000-0000-0000-000000000000'}`)
                .eq('leido', false)
                .order('fecha', { ascending: false })
                .limit(5);

            if (!avisosError && avisosData) {
                setAvisosNoLeidos(avisosData.length);
                setUltimosAvisos(avisosData);
            }

            // 2. CARGAR CONVOCATORIAS NUEVAS (NO VISTAS)
            const key = `convocatorias_vistas_${userData.username}`;
            const vistasData = JSON.parse(localStorage.getItem(key) || '{"vistas": false, "ultima_fecha": null}');
            const ultimaFechaVista = vistasData.ultima_fecha || new Date(0).toISOString();

            let convsNuevas = [];
            if (modulosAlumno.length > 0) {
                const hoy = new Date().toISOString().split('T')[0];

                const { data: convsData, error: convsError } = await supabase
                    .from('convocatorias')
                    .select('*')
                    .in('modulo_id', modulosAlumno)
                    .gte('fecha', hoy)
                    .order('fecha', { ascending: true });

                if (!convsError && convsData) {
                    convsNuevas = convsData.filter(c => {
                        const fechaConv = new Date(c.created_at || c.fecha);
                        const ultimaVista = new Date(ultimaFechaVista);
                        return fechaConv > ultimaVista;
                    });

                    setConvocatoriasNoLeidas(convsNuevas.length);
                    setUltimasConvocatorias(convsNuevas.slice(0, 3));
                }
            }

            // 3. COMBINAR NOTIFICACIONES
            const notificaciones = [];

            (avisosData || []).forEach(a => {
                notificaciones.push({
                    id: `aviso_${a.id}`,
                    tipo: 'aviso',
                    titulo: a.titulo,
                    contenido: a.contenido,
                    fecha: a.fecha,
                    leido: false,
                    link: '/avisos',
                    originalId: a.id,
                    esAviso: true
                });
            });

            convsNuevas.slice(0, 5).forEach(c => {
                notificaciones.push({
                    id: `conv_${c.id}`,
                    tipo: 'convocatoria',
                    titulo: c.titulo || `Convocatoria ${c.modulo_id}`,
                    contenido: `📅 ${new Date(c.fecha).toLocaleDateString('es-ES')} - Módulo ${c.modulo_id}`,
                    fecha: c.created_at || c.fecha,
                    leido: false,
                    link: '/convocatorias',
                    originalId: c.id,
                    esAviso: false
                });
            });

            notificaciones.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            setTodasNotificaciones(notificaciones.slice(0, 10));

        } catch (error) {
            console.error('Error cargando notificaciones:', error);
        }
    };

    // Recargar notificaciones cada 30 segundos
    useEffect(() => {
        if (!user) return;
        
        const interval = setInterval(() => {
            cargarNotificaciones(user);
        }, 30000);

        return () => clearInterval(interval);
    }, [user]);

    // ============================================================
    // MARCAR CONVOCATORIAS COMO VISTAS
    // ============================================================
    const marcarConvocatoriasVistas = () => {
        if (user?.username) {
            const key = `convocatorias_vistas_${user.username}`;
            localStorage.setItem(key, JSON.stringify({
                vistas: true,
                ultima_fecha: new Date().toISOString()
            }));
            setConvocatoriasNoLeidas(0);
            setUltimasConvocatorias([]);
            cargarNotificaciones(user);
        }
    };

    // ============================================================
    // MARCAR AVISO COMO LEÍDO (SUPABASE)
    // ============================================================
    const marcarAvisoLeido = async (avisoId) => {
        try {
            const { error } = await supabase
                .from('avisos')
                .update({ leido: true })
                .eq('id', avisoId);

            if (error) throw error;

            setUltimosAvisos(ultimosAvisos.filter(a => a.id !== avisoId));
            setAvisosNoLeidos(avisosNoLeidos - 1);
            cargarNotificaciones(user);

        } catch (error) {
            console.error('Error marcando aviso como leído:', error);
        }
    };

    // ============================================================
    // MARCAR TODOS COMO LEÍDOS
    // ============================================================
    const marcarTodosLeidos = async () => {
        if (ultimosAvisos.length > 0) {
            try {
                const ids = ultimosAvisos.map(a => a.id);
                const { error } = await supabase
                    .from('avisos')
                    .update({ leido: true })
                    .in('id', ids);

                if (error) throw error;

                setUltimosAvisos([]);
                setAvisosNoLeidos(0);
            } catch (error) {
                console.error('Error marcando avisos como leídos:', error);
            }
        }

        marcarConvocatoriasVistas();
    };

    // ============================================================
    // CONTAR MENSAJES NUEVOS (LOCALSTORAGE)
    // ============================================================
    useEffect(() => {
        const contarNuevos = () => {
            const userData = JSON.parse(localStorage.getItem('aerotraining_user') || 'null');
            const data = localStorage.getItem('aerotraining_mensajes');
            if (data && userData) {
                try {
                    const todos = JSON.parse(data);
                    const misMensajes = todos.filter(m => 
                        m.alumno_usuario === userData?.username && 
                        m.respondido && 
                        m.respuesta_admin &&
                        m.leido === false
                    );
                    setMensajesNuevos(misMensajes.length);
                } catch (e) {
                    setMensajesNuevos(0);
                }
            }
        };
        contarNuevos();
        const interval = setInterval(contarNuevos, 10000);
        return () => clearInterval(interval);
    }, []);

    // ============================================================
    // ✅ REGISTRAR SALIDA (con alertas para depuración)
    // ============================================================
    const registrarSalida = async (alumnoId) => {
        try {
            if (!alumnoId) {
                alert('❌ Error: No se pudo obtener el ID del alumno para registrar salida.');
                console.error('❌ alumnoId es null o undefined');
                return;
            }

            const now = new Date();
            const fecha = now.toISOString().split('T')[0];
            const hora = now.toTimeString().split(' ')[0];

            // Buscar la conexión de hoy sin salida
            const { data: conexion, error: findError } = await supabase
                .from('conexiones')
                .select('id')
                .eq('alumno_id', alumnoId)
                .eq('fecha', fecha)
                .is('salida', null)
                .order('entrada', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (findError) {
                alert(`❌ Error buscando conexión activa: ${findError.message}`);
                console.error('❌ Error buscando conexión activa:', findError);
                return;
            }

            if (conexion) {
                console.log(`✅ Conexión activa encontrada (ID: ${conexion.id}), registrando salida a las ${hora}...`);
                const { error: updateError } = await supabase
                    .from('conexiones')
                    .update({ salida: hora })
                    .eq('id', conexion.id);

                if (updateError) {
                    alert(`❌ Error registrando salida: ${updateError.message}`);
                    console.error('❌ Error registrando salida:', updateError);
                } else {
                    alert(`✅ Salida registrada a las ${hora}`);
                    console.log('✅ Salida registrada correctamente');
                }
            } else {
                alert('⚠️ No se encontró conexión activa para registrar salida');
                console.log('⚠️ No se encontró conexión activa para registrar salida');
            }
        } catch (error) {
            alert(`❌ Error en registrarSalida: ${error.message}`);
            console.error('❌ Error en registrarSalida:', error);
        }
    };

    // ============================================================
    // CERRAR SESIÓN (con registro de salida)
    // ============================================================
    const handleLogout = async () => {
        console.log('🔴 Cerrando sesión...');

        try {
            const userData = JSON.parse(localStorage.getItem('aerotraining_user') || 'null');
            if (userData?.id) {
                await registrarSalida(userData.id);
            } else {
                alert('⚠️ No se encontró ID de usuario para registrar salida');
                console.warn('⚠️ No se encontró ID de usuario para registrar salida');
            }
        } catch (error) {
            alert(`❌ Error registrando salida: ${error.message}`);
            console.error('❌ Error registrando salida:', error);
        }

        localStorage.removeItem('aerotraining_token');
        localStorage.removeItem('aerotraining_user');
        console.log('👋 Sesión cerrada, redirigiendo a login...');
        navigate('/login');
    };

    // ============================================================
    // MENÚ DEL ALUMNO
    // ============================================================
    const totalNotificaciones = avisosNoLeidos + convocatoriasNoLeidas;

    const menuItems = [
        { path: '/dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/manuales', icon: '📚', label: 'Mis Manuales' },
        { 
            path: '/convocatorias', 
            icon: '📅', 
            label: 'Convocatorias',
            badge: convocatoriasNoLeidas > 0 ? convocatoriasNoLeidas : null
        },
        { 
            path: '/avisos', 
            icon: '📢', 
            label: 'Avisos',
            badge: avisosNoLeidos > 0 ? avisosNoLeidos : null
        },
        { 
            path: '/clases', 
            icon: '🎓', 
            label: 'Mis Clases'
        },
        { 
            path: '/chatbot', 
            icon: '🤖', 
            label: 'Estudiar con IA'
        },
        { 
            path: '/contactar-tutor', 
            icon: '📞', 
            label: 'Contactar con el tutor',
            badge: mensajesNuevos > 0 ? mensajesNuevos : null
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className={`bg-gradient-to-b from-[#0a1a2f] to-[#0c2340] text-white min-h-screen transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} sticky top-0`}>
                <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">✈️</span>
                        {sidebarOpen && (
                            <span className="font-bold text-lg">
                                Aero<span className="text-[#20c997]">Training</span>
                            </span>
                        )}
                    </div>
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-white">
                        {sidebarOpen ? '◀' : '▶'}
                    </button>
                </div>

                <nav className="p-4 space-y-1">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#20c997]/20 transition-colors relative"
                        >
                            <span className="text-xl">{item.icon}</span>
                            {sidebarOpen && (
                                <>
                                    <span>{item.label}</span>
                                    {item.badge && (
                                        <span className="absolute right-3 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                                            {item.badge}
                                        </span>
                                    )}
                                </>
                            )}
                        </Link>
                    ))}
                </nav>

                <div className="absolute bottom-0 w-full p-4 border-t border-gray-700">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-red-500/20 transition-colors text-red-400"
                    >
                        <span className="text-xl">🚪</span>
                        {sidebarOpen && <span>Cerrar Sesión</span>}
                    </button>
                </div>
            </aside>

            {/* Contenido principal */}
            <main className="flex-1 overflow-y-auto">
                <header className="bg-white shadow-sm p-4 sticky top-0 z-10 flex justify-between items-center">
                    <h1 className="text-lg font-semibold text-[#0c2340]">
                        Bienvenido, {user?.nombre || 'Alumno'}
                    </h1>
                    <div className="flex items-center gap-3">
                        {/* 🔔 CAMPANA DE NOTIFICACIONES */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setMostrarNotificaciones(!mostrarNotificaciones);
                                    if (!mostrarNotificaciones) {
                                        marcarConvocatoriasVistas();
                                    }
                                }}
                                className="relative p-2 rounded-full hover:bg-gray-100 transition"
                            >
                                <span className="text-2xl">🔔</span>
                                {totalNotificaciones > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                                        {totalNotificaciones > 9 ? '9+' : totalNotificaciones}
                                    </span>
                                )}
                            </button>

                            {/* Dropdown de notificaciones */}
                            {mostrarNotificaciones && (
                                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[450px] overflow-hidden">
                                    <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                                        <h3 className="font-bold text-[#0c2340] text-sm">🔔 Notificaciones</h3>
                                        {totalNotificaciones > 0 && (
                                            <button
                                                onClick={marcarTodosLeidos}
                                                className="text-xs text-[#20c997] hover:underline font-medium"
                                            >
                                                Marcar todos como leídos
                                            </button>
                                        )}
                                    </div>

                                    <div className="overflow-y-auto max-h-[320px]">
                                        {todasNotificaciones.length === 0 ? (
                                            <div className="p-6 text-center text-gray-500">
                                                <p className="text-4xl mb-2">📭</p>
                                                <p className="text-sm">No hay notificaciones nuevas</p>
                                            </div>
                                        ) : (
                                            todasNotificaciones.map((notif) => (
                                                <div 
                                                    key={notif.id} 
                                                    className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition ${
                                                        notif.tipo === 'convocatoria' ? 'border-l-3 border-l-[#20c997]' : ''
                                                    }`}
                                                >
                                                    <div className="flex justify-between items-start gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <p className="font-semibold text-sm text-[#0c2340]">
                                                                    {notif.tipo === 'convocatoria' ? '📅 ' : '📢 '}
                                                                    {notif.titulo}
                                                                </p>
                                                                {notif.tipo === 'convocatoria' && (
                                                                    <span className="text-[10px] bg-[#20c997] text-white px-2 py-0.5 rounded-full font-medium">
                                                                        Nueva
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                                                                {notif.contenido}
                                                            </p>
                                                            <p className="text-[10px] text-gray-400 mt-1">
                                                                {new Date(notif.fecha).toLocaleString('es-ES', {
                                                                    day: '2-digit',
                                                                    month: '2-digit',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </p>
                                                        </div>
                                                        <Link
                                                            to={notif.link}
                                                            className="text-xs text-[#20c997] hover:underline font-medium whitespace-nowrap mt-1"
                                                            onClick={() => setMostrarNotificaciones(false)}
                                                        >
                                                            Ver
                                                        </Link>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <div className="p-2 border-t border-gray-200 bg-gray-50 flex justify-center gap-4">
                                        <Link 
                                            to="/avisos" 
                                            className="text-xs text-[#20c997] hover:underline font-medium"
                                            onClick={() => setMostrarNotificaciones(false)}
                                        >
                                            📢 Ver avisos
                                        </Link>
                                        <span className="text-gray-300">|</span>
                                        <Link 
                                            to="/convocatorias" 
                                            className="text-xs text-[#20c997] hover:underline font-medium"
                                            onClick={() => setMostrarNotificaciones(false)}
                                        >
                                            📅 Ver convocatorias
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>

                        <span className="px-3 py-1 bg-[#20c997]/10 text-[#20c997] text-sm font-semibold rounded-full">
                            {user?.licencia || 'B1.1'}
                        </span>
                    </div>
                </header>

                <div className="p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AlumnoLayout;
