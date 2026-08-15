// src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';

const AdminDashboard = () => {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({
        total_alumnos: 24,
        convocatorias: 5,
        mensajes_pendientes: 3,
        manuales: 12,
        alumnos_activos: 18,
        alumnos_finalizados: 6
    });

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('aerotraining_user') || 'null');
        setUser(userData);
    }, []);

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-[#0a1a2f] to-[#0c2340] rounded-2xl p-6 text-white">
                <h1 className="text-2xl font-bold">👑 Panel de Jefatura</h1>
                <p className="text-gray-300 mt-2">Bienvenido, {user?.nombre || 'Administrador'}</p>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-3xl font-bold text-[#0c2340]">{stats.total_alumnos}</p>
                    <p className="text-gray-500 text-sm">Total Alumnos</p>
                    <div className="flex gap-2 mt-2 text-xs">
                        <span className="text-green-600">✅ {stats.alumnos_activos} activos</span>
                        <span className="text-gray-400">|</span>
                        <span className="text-gray-500">🎓 {stats.alumnos_finalizados} finalizados</span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#20c997]">
                    <p className="text-3xl font-bold text-[#20c997]">{stats.convocatorias}</p>
                    <p className="text-gray-500 text-sm">Convocatorias</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-500">
                    <p className="text-3xl font-bold text-orange-500">{stats.mensajes_pendientes}</p>
                    <p className="text-gray-500 text-sm">Mensajes pendientes</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-500">
                    <p className="text-3xl font-bold text-blue-500">{stats.manuales}</p>
                    <p className="text-gray-500 text-sm">Manuales disponibles</p>
                </div>
            </div>

            {/* Accesos rápidos */}
            <div className="grid md:grid-cols-3 gap-4">
                <a href="/admin/expedientes" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-[#20c997] transition">
                    <div className="text-3xl mb-2">👨‍🎓</div>
                    <h3 className="font-bold text-[#0c2340]">Expedientes</h3>
                    <p className="text-gray-500 text-sm">Gestionar alumnos</p>
                </a>
                <a href="/admin/convocatorias" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-[#20c997] transition">
                    <div className="text-3xl mb-2">📅</div>
                    <h3 className="font-bold text-[#0c2340]">Convocatorias</h3>
                    <p className="text-gray-500 text-sm">Crear y gestionar</p>
                </a>
                <a href="/admin/mensajes" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-[#20c997] transition">
                    <div className="text-3xl mb-2">✉️</div>
                    <h3 className="font-bold text-[#0c2340]">Mensajes</h3>
                    <p className="text-gray-500 text-sm">Responder consultas</p>
                </a>
            </div>
        </div>
    );
};

export default AdminDashboard;