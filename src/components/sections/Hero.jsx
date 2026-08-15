import { Link } from 'react-router-dom'

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-content">
        <div className="hero-badge">
          <i className="fas fa-award"></i> Centro Autorizado EASA Part 147
        </div>
        <h1>Prepara tu <span>Licencia TMA</span><br />con los mejores</h1>
        <p>Formación oficial en mantenimiento aeronáutico. Simuladores, material didáctico y tutorías personalizadas.</p>
        <div className="hero-buttons">
          <Link to="/login" className="btn-primary">
            <i className="fas fa-graduation-cap"></i> Acceder al Campus
          </Link>
          <a href="#contacto" className="btn-secondary">
            <i className="fas fa-comment"></i> Contactar
          </a>
        </div>
      </div>
    </section>
  )
}

export default Hero