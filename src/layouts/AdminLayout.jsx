// src/layouts/AdminLayout.jsx
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

const AdminLayout = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mensajesNoLeidos, setMensajesNoLeidos] = useState(0);

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('aerotraining_user') || 'null');
        const token = localStorage.getItem('aerotraining_token');
        
        if (!token || !userData) {
            navigate('/login');
            return;
        }
        
        setUser(userData);

        const contarNoLeidos = () => {
            const data = localStorage.getItem('aerotraining_mensajes');
            if (data) {
                const todos = JSON.parse(data);
                const noLeidos = todos.filter(m => !m.leido).length;
                setMensajesNoLeidos(noLeidos);
            }
        };
        contarNoLeidos();
        const interval = setInterval(contarNoLeidos, 10000);
        return () => clearInterval(interval);
    }, [navigate]);

    // ✅ CERRAR SESIÓN CON REGISTRO DE SALIDA
    const handleLogout = async () => {
        try {
            const userData = JSON.parse(localStorage.getItem('aerotraining_user') || 'null');
            if (userData?.id) {
                const now = new Date();
                const fecha = now.toISOString().split('T')[0];
                const hora = now.toTimeString().split(' ')[0];

                // Buscar la conexión de hoy sin salida
                const { data: conexion } = await supabase
                    .from('conexiones')
                    .select('id')
                    .eq('alumno_id', userData.id)
                    .eq('fecha', fecha)
                    .is('salida', null)
                    .order('entrada', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (conexion) {
                    await supabase
                        .from('conexiones')
                        .update({ salida: hora })
                        .eq('id', conexion.id);
                    console.log('✅ Salida registrada');
                }
            }
        } catch (error) {
            console.error('Error registrando salida:', error);
        }

        localStorage.removeItem('aerotraining_token');
        localStorage.removeItem('aerotraining_user');
        navigate('/login');
    };

    // ============================================================
    // MENÚ DEL ADMINISTRADOR (CON TAREAS AÑADIDO)
    // ============================================================
    const menuItems = [
        { path: '/admin', icon: '📊', label: 'Panel Principal' },
        { path: '/admin/expedientes', icon: '👨‍🎓', label: 'Expedientes' },
        { 
            path: '/admin/mensajes', 
            icon: '✉️', 
            label: 'Mensajes',
            badge: mensajesNoLeidos > 0 ? mensajesNoLeidos : null
        },
        { path: '/admin/consultas-web', icon: '🌐', label: 'Consultas Web' },
        { path: '/admin/convocatorias', icon: '📅', label: 'Convocatorias' },
        { path: '/admin/resumen-convocatorias', icon: '📊', label: 'Resumen Convocatorias' },
        { path: '/admin/clases', icon: '🎓', label: 'Clases' },
        { path: '/admin/tareas', icon: '✅', label: 'Tareas' },  // <-- NUEVO
        { path: '/admin/avisos', icon: '📢', label: 'Avisos' },
        { path: '/admin/avisos-convocatoria', icon: '📢', label: 'Avisos por Convocatoria' },
        { path: '/admin/trazabilidad', icon: '📈', label: 'Auditoría' },
        { path: '/admin/manuales', icon: '📚', label: 'Manuales' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <aside className={`bg-gradient-to-b from-[#0a1a2f] to-[#0c2340] text-white min-h-screen transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} sticky top-0`}>
                <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">👑</span>
                        {sidebarOpen && (
                            <span className="font-bold text-lg">
                                Jefatura<span className="text-[#20c997]"> EASA</span>
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

            <main className="flex-1 overflow-y-auto">
                <header className="bg-white shadow-sm p-4 sticky top-0 z-10 flex justify-between items-center">
                    <h1 className="text-lg font-semibold text-[#0c2340]">
                        👑 Panel de Jefatura - {user?.nombre || 'Admin'}
                    </h1>
                    <div className="flex items-center gap-4">
                        <span className="px-3 py-1 bg-red-100 text-red-600 text-sm font-semibold rounded-full">
                            Administrador
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

export default AdminLayout;
