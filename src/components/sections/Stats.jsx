const Stats = () => {
  return (
    <div className="stats-bar">
      <div className="stat-item">
        <span className="number" style={{ fontSize: '44px' }}>📚 17</span>
        <span className="label" style={{ fontSize: '16px' }}>Módulos EASA Part 66</span>
      </div>
      <div className="stat-item">
        <span className="number" style={{ fontSize: '44px' }}>👨‍🏫 5</span>
        <span className="label" style={{ fontSize: '16px' }}>Instructores Cualificados</span>
      </div>
      <div className="stat-item">
        <span className="number" style={{ fontSize: '44px' }}>📅 4</span>
        <span className="label" style={{ fontSize: '16px' }}>Convocatorias Anuales</span>
      </div>
      <div className="stat-item">
        <span className="number" style={{ fontSize: '40px' }}>💻</span>
        <span className="label" style={{ fontSize: '16px' }}>Aulas Virtuales con Clases</span>
      </div>
    </div>
  )
}

export default Stats