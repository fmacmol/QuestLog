const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Conectar a MongoDB LOCAL
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Conectado a MongoDB LOCAL'))
  .catch(err => console.error('Error conectando a MongoDB:', err.message));

// Modelo de Quest
const questSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  xpReward: { type: Number, default: 100 },
  difficulty: { type: String, enum: ['Fácil', 'Media', 'Difícil'], default: 'Media' },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Quest = mongoose.model('Quest', questSchema);

// Rutas
app.get('/', (req, res) => {
  res.json({ message: 'API de QuestLog funcionando con MongoDB LOCAL' });
});

// GET todas las quests
app.get('/api/quests', async (req, res) => {
  try {
    const quests = await Quest.find().sort({ createdAt: -1 });
    res.json(quests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST nueva quest
app.post('/api/quests', async (req, res) => {
  try {
    const newQuest = new Quest(req.body);
    const savedQuest = await newQuest.save();
    res.status(201).json(savedQuest);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT actualizar quest (sirve para todo: completar, editar, etc.)
app.put('/api/quests/:id', async (req, res) => {
  try {
    const updatedQuest = await Quest.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedQuest);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE eliminar quest (opcional)
app.delete('/api/quests/:id', async (req, res) => {
  try {
    await Quest.findByIdAndDelete(req.params.id);
    res.json({ message: 'Quest eliminada' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// SOLO PARA DESARROLLO: Eliminar todas las quests
app.delete('/api/quests/cleanup', async (req, res) => {
  try {
    await Quest.deleteMany({});
    res.json({ message: 'Todas las quests eliminadas' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Base de datos: MongoDB LOCAL`);
});