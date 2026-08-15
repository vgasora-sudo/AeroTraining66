import { Link } from 'react-router-dom'

const Classes = () => {
  const classData = [
    { id: 1, icon: '✈️', title: 'M15 - Turbinas', schedule: 'Mañana 10:00 - 12:00' },
    { id: 2, icon: '⚡', title: 'M3 - Electricidad', schedule: 'Miércoles 16:00 - 18:00' },
    { id: 3, icon: '📡', title: 'M13 - Aviónica', schedule: 'Viernes 09:00 - 11:00' },
  ]

  return (
    <section id="clases" style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '28px', fontWeight: 800, textAlign: 'center', color: '#0c2340', marginBottom: '8px' }}>
        📺 Clases del Campus
      </h2>
      <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '30px' }}>
        Accede a las clases programadas y materiales de tus módulos
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {classData.map((cls) => (
          <div key={cls.id} style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #eef2f6' }}>
            <span style={{ fontSize: '32px' }}>{cls.icon}</span>
            <h4 style={{ margin: '12px 0 6px', color: '#0c2340' }}>{cls.title}</h4>
            <p style={{ color: '#64748b', fontSize: '14px' }}>{cls.schedule}</p>
            <Link to="/login" style={{ color: '#20c997', fontWeight: 600, textDecoration: 'none' }}>
              Acceder →
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Classes