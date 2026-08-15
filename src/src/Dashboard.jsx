import { useEffect, useState } from 'react'
import { supabase } from './supabase'

function Dashboard({ user }) {
  const [loading, setLoading] = useState(true)
  const [perfil, setPerfil] = useState(null)
  const [avances, setAvances] = useState([])
  const [fichas, setFichas] = useState([])

  useEffect(() => {
    if (user) {
      cargarDatos()
    }
  }, [user])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      // 1. Cargar el perfil del alumno
      const { data: perfilData, error: perfilError } = await supabase
        .from('alumnos')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (perfilError) throw perfilError
      setPerfil(perfilData)

      // 2. Cargar los avances del alumno
      const { data: avancesData, error: avancesError } = await supabase
        .from('avances')
        .select('*')
        .eq('alumno_id', perfilData.id)
        .order('fecha', { ascending: false })

      if (avancesError) throw avancesError
      setAvances(avancesData || [])

      // 3. Cargar las fichas del alumno
      const { data: fichasData, error: fichasError } = await supabase
        .from('fichas')
        .select('*')
        .eq('alumno_id', perfilData.id)
        .order('fecha_creacion', { ascending: false })

      if (fichasError) throw fichasError
      setFichas(fichasData || [])

    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload() // Recarga para mostrar el login de nuevo
  }

  if (loading) {
    return <div style={styles.container}>Cargando tus datos...</div>
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Bienvenido, {perfil?.nombre || 'Alumno'} 👋</h1>
        <button onClick={handleLogout} style={styles.logoutButton}>
          Cerrar Sesión
        </button>
      </div>

      <div style={styles.section}>
        <h2>📋 Tu perfil</h2>
        <p><strong>Nombre:</strong> {perfil?.nombre} {perfil?.apellido}</p>
        <p><strong>Email:</strong> {perfil?.email}</p>
        <p><strong>Curso:</strong> {perfil?.curso || 'No asignado'}</p>
      </div>

      <div style={styles.section}>
        <h2>📈 Tus avances</h2>
        {avances.length === 0 ? (
          <p>No tienes avances registrados aún.</p>
        ) : (
          <ul style={styles.list}>
            {avances.map((avance) => (
              <li key={avance.id} style={styles.listItem}>
                <strong>{avance.tema}</strong> - 
                Puntuación: {avance.puntuacion || 'N/A'}%
                {avance.completado && ' ✅'}
                <br />
                <small>{new Date(avance.fecha).toLocaleDateString()}</small>
                {avance.observaciones && <p>{avance.observaciones}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={styles.section}>
        <h2>📄 Tus fichas</h2>
        {fichas.length === 0 ? (
          <p>No tienes fichas personalizadas aún.</p>
        ) : (
          <ul style={styles.list}>
            {fichas.map((ficha) => (
              <li key={ficha.id} style={styles.listItem}>
                <strong>{ficha.titulo}</strong>
                <br />
                {ficha.contenido}
                <br />
                <small>Última actualización: {new Date(ficha.ultima_actualizacion).toLocaleDateString()}</small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    borderBottom: '1px solid #eee',
    paddingBottom: '15px'
  },
  logoutButton: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    background: '#f44336',
    color: 'white',
    cursor: 'pointer'
  },
  section: {
    marginBottom: '30px',
    padding: '20px',
    border: '1px solid #eee',
    borderRadius: '8px',
    background: '#f9f9f9'
  },
  list: {
    listStyle: 'none',
    padding: 0
  },
  listItem: {
    padding: '12px',
    marginBottom: '8px',
    background: 'white',
    borderRadius: '6px',
    border: '1px solid #e0e0e0'
  }
}

export default Dashboard