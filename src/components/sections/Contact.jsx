import { useState } from 'react'
import FlashMessage from '../common/FlashMessage'

const Contact = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    asunto: '',
    mensaje: ''
  })
  const [flashMessage, setFlashMessage] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setFlashMessage({
        type: 'success',
        message: 'Mensaje enviado correctamente'
      })
      
      setFormData({
        nombre: '',
        email: '',
        telefono: '',
        asunto: '',
        mensaje: ''
      })
      
      setTimeout(() => setFlashMessage(null), 5000)
    } catch (error) {
      setFlashMessage({
        type: 'error',
        message: error.message || 'Error al enviar el mensaje'
      })
    }
  }

  return (
    <section className="contact-section" id="contacto">
      <h2>📬 Contacta con nosotros</h2>
      <p className="subtitle">
        ¿Tienes dudas sobre nuestra formación? Escríbenos y te responderemos en menos de 24 horas.
      </p>

      {flashMessage && (
        <FlashMessage type={flashMessage.type} message={flashMessage.message} />
      )}

      <form className="contact-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label><i className="fas fa-user"></i> Nombre completo</label>
          <input 
            type="text" 
            name="nombre" 
            placeholder="Ej: Juan Pérez" 
            value={formData.nombre}
            onChange={handleChange}
            required 
          />
        </div>

        <div className="form-group">
          <label><i className="fas fa-envelope"></i> Correo electrónico</label>
          <input 
            type="email" 
            name="email" 
            placeholder="tu@email.com" 
            value={formData.email}
            onChange={handleChange}
            required 
          />
        </div>

        <div className="form-group">
          <label><i className="fas fa-phone"></i> Teléfono</label>
          <input 
            type="tel" 
            name="telefono" 
            placeholder="Ej: 600 000 000" 
            value={formData.telefono}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label><i className="fas fa-tag"></i> Asunto</label>
          <select 
            name="asunto" 
            value={formData.asunto}
            onChange={handleChange}
            required
          >
            <option value="">Selecciona un asunto</option>
            <option value="Información general">📋 Información general</option>
            <option value="Matriculación">📝 Matriculación</option>
            <option value="Convocatorias">📅 Convocatorias</option>
            <option value="Clases">📺 Clases del Campus</option>
            <option value="Soporte técnico">🔧 Soporte técnico</option>
            <option value="Otro">❓ Otro</option>
          </select>
        </div>

        <div className="form-group">
          <label><i className="fas fa-comment"></i> Mensaje</label>
          <textarea 
            name="mensaje" 
            placeholder="Cuéntanos qué necesitas..." 
            value={formData.mensaje}
            onChange={handleChange}
            required
          ></textarea>
        </div>

        <button type="submit" className="btn-submit">
          <i className="fas fa-paper-plane"></i> Enviar mensaje
        </button>
      </form>
    </section>
  )
}

export default Contact