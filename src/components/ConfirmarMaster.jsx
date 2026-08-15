// src/components/ConfirmarMaster.jsx
import { useState } from 'react';
import { supabase } from '../supabase';

const ConfirmarMaster = ({ onConfirm, onCancel, mensaje }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        setError('');

        try {
            const { data, error } = await supabase
                .from('alumnos')
                .select('password')
                .eq('username', 'master_admin')
                .single();

            if (error) {
                setError('Error al verificar master_admin');
                setLoading(false);
                return;
            }

            if (data.password === password) {
                onConfirm();
            } else {
                setError('❌ Contraseña de master_admin incorrecta');
            }
        } catch (err) {
            setError('Error al verificar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                <h3 className="text-xl font-bold text-[#0c2340] mb-4">🔐 Confirmación de master_admin</h3>
                <p className="text-gray-600 text-sm mb-4">{mensaje || 'Introduce la contraseña de master_admin para continuar:'}</p>
                
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded-r-lg">
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}

                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña de master_admin"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#20c997] mb-4"
                    autoFocus
                />

                <div className="flex gap-3">
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="flex-1 bg-[#20c997] hover:bg-[#1a9e7a] text-white py-2.5 rounded-xl font-semibold transition disabled:opacity-50"
                    >
                        {loading ? 'Verificando...' : '✅ Confirmar'}
                    </button>
                    <button
                        onClick={onCancel}
                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2.5 rounded-xl font-semibold transition"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmarMaster;
