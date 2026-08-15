// src/pages/Home.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        telefono: '',
        asunto: '',
        mensaje: ''
    });
    const [loading, setLoading] = useState(false);
    const [mensajeResultado, setMensajeResultado] = useState({ texto: '', tipo: '' });
    const [showStickyCTA, setShowStickyCTA] = useState(false);
    const [faqOpen, setFaqOpen] = useState(null);

    // ===== CALCULADORA =====
    const [modulosSeleccionados, setModulosSeleccionados] = useState([]);
    const [planSeleccionado, setPlanSeleccionado] = useState('completo');
    const [precioCalculado, setPrecioCalculado] = useState(3000);

    const modulosDisponibles = [
        { id: 'M1', nombre: 'Matemáticas', precio: 250, licencias: { B1: true, B2: true } },
        { id: 'M2', nombre: 'Física', precio: 250, licencias: { B1: true, B2: true } },
        { id: 'M3', nombre: 'Electricidad', precio: 250, licencias: { B1: true, B2: true } },
        { id: 'M4', nombre: 'Electrónica', precio: 250, licencias: { B1: true, B2: true } },
        { id: 'M5', nombre: 'Técnicas digitales, instrumentos', precio: 250, licencias: { B1: true, B2: true } },
        { id: 'M6', nombre: 'Materiales, equipos y herramientas', precio: 250, licencias: { B1: true, B2: true } },
        { id: 'M7', nombre: 'Prácticas de mantenimiento', precio: 250, licencias: { B1: true, B2: true } },
        { id: 'M8', nombre: 'Aerodinámica básica', precio: 250, licencias: { B1: true, B2: true } },
        { id: 'M9', nombre: 'Factores humanos', precio: 250, licencias: { B1: true, B2: true } },
        { id: 'M10', nombre: 'Legislación aeronáutica', precio: 250, licencias: { B1: true, B2: true } },
        { id: 'M11A', nombre: 'Aerodinámica, estructuras y sistemas (Aviones de turbina)', precio: 250, licencias: { B1: true, B2: false } },
        { id: 'M13', nombre: 'Aerodinámica, estructuras y sistemas (Aeronaves)', precio: 250, licencias: { B1: false, B2: true } },
        { id: 'M14', nombre: 'Propulsión', precio: 250, licencias: { B1: false, B2: true } },
        { id: 'M15', nombre: 'Motores de turbinas de gas', precio: 250, licencias: { B1: true, B2: false } },
        { id: 'M17', nombre: 'Hélices', precio: 250, licencias: { B1: true, B2: false } }
    ];

    const toggleModulo = (moduloId) => {
        if (planSeleccionado === 'completo') setPlanSeleccionado('modular');
        setModulosSeleccionados(prev =>
            prev.includes(moduloId) ? prev.filter(id => id !== moduloId) : [...prev, moduloId]
        );
    };
    const seleccionarPlanCompleto = () => {
        setPlanSeleccionado('completo');
        setModulosSeleccionados([]);
    };
    useEffect(() => {
        setPrecioCalculado(planSeleccionado === 'completo' ? 3000 : modulosSeleccionados.length * 250);
    }, [modulosSeleccionados, planSeleccionado]);

    // ===== SLIDER =====
    const slides = [
        'https://images.unsplash.com/photo-1542296332-2e4473faf563?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
        'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
        'https://images.unsplash.com/photo-1501078547172-4116b1dd286c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
        'https://images.unsplash.com/photo-1485686531765-ba63b0780a40?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    ];
    const [currentSlide, setCurrentSlide] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setCurrentSlide(prev => (prev + 1) % slides.length), 5000);
        return () => clearInterval(interval);
    }, [slides.length]);

    // ===== STICKY CTA =====
    useEffect(() => {
        const handleScroll = () => setShowStickyCTA(window.scrollY > 500);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // ===== FORMULARIO =====
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.email && !formData.telefono) {
            setMensajeResultado({ texto: '⚠️ Debes proporcionar al menos un email o un teléfono', tipo: 'error' });
            setTimeout(() => setMensajeResultado({ texto: '', tipo: '' }), 4000);
            return;
        }
        if (!formData.nombre || !formData.asunto || !formData.mensaje) {
            setMensajeResultado({ texto: '⚠️ Completa todos los campos obligatorios', tipo: 'error' });
            setTimeout(() => setMensajeResultado({ texto: '', tipo: '' }), 4000);
            return;
        }
        setLoading(true);
        setTimeout(() => {
            setMensajeResultado({ texto: '✅ ¡Mensaje enviado! Te responderemos en menos de 24 horas. ✈️', tipo: 'success' });
            setFormData({ nombre: '', email: '', telefono: '', asunto: '', mensaje: '' });
            setLoading(false);
            setTimeout(() => setMensajeResultado({ texto: '', tipo: '' }), 5000);
        }, 1000);
    };

    // ===== FAQ =====
    const toggleFaq = (index) => setFaqOpen(faqOpen === index ? null : index);
    const faqs = [
        { pregunta: '¿Cuáles son los requisitos para acceder a la formación?', respuesta: 'Para acceder...' },
        { pregunta: '¿Qué licencia obtengo al finalizar?', respuesta: 'Al superar...' },
        { pregunta: '¿La formación es presencial u online?', respuesta: 'Por ahora...' },
        { pregunta: '¿Puedo compatibilizarla con mi trabajo actual?', respuesta: 'Sí...' },
        { pregunta: '¿Qué salidas profesionales tiene un Técnico de Mantenimiento Aeronáutico?', respuesta: 'Las salidas...' },
        { pregunta: '¿Qué opciones de pago tengo?', respuesta: 'Ofrecemos...' }
    ];

    return (
        <div className="min-h-screen bg-gray-50 overflow-x-hidden">
            {/* ============================================================ */}
            {/* NAVBAR - responsive */}
            {/* ============================================================ */}
            <nav className="bg-gradient-to-r from-[#0a1a2f] to-[#0c2340] px-4 md:px-8 py-4 flex flex-wrap justify-between items-center sticky top-0 z-50 shadow-xl">
                <Link to="/" className="flex items-center gap-3 no-underline">
                    <span className="text-3xl md:text-4xl text-[#20c997]">✈️</span>
                    <div>
                        <span className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
                            Aero<span className="text-[#20c997]">Training</span> 66
                        </span>
                        <span className="block text-[8px] md:text-xs text-[#6c8db0] font-light tracking-widest -mt-0.5">
                            EASA Part 147 · Centro Autorizado
                        </span>
                    </div>
                </Link>

                <div className="flex items-center gap-3 md:gap-6 flex-wrap mt-2 md:mt-0">
                    <a href="#inicio" className="text-[#a8c4e0] hover:text-[#20c997] transition font-medium text-xs md:text-base relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-[#20c997] after:transition-all hover:after:w-full">
                        Inicio
                    </a>
                    <a href="#cursos" className="text-[#a8c4e0] hover:text-[#20c997] transition font-medium text-xs md:text-base relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-[#20c997] after:transition-all hover:after:w-full">
                        Cursos
                    </a>
                    <a href="#instructores" className="text-[#a8c4e0] hover:text-[#20c997] transition font-medium text-xs md:text-base relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-[#20c997] after:transition-all hover:after:w-full">
                        Instructores
                    </a>
                    <a href="#precios" className="text-[#a8c4e0] hover:text-[#20c997] transition font-medium text-xs md:text-base relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-[#20c997] after:transition-all hover:after:w-full">
                        Precios
                    </a>
                    <a href="#modulos" className="text-[#a8c4e0] hover:text-[#20c997] transition font-medium text-xs md:text-base relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-[#20c997] after:transition-all hover:after:w-full">
                        Módulos
                    </a>
                    <a href="#experiencia" className="text-[#a8c4e0] hover:text-[#20c997] transition font-medium text-xs md:text-base relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-[#20c997] after:transition-all hover:after:w-full">
                        Experiencias
                    </a>
                    <a href="#faq" className="text-[#a8c4e0] hover:text-[#20c997] transition font-medium text-xs md:text-base relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-[#20c997] after:transition-all hover:after:w-full">
                        FAQ
                    </a>
                    <a href="#contacto" className="text-[#a8c4e0] hover:text-[#20c997] transition font-medium text-xs md:text-base relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-[#20c997] after:transition-all hover:after:w-full">
                        Contacto
                    </a>
                    <Link
                        to="/login"
                        className="bg-gradient-to-r from-[#20c997] to-[#0c2340] text-white px-4 md:px-6 py-1.5 md:py-2.5 rounded-full font-semibold text-xs md:text-sm border-2 border-[#20c997]/30 hover:translate-y-[-2px] hover:shadow-[0_8px_25px_rgba(32,201,151,0.3)] transition-all"
                    >
                        <i className="fas fa-sign-in-alt mr-1 md:mr-2"></i> Acceder
                    </Link>
                </div>
            </nav>

            {/* ============================================================ */}
            {/* HERO CON SLIDER */}
            {/* ============================================================ */}
            <section id="inicio" className="relative h-[70vh] md:h-[80vh] overflow-hidden">
                <div className="absolute inset-0 w-full h-full">
                    {slides.map((img, index) => (
                        <div
                            key={index}
                            className="absolute inset-0 w-full h-full transition-opacity duration-1000"
                            style={{
                                backgroundImage: `url(${img})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                opacity: currentSlide === index ? 1 : 0,
                            }}
                        />
                    ))}
                    <div className="absolute inset-0 bg-black/50"></div>
                </div>

                <div className="relative z-10 flex items-center justify-center h-full text-center px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="inline-block bg-[#20c997]/20 text-[#20c997] px-4 md:px-6 py-1.5 md:py-2 rounded-full text-[10px] md:text-sm font-semibold tracking-widest uppercase border border-[#20c997]/30 mb-4 md:mb-6 backdrop-blur-sm">
                            <i className="fas fa-award mr-1 md:mr-2"></i> Centro Autorizado EASA Nº 57
                        </div>
                        <h1 className="text-3xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-4 md:mb-6 drop-shadow-lg">
                            Tu futuro <br />
                            <span className="bg-gradient-to-r from-[#20c997] to-[#00d4ff] bg-clip-text text-transparent">
                                despega con nosotros
                            </span>
                        </h1>
                        <p className="text-sm md:text-xl text-[#e0edf9] max-w-2xl mx-auto leading-relaxed mb-6 md:mb-10 drop-shadow-md">
                            Formación oficial EASA Part 66. Conviértete en Técnico de Mantenimiento Aeronáutico 
                            con los mejores profesionales del sector.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 md:gap-5 justify-center">
                            <a
                                href="#precios"
                                className="bg-gradient-to-r from-[#20c997] to-[#0c2340] text-white px-6 md:px-10 py-3 md:py-5 rounded-full font-bold text-sm md:text-lg border-2 border-[#20c997]/30 hover:translate-y-[-3px] hover:shadow-[0_12px_35px_rgba(32,201,151,0.4)] transition-all inline-flex items-center gap-2 justify-center"
                            >
                                <i className="fas fa-graduation-cap"></i> Quiero mi Licencia
                            </a>
                            <a
                                href="#cursos"
                                className="bg-white/10 backdrop-blur-sm text-white px-6 md:px-10 py-3 md:py-5 rounded-full font-semibold text-sm md:text-lg border-2 border-white/30 hover:border-[#20c997] hover:text-[#20c997] hover:bg-white/20 transition-all inline-flex items-center gap-2 justify-center"
                            >
                                <i className="fas fa-book"></i> Ver plan de estudios
                            </a>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-4 md:bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex gap-2 md:gap-3">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all ${
                                currentSlide === index ? 'bg-[#20c997] w-6 md:w-8' : 'bg-white/50'
                            }`}
                        />
                    ))}
                </div>
            </section>

            {/* ============================================================ */}
            {/* CURSOS */}
            {/* ============================================================ */}
            <section id="cursos" className="py-12 md:py-20 px-4 max-w-6xl mx-auto">
                <h2 className="text-2xl md:text-4xl font-extrabold text-center text-[#0c2340] mb-4">
                    🛠️ Plan de Estudios
                </h2>
                <p className="text-center text-gray-500 text-sm md:text-lg max-w-xl mx-auto mb-8 md:mb-12">
                    Domina todos los módulos necesarios para obtener tu licencia TMA.
                </p>
                <div className="grid md:grid-cols-3 gap-6 md:gap-8">
                    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 hover:translate-y-[-6px] hover:shadow-lg transition-all">
                        <span className="text-4xl md:text-5xl block mb-3 md:mb-4">📘</span>
                        <h3 className="text-lg md:text-xl font-bold text-[#0c2340] mb-2 md:mb-3">Módulos Básicos (M1-M5)</h3>
                        <p className="text-gray-500 text-xs md:text-sm leading-relaxed">
                            Matemáticas, Física, Electricidad, Electrónica y Materiales. Los cimientos de tu carrera.
                        </p>
                    </div>
                    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 hover:translate-y-[-6px] hover:shadow-lg transition-all">
                        <span className="text-4xl md:text-5xl block mb-3 md:mb-4">⚙️</span>
                        <h3 className="text-lg md:text-xl font-bold text-[#0c2340] mb-2 md:mb-3">Módulos Generales (M6-M9)</h3>
                        <p className="text-gray-500 text-xs md:text-sm leading-relaxed">
                            Prácticas de mantenimiento, procedimientos, factores humanos y legislación. La base operativa.
                        </p>
                    </div>
                    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 hover:translate-y-[-6px] hover:shadow-lg transition-all">
                        <span className="text-4xl md:text-5xl block mb-3 md:mb-4">🛩️</span>
                        <h3 className="text-lg md:text-xl font-bold text-[#0c2340] mb-2 md:mb-3">Módulos Específicos (M10-M17)</h3>
                        <p className="text-gray-500 text-xs md:text-sm leading-relaxed">
                            Motores, estructuras, aviónica, sistemas hidráulicos y neumáticos. La especialización que buscan las aerolíneas.
                        </p>
                    </div>
                </div>
                <div className="text-center mt-8 md:mt-12">
                    <a
                        href="#precios"
                        className="bg-gradient-to-r from-[#20c997] to-[#0c2340] text-white px-8 md:px-10 py-3 md:py-4 rounded-full font-semibold text-sm md:text-lg hover:translate-y-[-3px] hover:shadow-[0_12px_35px_rgba(32,201,151,0.3)] transition-all inline-flex items-center gap-2"
                    >
                        <i className="fas fa-file-pdf"></i> Descarga el temario completo
                    </a>
                </div>
            </section>

            {/* ============================================================ */}
            {/* INSTRUCTORES */}
            {/* ============================================================ */}
            <section id="instructores" className="py-12 md:py-20 px-4 max-w-6xl mx-auto bg-white border-y border-gray-100">
                <h2 className="text-2xl md:text-4xl font-extrabold text-center text-[#0c2340] mb-4">
                    👨‍🏫 Nuestro Equipo
                </h2>
                <p className="text-center text-gray-500 text-sm md:text-lg max-w-2xl mx-auto mb-8 md:mb-12">
                    Acompañados por los mejores técnicos e instructores del sector, con amplia experiencia en mantenimiento aeronáutico y formación EASA.
                </p>
                <div className="grid md:grid-cols-3 gap-6 md:gap-8">
                    <div className="text-center bg-gray-50 rounded-2xl p-6 md:p-8 border border-gray-100 hover:shadow-lg transition">
                        <span className="text-5xl md:text-6xl block mb-3 md:mb-4">👨‍✈️</span>
                        <h3 className="text-lg md:text-xl font-bold text-[#0c2340]">Ingenieros en activo</h3>
                        <p className="text-gray-500 text-xs md:text-sm mt-2">Profesionales con décadas de experiencia en aerolíneas como Iberia, Airbus y Ryanair.</p>
                    </div>
                    <div className="text-center bg-gray-50 rounded-2xl p-6 md:p-8 border border-gray-100 hover:shadow-lg transition">
                        <span className="text-5xl md:text-6xl block mb-3 md:mb-4">👩‍🔧</span>
                        <h3 className="text-lg md:text-xl font-bold text-[#0c2340]">Especialistas en aviónica</h3>
                        <p className="text-gray-500 text-xs md:text-sm mt-2">Expertos en sistemas eléctricos, electrónicos y de instrumentación, con formación militar y civil.</p>
                    </div>
                    <div className="text-center bg-gray-50 rounded-2xl p-6 md:p-8 border border-gray-100 hover:shadow-lg transition">
                        <span className="text-5xl md:text-6xl block mb-3 md:mb-4">🧑‍🏫</span>
                        <h3 className="text-lg md:text-xl font-bold text-[#0c2340]">Instructores EASA</h3>
                        <p className="text-gray-500 text-xs md:text-sm mt-2">Formadores oficiales con alta tasa de aprobados, dedicados a preparar a la próxima generación de técnicos.</p>
                    </div>
                </div>
            </section>

            {/* ============================================================ */}
            {/* PRECIOS */}
            {/* ============================================================ */}
            <section id="precios" className="py-12 md:py-20 px-4 max-w-5xl mx-auto">
                <h2 className="text-2xl md:text-4xl font-extrabold text-center text-[#0c2340] mb-4">
                    💰 Inversión y Plazas
                </h2>
                <p className="text-center text-gray-500 text-sm md:text-lg mb-8 md:mb-10">
                    Elige la opción que mejor se adapte a ti. <strong>¡Plazas limitadas!</strong>
                </p>

                <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                    <div className="bg-white rounded-3xl p-6 md:p-10 shadow-xl border-2 border-[#20c997]/20 text-center hover:shadow-2xl transition-all">
                        <div className="text-4xl md:text-6xl font-extrabold text-[#0c2340]">3.000 €</div>
                        <p className="text-gray-500 mt-2 mb-4 text-xs md:text-sm uppercase tracking-wide font-semibold">
                            Plan completo · B1.1 o B2
                        </p>
                        <ul className="text-left text-gray-600 text-xs md:text-sm space-y-2 mb-6 max-w-xs mx-auto">
                            <li>✅ Acceso a todos los módulos (M1-M17)</li>
                            <li>✅ Material didáctico incluido</li>
                            <li>✅ Campus virtual 24/7</li>
                            <li>✅ Tutorías personalizadas</li>
                            <li>✅ Simuladores de examen</li>
                        </ul>
                        <p className="text-gray-500 text-xs md:text-sm mb-6">Pago flexible · Sin intereses</p>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl py-2 md:py-3 px-3 md:px-4 mb-6 text-yellow-800 font-semibold text-xs md:text-sm">
                            ⏳ <strong>Últimas 8 plazas</strong> para septiembre
                        </div>
                        <a href="#contacto" className="block w-full bg-gradient-to-r from-[#20c997] to-[#0c2340] text-white py-3 md:py-4 rounded-full font-bold text-sm md:text-lg hover:translate-y-[-2px] hover:shadow-[0_8px_25px_rgba(32,201,151,0.3)] transition-all">
                            Reservar plaza completa
                        </a>
                    </div>

                    <div className="bg-white rounded-3xl p-6 md:p-10 shadow-xl border border-gray-200 text-center hover:shadow-2xl transition-all">
                        <div className="text-4xl md:text-6xl font-extrabold text-[#0c2340]">250 €</div>
                        <p className="text-gray-500 mt-2 mb-4 text-xs md:text-sm uppercase tracking-wide font-semibold">
                            Por módulo · a la carta
                        </p>
                        <ul className="text-left text-gray-600 text-xs md:text-sm space-y-2 mb-6 max-w-xs mx-auto">
                            <li>✅ Elige los módulos que necesites</li>
                            <li>✅ Material didáctico incluido</li>
                            <li>✅ Campus virtual 24/7</li>
                            <li>✅ Tutorías específicas</li>
                            <li>✅ Sin matrícula ni permanencia</li>
                        </ul>
                        <p className="text-gray-500 text-xs md:text-sm mb-6">Pago único por módulo · Sin compromiso</p>
                        <div className="bg-blue-50 border border-blue-200 rounded-xl py-2 md:py-3 px-3 md:px-4 mb-6 text-blue-800 font-semibold text-xs md:text-sm">
                            🎯 <strong>Flexibilidad total</strong> · Aprueba a tu ritmo
                        </div>
                        <a href="#contacto" className="block w-full bg-gradient-to-r from-[#0c2340] to-[#20c997] text-white py-3 md:py-4 rounded-full font-bold text-sm md:text-lg hover:translate-y-[-2px] hover:shadow-[0_8px_25px_rgba(32,201,151,0.3)] transition-all">
                            Consultar módulos
                        </a>
                    </div>
                </div>

                <div className="mt-8 md:mt-12 bg-gradient-to-r from-[#f0fcf8] to-[#e8f5e9] rounded-3xl p-6 md:p-8 border border-[#20c997]/30 text-center max-w-3xl mx-auto">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <span className="text-2xl md:text-3xl">🎁</span>
                        <h3 className="text-xl md:text-2xl font-bold text-[#0c2340]">Ofertas especiales</h3>
                    </div>
                    <p className="text-gray-700 text-sm md:text-base">
                        ¿Buscas un descuento por grupo, pago anticipado o promoción de lanzamiento? 
                        <strong> Pregunta por nuestras ofertas activas</strong> y consigue un precio aún mejor.
                    </p>
                    <a href="#contacto" className="inline-block mt-4 bg-[#20c997] text-white px-6 md:px-8 py-2 md:py-3 rounded-full font-semibold hover:bg-[#0c2340] transition-all">
                        <i className="fas fa-gift mr-2"></i> Solicitar oferta
                    </a>
                </div>
            </section>

            {/* ============================================================ */}
            {/* MÓDULOS Y LICENCIAS + CALCULADORA */}
            {/* ============================================================ */}
            <section id="modulos" className="py-12 md:py-20 px-4 max-w-6xl mx-auto">
                <h2 className="text-2xl md:text-4xl font-extrabold text-center text-[#0c2340] mb-4">
                    📋 Módulos y Licencias
                </h2>
                <p className="text-center text-gray-500 text-sm md:text-lg max-w-2xl mx-auto mb-8 md:mb-12">
                    Conoce qué módulos debes cursar según la licencia que elijas (B1 o B2).
                </p>

                <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-[#0c2340] to-[#0a1a2f] text-white p-3 md:p-4 text-center">
                            <h3 className="text-base md:text-xl font-bold">Estructura de la Formación</h3>
                        </div>
                        <div className="overflow-x-auto p-3 md:p-4">
                            <table className="w-full min-w-[500px] text-xs md:text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-2 px-1 font-bold text-[#0c2340]">Mód.</th>
                                        <th className="text-left py-2 px-1 font-bold text-[#0c2340]">Título</th>
                                        <th className="text-center py-2 px-1 font-bold text-[#0c2340]">B1</th>
                                        <th className="text-center py-2 px-1 font-bold text-[#0c2340]">B2</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {modulosDisponibles.map(mod => (
                                        <tr key={mod.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                            <td className="py-1.5 md:py-2 px-1 font-semibold text-[#0c2340]">{mod.id}</td>
                                            <td className="py-1.5 md:py-2 px-1 text-gray-700">{mod.nombre}</td>
                                            <td className="text-center py-1.5 md:py-2 px-1 font-bold text-gray-800">
                                                {mod.licencias.B1 ? 'X' : ''}
                                            </td>
                                            <td className="text-center py-1.5 md:py-2 px-1 font-bold text-gray-800">
                                                {mod.licencias.B2 ? 'X' : ''}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="bg-gray-50 p-2 md:p-3 text-center border-t border-gray-200">
                            <p className="text-[10px] md:text-xs text-gray-500">
                                <i className="fas fa-check-circle text-[#20c997] mr-1"></i> 
                                Las licencias B1 (Mecánico) y B2 (Aviónica) cubren diferentes especialidades.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-[#20c997] to-[#0c2340] text-white p-3 md:p-4 text-center">
                            <h3 className="text-base md:text-xl font-bold">📊 Calcula tu inversión</h3>
                        </div>
                        <div className="p-4 md:p-6">
                            <div className="flex gap-2 mb-4 bg-gray-100 rounded-xl p-1">
                                <button
                                    onClick={seleccionarPlanCompleto}
                                    className={`flex-1 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-semibold transition ${
                                        planSeleccionado === 'completo'
                                            ? 'bg-[#20c997] text-white shadow-md'
                                            : 'text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    Plan Completo
                                </button>
                                <button
                                    onClick={() => setPlanSeleccionado('modular')}
                                    className={`flex-1 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-semibold transition ${
                                        planSeleccionado === 'modular'
                                            ? 'bg-[#20c997] text-white shadow-md'
                                            : 'text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    Por Módulos
                                </button>
                            </div>

                            {planSeleccionado === 'modular' && (
                                <div className="max-h-36 md:max-h-48 overflow-y-auto mb-4 space-y-1 pr-1 md:pr-2">
                                    {modulosDisponibles.map(mod => (
                                        <label key={mod.id} className="flex items-center gap-2 p-1.5 md:p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition">
                                            <input
                                                type="checkbox"
                                                checked={modulosSeleccionados.includes(mod.id)}
                                                onChange={() => toggleModulo(mod.id)}
                                                className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#20c997] rounded focus:ring-[#20c997]"
                                            />
                                            <span className="text-[10px] md:text-sm text-gray-700 flex-1">{mod.id} - {mod.nombre}</span>
                                            <span className="text-[10px] md:text-sm font-semibold text-[#0c2340]">{mod.precio} €</span>
                                        </label>
                                    ))}
                                </div>
                            )}

                            <div className="bg-gray-50 rounded-xl p-3 md:p-4 mb-4 border border-gray-200">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs md:text-sm font-semibold text-[#0c2340]">
                                        {planSeleccionado === 'completo' 
                                            ? 'Plan completo (todos los módulos)' 
                                            : `${modulosSeleccionados.length} módulos seleccionados`}
                                    </span>
                                    <span className="text-xl md:text-2xl font-extrabold text-[#20c997]">{precioCalculado} €</span>
                                </div>
                                {planSeleccionado === 'modular' && modulosSeleccionados.length === 0 && (
                                    <p className="text-[10px] md:text-xs text-gray-400 mt-1">Selecciona al menos un módulo</p>
                                )}
                            </div>

                            <a
                                href="#contacto"
                                className="block w-full bg-gradient-to-r from-[#20c997] to-[#0c2340] text-white py-2.5 md:py-3 rounded-xl font-bold text-sm md:text-base text-center hover:translate-y-[-2px] hover:shadow-lg transition-all"
                            >
                                Solicitar información
                            </a>
                            <p className="text-[10px] md:text-xs text-gray-400 text-center mt-2">
                                * Precios orientativos. Consulta condiciones y ofertas especiales.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================================================ */}
            {/* COMPARTE TU EXPERIENCIA */}
            {/* ============================================================ */}
            <section id="experiencia" className="py-12 md:py-20 px-4 max-w-4xl mx-auto bg-white border-y border-gray-100">
                <h2 className="text-2xl md:text-4xl font-extrabold text-center text-[#0c2340] mb-4">
                    📝 Comparte tu experiencia
                </h2>
                <p className="text-center text-gray-500 text-sm md:text-lg max-w-2xl mx-auto">
                    Si ya eres alumno o has finalizado tu formación, nos encantaría conocer tu historia. 
                    Tu opinión ayuda a futuros técnicos a dar el paso.
                </p>
                <div className="text-center mt-6 md:mt-10">
                    <a
                        href="#contacto"
                        className="bg-gradient-to-r from-[#20c997] to-[#0c2340] text-white px-8 md:px-10 py-3 md:py-4 rounded-full font-semibold text-sm md:text-lg hover:translate-y-[-3px] hover:shadow-[0_12px_35px_rgba(32,201,151,0.3)] transition-all inline-flex items-center gap-2"
                    >
                        <i className="fas fa-pen"></i> Cuéntanos tu experiencia
                    </a>
                </div>
            </section>

            {/* ============================================================ */}
            {/* FAQ */}
            {/* ============================================================ */}
            <section id="faq" className="py-12 md:py-20 px-4 max-w-4xl mx-auto">
                <h2 className="text-2xl md:text-4xl font-extrabold text-center text-[#0c2340] mb-4">
                    ❓ Preguntas Frecuentes
                </h2>
                <p className="text-center text-gray-500 text-sm md:text-lg mb-8 md:mb-10">
                    Resolvemos las dudas más comunes sobre nuestra formación.
                </p>

                <div className="space-y-3 md:space-y-4">
                    {faqs.map((faq, index) => (
                        <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <button
                                onClick={() => toggleFaq(index)}
                                className="w-full text-left px-4 md:px-6 py-3 md:py-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
                            >
                                <span className="font-semibold text-sm md:text-lg text-[#0c2340]">{faq.pregunta}</span>
                                <span className="text-xl md:text-2xl text-[#20c997] ml-4 flex-shrink-0">
                                    {faqOpen === index ? '−' : '+'}
                                </span>
                            </button>
                            <div className={`px-4 md:px-6 overflow-hidden transition-all duration-300 ${
                                faqOpen === index ? 'max-h-96 pb-4 md:pb-6' : 'max-h-0'
                            }`}>
                                <p className="text-gray-600 text-xs md:text-base leading-relaxed border-t border-gray-100 pt-3 md:pt-4">
                                    {faq.respuesta}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-8 md:mt-10">
                    <p className="text-gray-500 text-sm md:text-base">
                        ¿Tienes otra pregunta? <a href="#contacto" className="text-[#20c997] font-semibold hover:underline">Contáctanos</a>
                    </p>
                </div>
            </section>

            {/* ============================================================ */}
            {/* CONTACTO */}
            {/* ============================================================ */}
            <section id="contacto" className="py-12 md:py-20 px-4 max-w-2xl mx-auto">
                <h2 className="text-2xl md:text-4xl font-extrabold text-center text-[#0c2340] mb-4">
                    📬 Contacta con nosotros
                </h2>
                <p className="text-center text-gray-500 text-sm md:text-lg mb-8 md:mb-10">
                    ¿Tienes dudas? Escríbenos y te responderemos en menos de 24 horas.
                </p>

                {mensajeResultado.texto && (
                    <div className={`p-4 rounded-xl border-l-4 mb-6 ${
                        mensajeResultado.tipo === 'success' 
                            ? 'bg-green-50 border-green-500 text-green-700' 
                            : 'bg-red-50 border-red-500 text-red-700'
                    }`}>
                        {mensajeResultado.texto}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white p-6 md:p-12 rounded-2xl shadow-sm border border-gray-100">
                    <div className="mb-4">
                        <label className="block font-semibold text-sm text-[#0c2340] mb-2">
                            <i className="fas fa-user mr-2"></i> Nombre completo *
                        </label>
                        <input
                            type="text"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            placeholder="Ej: Juan Pérez"
                            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] focus:shadow-[0_0_0_4px_rgba(32,201,151,0.08)] transition"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="mb-4">
                            <label className="block font-semibold text-sm text-[#0c2340] mb-2">
                                <i className="fas fa-envelope mr-2"></i> Correo electrónico
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="tu@email.com"
                                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] focus:shadow-[0_0_0_4px_rgba(32,201,151,0.08)] transition"
                                disabled={loading}
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block font-semibold text-sm text-[#0c2340] mb-2">
                                <i className="fas fa-phone mr-2"></i> Teléfono
                            </label>
                            <input
                                type="tel"
                                name="telefono"
                                value={formData.telefono}
                                onChange={handleChange}
                                placeholder="Ej: 600 000 000"
                                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] focus:shadow-[0_0_0_4px_rgba(32,201,151,0.08)] transition"
                                disabled={loading}
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                * Email o teléfono son obligatorios
                            </p>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block font-semibold text-sm text-[#0c2340] mb-2">
                            <i className="fas fa-tag mr-2"></i> Asunto *
                        </label>
                        <select
                            name="asunto"
                            value={formData.asunto}
                            onChange={handleChange}
                            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] focus:shadow-[0_0_0_4px_rgba(32,201,151,0.08)] transition"
                            required
                            disabled={loading}
                        >
                            <option value="">Selecciona un asunto</option>
                            <option value="Información general">📋 Información general</option>
                            <option value="Matriculación">📝 Matriculación</option>
                            <option value="Convocatorias">📅 Convocatorias</option>
                            <option value="Clases">📺 Clases del Campus</option>
                            <option value="Soporte técnico">🔧 Soporte técnico</option>
                            <option value="Compartir experiencia">📝 Compartir experiencia</option>
                            <option value="Oferta especial">🎁 Oferta especial</option>
                            <option value="Otro">❓ Otro</option>
                        </select>
                    </div>

                    <div className="mb-6">
                        <label className="block font-semibold text-sm text-[#0c2340] mb-2">
                            <i className="fas fa-comment mr-2"></i> Mensaje *
                        </label>
                        <textarea
                            name="mensaje"
                            value={formData.mensaje}
                            onChange={handleChange}
                            rows="5"
                            placeholder="Cuéntanos qué necesitas..."
                            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] focus:shadow-[0_0_0_4px_rgba(32,201,151,0.08)] transition resize-y min-h-[120px]"
                            required
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-[#20c997] to-[#0c2340] text-white py-4 rounded-xl font-bold text-base hover:translate-y-[-2px] hover:shadow-[0_8px_25px_rgba(32,201,151,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin">⏳</span>
                                Enviando...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-paper-plane"></i>
                                Enviar mensaje
                            </>
                        )}
                    </button>
                </form>
            </section>

            {/* ============================================================ */}
            {/* FOOTER */}
            {/* ============================================================ */}
            <footer className="bg-[#0a1a2f] text-[#a8c4e0] py-8 md:py-10 px-4 text-center border-t border-[#20c997]/10">
                <div className="text-lg font-bold text-white mb-2">
                    Aero<span className="text-[#20c997]">Training</span> 66
                </div>
                <div className="flex flex-wrap justify-center gap-4 md:gap-6 my-4">
                    <a href="#inicio" className="text-[#a8c4e0] hover:text-[#20c997] transition text-xs md:text-sm">Inicio</a>
                    <a href="#cursos" className="text-[#a8c4e0] hover:text-[#20c997] transition text-xs md:text-sm">Cursos</a>
                    <a href="#instructores" className="text-[#a8c4e0] hover:text-[#20c997] transition text-xs md:text-sm">Instructores</a>
                    <a href="#precios" className="text-[#a8c4e0] hover:text-[#20c997] transition text-xs md:text-sm">Precios</a>
                    <a href="#modulos" className="text-[#a8c4e0] hover:text-[#20c997] transition text-xs md:text-sm">Módulos</a>
                    <a href="#experiencia" className="text-[#a8c4e0] hover:text-[#20c997] transition text-xs md:text-sm">Experiencias</a>
                    <a href="#faq" className="text-[#a8c4e0] hover:text-[#20c997] transition text-xs md:text-sm">FAQ</a>
                    <a href="#contacto" className="text-[#a8c4e0] hover:text-[#20c997] transition text-xs md:text-sm">Contacto</a>
                    <Link to="/login" className="text-[#a8c4e0] hover:text-[#20c997] transition text-xs md:text-sm">Acceder</Link>
                </div>
                <p className="text-xs md:text-sm text-[#6c8db0]">© 2026 AeroTraining 66 · Centro Autorizado EASA Part 147</p>
                <p className="text-[10px] md:text-xs text-[#6c8db0]/60 mt-2">Formación oficial en mantenimiento aeronáutico</p>
            </footer>

            {/* ============================================================ */}
            {/* STICKY CTA */}
            {/* ============================================================ */}
            <div className={`fixed bottom-0 left-0 w-full bg-gradient-to-r from-[#0c2340] to-[#0a1a2f] py-2 md:py-4 px-3 md:px-4 shadow-lg z-50 transition-transform duration-500 ${
                showStickyCTA ? 'translate-y-0' : 'translate-y-full'
            }`}>
                <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 md:gap-4">
                    <div className="flex items-center gap-2 md:gap-3 text-white">
                        <span className="text-xl md:text-2xl">✈️</span>
                        <div>
                            <p className="font-bold text-xs md:text-sm">¿Listo para tu licencia TMA?</p>
                            <p className="text-[8px] md:text-xs text-[#a8c4e0]">Plazas limitadas · Reserva ya</p>
                        </div>
                    </div>
                    <a
                        href="#contacto"
                        className="bg-[#20c997] hover:bg-[#0c2340] text-white font-bold py-1.5 md:py-3 px-4 md:px-8 rounded-full transition-all shadow-lg hover:shadow-xl flex items-center gap-1 md:gap-2 text-xs md:text-base"
                    >
                        <i className="fas fa-phone-alt"></i> Reserva tu plaza
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Home;
