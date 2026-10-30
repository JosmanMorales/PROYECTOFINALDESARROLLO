import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// Adaptación dinámica de IP/localhost para comunicación con la API REST (Express)
const API_URL = `http://${window.location.hostname}:5000/api`;

function App() {
  // Estados principales de la aplicación
  const [estudiante, setEstudiante] = useState({ nombre: '', edad: '' });
  const [estudianteGuardado, setEstudianteGuardado] = useState(null);
  const [actividades, setActividades] = useState([]);
  const [reportes, setReportes] = useState([]);
  const [filtroEstudiante, setFiltroEstudiante] = useState('');

  // Estados para la gestión interactiva del juego activo
  const [juegoActivo, setJuegoActivo] = useState(null);
  const [mensajeEvaluacion, setMensajeEvaluacion] = useState('');

  useEffect(() => {
    // RF-07: Obtener catálogo de actividades desde MySQL
    axios.get(`${API_URL}/actividades`)
      .then((res) => setActividades(res.data))
      .catch((err) => console.error("Error al cargar actividades:", err));
    
    // RF-06: Obtener reporte de progresos inicial
    obtenerReportes();
  }, []);

  // RF-01: Registro de datos básicos del estudiante
  const registrarEstudiante = (e) => {
    e.preventDefault();
    axios.post(`${API_URL}/estudiantes`, estudiante)
      .then((res) => {
        setEstudianteGuardado(res.data);
      })
      .catch((err) => alert('Error al registrar estudiante en la base de datos'));
  };

  // RF-06 & RF-08: Consulta y filtrado de reportes para docentes vía HTTP GET
  const obtenerReportes = (idEstudiante = '') => {
    const url = idEstudiante 
      ? `${API_URL}/reportes?estudiante_id=${idEstudiante}`
      : `${API_URL}/reportes`;

    axios.get(url)
      .then((res) => setReportes(res.data))
      .catch((err) => console.error("Error al cargar reportes:", err));
  };

  // RF-02: Apertura del modal con la interfaz dinámica del juego seleccionado
  const iniciarJuego = (act) => {
    if (!estudianteGuardado) {
      alert('Debes registrar al estudiante antes de comenzar a jugar');
      return;
    }
    setJuegoActivo(act);
    setMensajeEvaluacion('');
  };

  // RF-03, RF-04 & RF-05: Evaluación instantánea, cálculo de puntaje y persistencia POST en MySQL
  const evaluarRespuesta = (esCorrecto) => {
    if (esCorrecto) {
      setMensajeEvaluacion('🎉 ¡Excelente! Respuesta Correcta (+100 Pts)');
      axios.post(`${API_URL}/progresos`, {
        estudiante_id: estudianteGuardado.id,
        actividad_id: juegoActivo.id,
        puntaje: 100
      }).then(() => {
        obtenerReportes(filtroEstudiante);
        setTimeout(() => setJuegoActivo(null), 1800);
      }).catch((err) => console.error("Error al guardar progreso:", err));
    } else {
      setMensajeEvaluacion('❌ ¡Inténtalo de nuevo!');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🎓 Portal de Aprendizaje Infantil</h1>

      {/* RF-01: Formulario de Registro de Estudiante */}
      {!estudianteGuardado ? (
        <form onSubmit={registrarEstudiante} style={{ background: '#e9ecef', padding: '20px', borderRadius: '8px', marginBottom: '25px' }}>
          <h2>Registro de Estudiante</h2>
          <input
            type="text"
            placeholder="Nombre del niño/a"
            value={estudiante.nombre}
            onChange={(e) => setEstudiante({ ...estudiante, nombre: e.target.value })}
            required
            style={{ padding: '10px', marginRight: '10px', width: '200px' }}
          />
          <input
            type="number"
            placeholder="Edad"
            value={estudiante.edad}
            onChange={(e) => setEstudiante({ ...estudiante, edad: e.target.value })}
            required
            style={{ padding: '10px', marginRight: '10px', width: '100px' }}
          />
          <button type="submit" style={{ padding: '10px 20px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            Comenzar
          </button>
        </form>
      ) : (
        <div style={{ background: '#d4edda', padding: '15px', borderRadius: '8px', marginBottom: '25px', color: '#155724' }}>
          <h3>¡Bienvenido/a, {estudianteGuardado.nombre}! (Edad: {estudianteGuardado.edad} años)</h3>
        </div>
      )}

      {/* RF-07: Catálogo de Actividades desde MySQL */}
      <div style={{ marginBottom: '35px' }}>
        <h2>🎮 Actividades Disponibles</h2>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          {actividades.map((act) => (
            <div key={act.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', width: '230px', background: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
              <h4 style={{ marginTop: 0 }}>{act.nombre_juego}</h4>
              <p>Nivel: <strong>{act.nivel}</strong></p>
              <button 
                onClick={() => iniciarJuego(act)}
                style={{ width: '100%', padding: '10px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ¡Jugar Ahora!
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* RF-02, RF-03: Modal Interactivo para los Juegos */}
      {juegoActivo && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', width: '420px', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
            <h2>🎯 {juegoActivo.nombre_juego}</h2>
            
            {/* 1. Conocimientos Espaciales: Adentro / Afuera */}
            {juegoActivo.nombre_juego.includes('Adentro') && (
              <div>
                <p>¿Dónde está el juguete respecto a la caja?</p>
                <div style={{ fontSize: '50px', margin: '15px' }}>📦🧸</div>
                <button style={{ margin: '5px', padding: '10px 15px', cursor: 'pointer' }} onClick={() => evaluarRespuesta(true)}>Adentro de la caja</button>
                <button style={{ margin: '5px', padding: '10px 15px', cursor: 'pointer' }} onClick={() => evaluarRespuesta(false)}>Afuera de la caja</button>
              </div>
            )}

            {/* 2. Conocimientos Espaciales: Arriba / Abajo */}
            {juegoActivo.nombre_juego.includes('Arriba') && (
              <div>
                <p>¿Dónde se encuentra el pajarito 🕊️?</p>
                <div style={{ fontSize: '40px', margin: '15px' }}>🌳<br/>🕊️</div>
                <button style={{ margin: '5px', padding: '10px 15px', cursor: 'pointer' }} onClick={() => evaluarRespuesta(false)}>Arriba del árbol</button>
                <button style={{ margin: '5px', padding: '10px 15px', cursor: 'pointer' }} onClick={() => evaluarRespuesta(true)}>Abajo del árbol</button>
              </div>
            )}

            {/* 3. Conocimientos Espaciales: Cerca / Lejos */}
            {juegoActivo.nombre_juego.includes('Cerca') && (
              <div>
                <p>¿El perrito 🐕 está cerca o lejos de su casa 🏠?</p>
                <div style={{ fontSize: '30px', margin: '15px' }}>🏠 ...................... 🐕</div>
                <button style={{ margin: '5px', padding: '10px 15px', cursor: 'pointer' }} onClick={() => evaluarRespuesta(false)}>Cerca</button>
                <button style={{ margin: '5px', padding: '10px 15px', cursor: 'pointer' }} onClick={() => evaluarRespuesta(true)}>Lejos</button>
              </div>
            )}

            {/* 4. Conocimientos Espaciales: Encima / Debajo */}
            {juegoActivo.nombre_juego.includes('Encima') && (
              <div>
                <p>¿Dónde está la pelota ⚽ respecto a la mesa 🪑?</p>
                <div style={{ fontSize: '40px', margin: '15px' }}>⚽<br/>🪑</div>
                <button style={{ margin: '5px', padding: '10px 15px', cursor: 'pointer' }} onClick={() => evaluarRespuesta(true)}>Encima</button>
                <button style={{ margin: '5px', padding: '10px 15px', cursor: 'pointer' }} onClick={() => evaluarRespuesta(false)}>Debajo</button>
              </div>
            )}

            {/* 5. Figuras Geométricas */}
            {(juegoActivo.nombre_juego.includes('Circulo') || juegoActivo.nombre_juego.includes('Círculo')) && (
              <div>
                <p>Selecciona la figura que corresponde a un <strong>Círculo</strong>:</p>
                <button style={{ fontSize: '35px', margin: '10px', cursor: 'pointer', border: 'none', background: 'transparent' }} onClick={() => evaluarRespuesta(true)}>🔴</button>
                <button style={{ fontSize: '35px', margin: '10px', cursor: 'pointer', border: 'none', background: 'transparent' }} onClick={() => evaluarRespuesta(false)}>🟦</button>
                <button style={{ fontSize: '35px', margin: '10px', cursor: 'pointer', border: 'none', background: 'transparent' }} onClick={() => evaluarRespuesta(false)}>🔺</button>
              </div>
            )}

            {/* 6. Memoria: Pares */}
            {juegoActivo.nombre_juego.includes('Memoria') && (
              <div>
                <p>Encuentra el par exacto de este personaje: <strong>🐶 (Perro)</strong></p>
                <button style={{ fontSize: '35px', margin: '10px', cursor: 'pointer', border: 'none', background: 'transparent' }} onClick={() => evaluarRespuesta(false)}>🐱</button>
                <button style={{ fontSize: '35px', margin: '10px', cursor: 'pointer', border: 'none', background: 'transparent' }} onClick={() => evaluarRespuesta(true)}>🐶</button>
                <button style={{ fontSize: '35px', margin: '10px', cursor: 'pointer', border: 'none', background: 'transparent' }} onClick={() => evaluarRespuesta(false)}>🐰</button>
              </div>
            )}

            {/* 7. Matemáticas: Tablas de Multiplicar */}
            {juegoActivo.nombre_juego.includes('Multiplicar') && (
              <div>
                <p>¿Cuál es el resultado de <strong>7 x 8</strong>?</p>
                <button style={{ margin: '5px', padding: '10px 15px', cursor: 'pointer' }} onClick={() => evaluarRespuesta(false)}>48</button>
                <button style={{ margin: '5px', padding: '10px 15px', cursor: 'pointer' }} onClick={() => evaluarRespuesta(true)}>56</button>
                <button style={{ margin: '5px', padding: '10px 15px', cursor: 'pointer' }} onClick={() => evaluarRespuesta(false)}>64</button>
              </div>
            )}

            {/* 8. Matemáticas: Suma de Quebrados */}
            {juegoActivo.nombre_juego.includes('Quebrados') && (
              <div>
                <p>¿Cuál es el resultado de <strong>1/4 + 2/4</strong>?</p>
                <button style={{ margin: '5px', padding: '10px 15px', cursor: 'pointer' }} onClick={() => evaluarRespuesta(true)}>3/4</button>
                <button style={{ margin: '5px', padding: '10px 15px', cursor: 'pointer' }} onClick={() => evaluarRespuesta(false)}>3/8</button>
                <button style={{ margin: '5px', padding: '10px 15px', cursor: 'pointer' }} onClick={() => evaluarRespuesta(false)}>1/2</button>
              </div>
            )}

            {/* 9. Matemáticas: Multiplicación con Decimales */}
            {(juegoActivo.nombre_juego.includes('Decimales') || juegoActivo.nombre_juego.includes('decimales')) && (
              <div>
                <p>¿Cuál es el resultado de <strong>2.5 x 4</strong>?</p>
                <button style={{ margin: '5px', padding: '10px 15px', cursor: 'pointer' }} onClick={() => evaluarRespuesta(false)}>8.5</button>
                <button style={{ margin: '5px', padding: '10px 15px', cursor: 'pointer' }} onClick={() => evaluarRespuesta(true)}>10.0</button>
                <button style={{ margin: '5px', padding: '10px 15px', cursor: 'pointer' }} onClick={() => evaluarRespuesta(false)}>12.0</button>
              </div>
            )}

            {/* Evaluador visual de respuestas en tiempo real */}
            {mensajeEvaluacion && (
              <h3 style={{ marginTop: '15px', color: mensajeEvaluacion.includes('Excelente') ? '#28a745' : '#dc3545' }}>
                {mensajeEvaluacion}
              </h3>
            )}

            <br />
            <button 
              style={{ marginTop: '15px', background: '#6c757d', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }} 
              onClick={() => setJuegoActivo(null)}
            >
              Cerrar Juego
            </button>
          </div>
        </div>
      )}

      {/* RF-06 & RF-08: Reporte de Rendimiento y Filtrado para Docentes */}
      <div style={{ marginTop: '40px', background: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
        <h2>📊 Informe de Rendimiento (Docentes)</h2>
        
        {/* RF-08: Control de filtrado por ID de estudiante */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ fontWeight: 'bold' }}>Filtrar por ID de estudiante: </label>
          <input 
            type="number" 
            placeholder="Ej: 1" 
            value={filtroEstudiante} 
            onChange={(e) => {
              setFiltroEstudiante(e.target.value);
              obtenerReportes(e.target.value);
            }} 
            style={{ padding: '6px', marginLeft: '8px', width: '120px' }}
          />
        </div>

        <table border="1" cellPadding="10" style={{ borderCollapse: 'collapse', width: '100%', background: '#fff' }}>
          <thead>
            <tr style={{ background: '#e9ecef', textAlign: 'left' }}>
              <th>Estudiante</th>
              <th>Actividad</th>
              <th>Puntaje</th>
              <th>Fecha y Hora</th>
            </tr>
          </thead>
          <tbody>
            {reportes.length > 0 ? (
              reportes.map((rep) => (
                <tr key={rep.id}>
                  <td>{rep.estudiante}</td>
                  <td>{rep.actividad}</td>
                  <td><strong>{rep.puntaje} puntos</strong></td>
                  <td>{new Date(rep.fecha_intento).toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', color: '#6c757d' }}>No se encontraron registros de progreso.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;