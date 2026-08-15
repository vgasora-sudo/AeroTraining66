import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-brand">Aero<span>Training</span> 66</div>
      <div className="footer-links">
        <a href="#features">Inicio</a>
        <a href="#clases">Clases</a>
        <a href="#contacto">Contacto</a>
        <Link to="/login">Acceder</Link>
      </div>
      <p>© 2026 AeroTraining 66 · Centro Autorizado EASA Part 147</p>
      <p style={{ fontSize: '11px', marginTop: '8px', opacity: 0.6 }}>
        Formación oficial en mantenimiento aeronáutico
      </p>
    </footer>
  )
}

export default Footer