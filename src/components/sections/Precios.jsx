// src/components/sections/Precios.jsx
const Precios = () => {
    return (
        <section id="precios" className="py-12 md:py-16 px-4 max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-extrabold text-center text-[#0c2340] mb-2">
                💰 Inversión y Plazas
            </h2>
            <p className="text-center text-gray-500 mb-8">
                Formación de calidad al alcance de tu bolsillo. <strong>¡Plazas limitadas!</strong>
            </p>
            <div className="bg-white rounded-2xl p-6 md:p-10 shadow-lg border border-gray-100 text-center max-w-lg mx-auto">
                <div className="text-4xl md:text-5xl font-extrabold text-[#0c2340]">
                    2.800 € <span className="text-xl font-normal text-gray-500">+ IVA</span>
                </div>
                <p className="text-gray-500 mt-2 mb-4">
                    Pago fraccionado en 6 cuotas sin intereses. Incluye material didáctico y acceso al campus virtual.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl py-3 px-4 mb-6 text-yellow-800 font-semibold">
                    ⏳ <strong>Últimas 8 plazas</strong> para la convocatoria de septiembre
                </div>
                <a
                    href="#contacto"
                    className="bg-gradient-to-r from-[#20c997] to-[#0c2340] text-white px-8 py-4 rounded-full font-bold hover:translate-y-[-3px] hover:shadow-[0_12px_35px_rgba(32,201,151,0.3)] transition-all inline-flex items-center gap-2"
                >
                    <i className="fas fa-fire"></i> Reserva tu plaza ahora
                </a>
            </div>
        </section>
    );
};

export default Precios;
