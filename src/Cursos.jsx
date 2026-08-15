// src/components/sections/Cursos.jsx
const Cursos = () => {
    return (
        <section id="cursos" className="py-12 md:py-16 px-4 max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-extrabold text-center text-[#0c2340] mb-2">
                🛠️ Plan de Estudios
            </h2>
            <p className="text-center text-gray-500 max-w-xl mx-auto mb-8">
                Domina todos los módulos necesarios para obtener tu licencia TMA.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:translate-y-[-6px] hover:shadow-lg transition-all">
                    <span className="text-4xl block mb-4">📘</span>
                    <h3 className="text-lg font-bold text-[#0c2340] mb-2">Módulos Básicos (M1-M5)</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        Matemáticas, Física, Electricidad, Electrónica y Materiales. Los cimientos de tu carrera.
                    </p>
                    <span className="inline-block mt-3 bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
                        Duración: 300h
                    </span>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:translate-y-[-6px] hover:shadow-lg transition-all">
                    <span className="text-4xl block mb-4">⚙️</span>
                    <h3 className="text-lg font-bold text-[#0c2340] mb-2">Módulos Generales (M6-M9)</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        Prácticas de mantenimiento, procedimientos, factores humanos y legislación. La base operativa.
                    </p>
                    <span className="inline-block mt-3 bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
                        Duración: 250h
                    </span>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:translate-y-[-6px] hover:shadow-lg transition-all">
                    <span className="text-4xl block mb-4">🛩️</span>
                    <h3 className="text-lg font-bold text-[#0c2340] mb-2">Módulos Específicos (M10-M17)</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        Motores, estructuras, aviónica, sistemas hidráulicos y neumáticos. La especialización que buscan las aerolíneas.
                    </p>
                    <span className="inline-block mt-3 bg-yellow-100 text-yellow-700 text-xs font-semibold px-3 py-1 rounded-full">
                        Duración: 400h
                    </span>
                </div>
            </div>
            <div className="text-center mt-8">
                <a
                    href="#precios"
                    className="bg-gradient-to-r from-[#20c997] to-[#0c2340] text-white px-8 py-3 rounded-full font-semibold hover:translate-y-[-3px] hover:shadow-[0_12px_35px_rgba(32,201,151,0.3)] transition-all inline-flex items-center gap-2"
                >
                    <i className="fas fa-file-pdf"></i> Descarga el temario completo
                </a>
            </div>
        </section>
    );
};

export default Cursos;
