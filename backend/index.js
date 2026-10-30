const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();

// RNF-03: Configuración de CORS
app.use(cors());
app.use(express.json());

// Conexión a Base de Datos MySQL
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sistema_educativo',
  port: process.env.DB_PORT || 3306
});

// RF-01: Registrar Estudiante
app.post('/api/estudiantes', async (req, res) => {
  try {
    const { nombre, edad } = req.body;
    const [result] = await db.execute(
      'INSERT INTO estudiantes (nombre, edad) VALUES (?, ?)',
      [nombre, edad]
    );
    res.status(201).json({ id: result.insertId, nombre, edad });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// RF-07: Listar Actividades
app.get('/api/actividades', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM actividades');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// RF-05: Guardar Progreso del Juego (HTTP POST)
app.post('/api/progresos', async (req, res) => {
  try {
    const { estudiante_id, actividad_id, puntaje } = req.body;
    await db.execute(
      'INSERT INTO progresos (estudiante_id, actividad_id, puntaje) VALUES (?, ?, ?)',
      [estudiante_id, actividad_id, puntaje]
    );
    res.status(201).json({ mensaje: 'Progreso guardado con éxito' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// RF-06 y RF-08: Reporte de Progresos con filtro opcional por estudiante (HTTP GET)
app.get('/api/reportes', async (req, res) => {
  try {
    const { estudiante_id } = req.query;
    let query = `
      SELECT p.id, e.nombre AS estudiante, a.nombre_juego AS actividad, p.puntaje, p.fecha_intento
      FROM progresos p
      JOIN estudiantes e ON p.estudiante_id = e.id
      JOIN actividades a ON p.actividad_id = a.id
    `;
    const params = [];

    if (estudiante_id) {
      query += ' WHERE p.estudiante_id = ?';
      params.push(estudiante_id);
    }

    query += ' ORDER BY p.fecha_intento DESC';

    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});