import { Link } from 'react-router-dom'

const Features = () => {
  return (
    <section className="features" id="features">
      <h2 style={{ fontSize: '28px', fontWeight: 800, textAlign: 'center', marginBottom: '8px', color: '#0c2340' }}>
        Tu experiencia de formación
      </h2>
      <p style={{ textAlign: 'center', color: '#64748b', maxWidth: '600px', margin: '0 auto 10px' }}>
        Todo lo que necesitas para obtener tu licencia EASA Part 66
      </p>

      <div className="features-grid">
        <div className="feature-card">
          <span className="icon">📊</span>
          <h3>Dashboard Personalizado</h3>
          <p>Sigue tu progreso en tiempo real. Módulos aprobados, horas de estudio y próximos exámenes.</p>
          <span className="badge-feature success">Activo</span>
        </div>

        <div className="feature-card">
          <span className="icon">📚</span>
          <h3>Catálogo de Formación</h3>
          <p>Accede a todos los manuales, temarios y materiales oficiales EASA Part 66 organizados por módulo.</p>
          <span className="badge-feature">17 Módulos</span>
        </div>

        <div className="feature-card" style={{ borderColor: 'rgba(32, 201, 151, 0.2)', background: 'linear-gradient(135deg, #fafffe, #f0fcf8)' }}>
          <span className="icon">🎯</span>
          <h3>Plaza disponible en lista de espera!</h3>
          <p>
            <strong>M7 - Prácticas de Mantenimiento</strong>
            <br />
            Confirma tu plaza antes de que se agote.
          </p>
          <span className="badge-feature warning">🔥 Últimas plazas</span>
          <div style={{ marginTop: '12px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link to="/login" style={{ background: '#28a745', color: 'white', padding: '6px 16px', borderRadius: '20px', textDecoration: 'none', fontSize: '12px', fontWeight: 600 }}>
              ✅ Confirmar Plaza
            </Link>
            <span style={{ background: '#e3f2fd', color: '#0d6efd', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
              📺 Clase online mañana: M15 Turbinas
            </span>
          </div>
          <div style={{ marginTop: '12px', fontSize: '13px', color: '#28a745' }}>
            <i className="fas fa-users"></i> 3 Alumnos aprobados hoy
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <Link to="/login" className="btn-primary" style={{ display: 'inline-flex' }}>
          <i className="fas fa-arrow-right"></i> Ver todas las convocatorias
        </Link>
      </div>
    </section>
  )
}

export default Features