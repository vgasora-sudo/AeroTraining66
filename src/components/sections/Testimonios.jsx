// src/components/sections/Testimonios.jsx
const Testimonios = () => {
    return (
        <section id="testimonios" className="py-12 md:py-16 px-4 max-w-4xl mx-auto bg-white border-y border-gray-100">
            <h2 className="text-2xl md:text-3xl font-extrabold text-center text-[#0c2340] mb-2">
                💬 Lo que dicen nuestros alumnos
            </h2>
            <div className="grid md:grid-cols-2 gap-6 mt-8">
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <p className="italic text-gray-700">"Gracias a AeroTraining conseguí mi primer empleo en Ryanair. Los instructores son excelentes y el temario muy completo."</p>
                    <p className="font-bold text-[#0c2340] mt-3">— Ana L.</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <p className="italic text-gray-700">"El temario está muy bien estructurado y las prácticas con simuladores son clave. 100% recomendable para obtener la licencia."</p>
                    <p className="font-bold text-[#0c2340] mt-3">— David R.</p>
                </div>
            </div>
        </section>
    );
};

export default Testimonios;
