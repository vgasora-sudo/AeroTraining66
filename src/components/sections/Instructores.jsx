// src/components/sections/Instructores.jsx
const Instructores = () => {
    return (
        <section id="instructores" className="py-12 md:py-16 px-4 max-w-6xl mx-auto bg-white border-y border-gray-100">
            <h2 className="text-2xl md:text-3xl font-extrabold text-center text-[#0c2340] mb-2">
                👨‍🏫 Nuestros Instructores
            </h2>
            <p className="text-center text-gray-500 max-w-xl mx-auto mb-8">
                Aprende de los mejores profesionales en activo.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition">
                    <span className="text-5xl block mb-3">👨‍✈️</span>
                    <h3 className="text-lg font-bold text-[#0c2340]">Javier Martínez</h3>
                    <p className="text-gray-500 text-sm">Ingeniero de Mantenimiento con 18 años en Iberia. Experto en motores CFM56.</p>
                </div>
                <div className="text-center bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition">
                    <span className="text-5xl block mb-3">👩‍🔧</span>
                    <h3 className="text-lg font-bold text-[#0c2340]">Laura Gómez</h3>
                    <p className="text-gray-500 text-sm">Especialista en Aviónica. 12 años en el Ejército del Aire y Airbus.</p>
                </div>
                <div className="text-center bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition">
                    <span className="text-5xl block mb-3">🧑‍🏫</span>
                    <h3 className="text-lg font-bold text-[#0c2340]">Carlos Ruiz</h3>
                    <p className="text-gray-500 text-sm">Inspector EASA y formador oficial. Más de 500 alumnos preparados para el examen.</p>
                </div>
            </div>
        </section>
    );
};

export default Instructores;
