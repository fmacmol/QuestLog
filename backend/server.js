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
    
    const user = await User.findOne({ email });
    if (!user) {
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
    
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email, 
        isAdmin: user.isAdmin || false
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
  createdAt: { type: Date, default: Date.now },
  
  // NUEVOS CAMPOS PARA MULTIREQUISITOS
  isMultiRequirement: { type: Boolean, default: false },
  subtasks: [{
    text: { type: String, required: true },
    completed: { type: Boolean, default: false }
  }],

  fromChallenge: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'PublicChallenge' 
  }

});

const Quest = mongoose.model('Quest', questSchema);

// Modelo de Retos Públicos
const publicChallengeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  xpReward: { type: Number, default: 100 },
  difficulty: { type: String, enum: ['Fácil', 'Media', 'Difícil'], default: 'Media' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  acceptedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

const PublicChallenge = mongoose.model('PublicChallenge', publicChallengeSchema);

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
      { returnDocument: 'after' }
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


// ===== RUTAS PARA RETOS PÚBLICOS =====

// GET todos los retos activos
app.get('/api/public-challenges', async (req, res) => {
  try {
    const challenges = await PublicChallenge.find({ isActive: true })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'username')
      .populate('acceptedBy', '_id');
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST aceptar un reto (añade el usuario a acceptedBy)
app.post('/api/public-challenges/:id/accept', authenticate, async (req, res) => {
  try {
    const challenge = await PublicChallenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ error: 'Reto no encontrado' });
    }
    
    if (challenge.acceptedBy.includes(req.userId)) {
      return res.status(400).json({ error: 'Ya aceptaste este reto' });
    }
    
    challenge.acceptedBy.push(req.userId);
    await challenge.save();
    
    // Devolver el reto actualizado (con populate para que tenga los datos completos)
    const updatedChallenge = await PublicChallenge.findById(req.params.id)
      .populate('createdBy', 'username')
      .populate('acceptedBy', '_id');
    
      res.json(updatedChallenge);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

// POST cancelar reto (quita el usuario de acceptedBy)
app.post('/api/public-challenges/:id/cancel', authenticate, async (req, res) => {
  try {
    const challenge = await PublicChallenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ error: 'Reto no encontrado' });
    }
    
    // Quitar usuario de la lista de aceptados
    challenge.acceptedBy = challenge.acceptedBy.filter(
      userId => userId.toString() !== req.userId
    );
    await challenge.save();
    
    res.json({ success: true, challenge });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST crear nuevo reto (solo admin)
app.post('/api/public-challenges', authenticate, async (req, res) => {
  try {
    // Verificar si el usuario es admin (necesitas añadir campo isAdmin al User)
    const user = await User.findById(req.userId);
    if (!user.isAdmin) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    
    const challenge = new PublicChallenge({
      ...req.body,
      createdBy: req.userId
    });
    await challenge.save();
    res.status(201).json(challenge);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE desactivar reto (solo admin)
app.delete('/api/public-challenges/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user.isAdmin) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    
    const challenge = await PublicChallenge.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    res.json(challenge);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cambiar contraseña
app.put('/api/auth/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);
    
    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }
    
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    
    res.json({ message: 'Contraseña actualizada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar perfil de usuario
app.put('/api/auth/update-profile', authenticate, async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Actualizar username
    if (username) {
      user.username = username;
    }
    
    // Actualizar contraseña si se proporciona
    if (currentPassword && newPassword) {
      const bcrypt = require('bcryptjs');
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      
      if (!isMatch) {
        return res.status(401).json({ error: 'Contraseña actual incorrecta' });
      }
      
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }
    
    await user.save();
    res.json({ message: 'Perfil actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cambiar nombre de usuario
app.put('/api/auth/change-username', authenticate, async (req, res) => {
  try {
    const { username } = req.body;
    const existing = await User.findOne({ username, _id: { $ne: req.userId } });
    if (existing) {
      return res.status(400).json({ error: 'Nombre de usuario ya existe' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.userId,
      { username },
      { new: true }
    );
    res.json({ username: user.username });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Base de datos: MongoDB LOCAL`);
});