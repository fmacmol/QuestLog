const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: '¡API de QuestLog funcionando! 🎮' });
});

// Ruta para las quests (la crearás después)
app.get('/api/quests', (req, res) => {
  res.json([{ title: 'Primera quest de prueba', xp: 100 }]);
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});