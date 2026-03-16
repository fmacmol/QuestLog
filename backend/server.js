const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const SECRET_KEY = 'tu_clave_secreta_cambiala_en_produccion';


// Middleware para verificar token
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Conectar a MongoDB LOCAL
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Conectado a MongoDB LOCAL'))
  .catch(err => console.error('Error conectando a MongoDB:', err.message));


// ===== RUTAS DE AUTENTICACIÓN =====
const User = require('./models/User');

// Registro
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('Registro intentado con:', req.body);
    
    const { username, email, password } = req.body;
    
    // Verificar si ya existe
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Usuario o email ya existe' });
    }
    
    // ENCRIPTAR CONTRASEÑA (¡esto es lo que faltaba!)
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Crear usuario con contraseña encriptada
    const user = new User({ 
      username, 
      email, 
      password: hashedPassword  // ← Usar la encriptada, no la original
    });
    
    await user.save();
    
    // Crear token
    const token = jwt.sign({ userId: user._id }, SECRET_KEY);
    
    res.status(201).json({ 
      token, 
      user: { id: user._id, username, email } 
    });
  } catch (error) {
    console.error('ERROR:', error);
    res.status(500).json({ error: error.message });
  }
});


// Login (sin depender del método del modelo)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login intentado para:', email);
    
    const user = await User.findOne({ email });
    if (!user) {
      console.log('Usuario no encontrado');
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }
    
    // Comparar contraseñas DIRECTAMENTE con bcrypt
    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }
    
    // Crear token
    const token = jwt.sign({ userId: user._id }, SECRET_KEY);
    console.log('Login exitoso para:', user.username);
    
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email 
      } 
    });
  } catch (error) {
    console.error('ERROR LOGIN:', error);
    res.status(500).json({ error: error.message });
  }
});

// Modelo de Quest
const questSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
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

// GET todas las quests del usuario
app.get('/api/quests', authenticate, async (req, res) => {
  try {
    const quests = await Quest.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(quests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST nueva quest (asociada al usuario)
app.post('/api/quests', authenticate, async (req, res) => {
  try {
    const newQuest = new Quest({
      ...req.body,
      userId: req.userId
    });
    const savedQuest = await newQuest.save();
    res.status(201).json(savedQuest);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT actualizar quest (sirve para todo: completar, editar, etc.)
app.put('/api/quests/:id', authenticate, async (req, res) => {
  try {
    const quest = await Quest.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    if (!quest) return res.status(404).json({ error: 'Quest no encontrada' });
    res.json(quest);
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

// DELETE eliminar quest
app.delete('/api/quests/:id', authenticate, async (req, res) => {
  try {
    const quest = await Quest.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!quest) return res.status(404).json({ error: 'Quest no encontrada' });
    res.json({ message: 'Quest eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Base de datos: MongoDB LOCAL`);
});