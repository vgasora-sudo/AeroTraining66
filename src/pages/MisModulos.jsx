import { useState, useEffect } from 'react';

const MisModulos = () => {
  const [manuales, setManuales] = useState([]);
  const [filtroModulo, setFiltroModulo] = useState('Todos');

  useEffect(() => {
    // LEEMOS LA MISMA CAJA DONDE EL ADMIN GUARDA LOS PDFS
    const data = localStorage.getItem('aerotraining_manuales');
    if (data) {
      setManuales(JSON.parse(data));
    }
  }, []);

  // Filtrar por módulo si el alumno quiere buscar uno específico
  const modulosUnicos = ['Todos', ...new Set(manuales.map(m => m.modulo))];
  const manualesFiltrados = filtroModulo === 'Todos' 
    ? manuales 
    : manuales.filter(m => m.modulo === filtroModulo);

  const descargarPDF = (manual) => {
    if (manual && manual.archivoBase64) {
      const link = document.createElement('a');
      link.href = manual.archivoBase64;
      link.download = manual.archivo; // Usa el nombre original del archivo
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('⚠️ Este manual es de ejemplo y el archivo PDF físico no está disponible todavía.');
    }
  };

    const verPDF = (manual) => {
    if (manual && manual.archivoBase64) {
      // En lugar de usar un iframe (que falla), convertimos el Base64 en un Blob (archivo real temporal)
      // y se lo pasamos al navegador para que lo abra con su propio lector de PDFs.
      
      // 1. Separamos el texto puro del Base64 (quitándole el prefijo "data:application/pdf;base64,")
      const base64Data = manual.archivoBase64.split(',')[1];
      
      // 2. Convertimos el texto a bytes binarios
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      
      // 3. Creamos un "Archivo" virtual en la memoria del navegador
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      // 4. Creamos una URL temporal para ese archivo
      const urlBlob = URL.createObjectURL(blob);
      
      // 5. Lo abrimos en una pestaña nueva. El navegador usará su visor nativo (mucho más rápido y fiable)
      window.open(urlBlob, '_blank');
      
    } else {
      alert('⚠️ Este manual es de ejemplo y el archivo PDF no está disponible.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#0c2340] flex items-center gap-2">
              <span className="text-2xl">📚</span> Mis Módulos y Manuales
            </h2>
            <p className="text-sm text-gray-500 mt-1">Accede a los materiales técnicos de tus módulos EASA</p>
          </div>
          
          {/* Filtro por Módulo */}
          <select 
            value={filtroModulo} 
            onChange={(e) => setFiltroModulo(e.target.value)}
            className="px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#20c997] bg-white text-sm font-medium"
          >
            {modulosUnicos.map(mod => (
              <option key={mod} value={mod}>{mod === 'Todos' ? 'Filtrar por módulo...' : mod}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de Manuales */}
      {manualesFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-gray-500 font-medium">No hay manuales disponibles para este módulo.</p>
          <p className="text-gray-400 text-sm mt-1">El administrador subirá los recursos pronto.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {manualesFiltrados.map((manual) => (
            <div key={manual.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col">
              
              <div className="p-4 border-b border-gray-100 text-center flex-grow">
                <div className="text-5xl mb-3">📄</div>
                <h3 className="font-bold text-[#0c2340] text-sm mb-2">{manual.titulo}</h3>
                <span className="bg-[#20c997] text-white px-3 py-1 rounded-full text-xs font-bold">
                  {manual.modulo}
                </span>
                {manual.descripcion && manual.descripcion !== 'Sin descripción' && (
                  <p className="text-xs text-gray-500 mt-2">{manual.descripcion}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">Subido: {manual.fecha_subida}</p>
              </div>

              <div className="p-3 bg-gray-50 flex justify-center gap-2">
                <button
                  onClick={() => verPDF(manual)}
                  className="bg-[#20c997] hover:bg-[#1a9e7a] text-white px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                >
                  📖 Ver Online
                </button>
                <button
                  onClick={() => descargarPDF(manual)}
                  className="bg-[#007bff] hover:bg-[#0056b3] text-white px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                >
                  📥 Descargar
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MisModulos;