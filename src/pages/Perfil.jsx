// src/pages/Perfil.jsx
const Perfil = () => {
    const user = JSON.parse(localStorage.getItem('aerotraining_user') || 'null');
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-2xl font-bold text-[#0c2340] mb-6">👤 Mi Perfil</h2>
            <div className="space-y-3">
                <p><strong>Nombre:</strong> {user?.nombre || 'No disponible'}</p>
                <p><strong>Usuario:</strong> {user?.username || 'No disponible'}</p>
                <p><strong>Email:</strong> {user?.email || 'No disponible'}</p>
                <p><strong>Licencia:</strong> {user?.licencia || 'B1.1'}</p>
            </div>
        </div>
    );
};
export default Perfil;