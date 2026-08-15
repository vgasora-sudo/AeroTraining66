const FlashMessage = ({ type, message }) => {
  if (!message) return null

  return (
    <div className={`flash-message ${type}`}>
      {type === 'success' ? (
        <>
          <i className="fas fa-check-circle"></i>
          <div className="message-content">
            <div className="message-title">✅ ¡Mensaje enviado con éxito!</div>
            <div className="message-subtitle">
              Hemos recibido tu consulta. Nos pondremos en contacto contigo en menos de 24 horas.
            </div>
          </div>
          <span className="message-emoji">✈️</span>
        </>
      ) : (
        <>
          <i className="fas fa-exclamation-circle"></i>
          <div className="message-content">
            <div className="message-title">❌ Error al enviar</div>
            <div className="message-subtitle">{message}</div>
          </div>
        </>
      )}
    </div>
  )
}

export default FlashMessage