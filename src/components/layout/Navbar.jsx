import { Link } from 'react-router-dom'

const Navbar = () => {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="logo-icon">✈️</span>
        <div>
          <span className="brand-text">Aero<span>Training</span> 66</span>
          <span className="brand-sub">EASA Part 147 · Centro Autorizado</span>
        </div>
      </Link>
      <div className="navbar-links">
        <a href="#features">Inicio</a>
        <a href="#clases">Clases</a>
        <a href="#contacto">Contacto</a>
        <Link to="/login" className="btn-login-nav">
          <i className="fas fa-sign-in-alt"></i> Acceder
        </Link>
      </div>
    </nav>
  )
}

export default Navbar