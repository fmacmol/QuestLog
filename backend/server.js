const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const SECRET_KEY = 'tu_clave_secreta_cambiala_en_produccion';

function calculateLevel(xp) {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

// Calcular etapa de la mascota según XP
function getPetStageByXP(xp) {
  if (xp < 50) return 'egg';
  if (xp < 100) return 'egg_cracked';
  if (xp < 500) return 'baby';
  return 'adult';
}

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
      password: hashedPassword,  // ← Usar la encriptada, no la original
      stats: { totalXP: 0, level: 1, completedQuests: 0, completedChallenges: 0 },
      completedChallenges: []
    });
    
    await user.save();
    
    // Crear token
    const token = jwt.sign({ userId: user._id }, SECRET_KEY);
    
    res.status(201).json({ 
      token, 
      user: {
        id: user._id,
        username, 
        email, 
        ownedBackgrounds: user.ownedBackgrounds || [],
        coins: 0
      } 
    });
  } catch (error) {
    console.error('ERROR:', error);
    res.status(500).json({ error: error.message });
  }
});

function calculateLevel(xp) {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

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
        stats: user.stats || { totalXP: 0, level: 1, completedQuests: 0, completedChallenges: 0 },
        completedChallenges: user.completedChallenges || [],
        coins: user.coins || 0,
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
  xpReward: { type: Number, default: 250 },
  difficulty: { type: String, enum: ['Muy fácil', 'Fácil', 'Media', 'Difícil', 'Muy difícil'], default: 'Media' },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  archived: { type: Boolean, default: false },
  isMultiRequirement: { type: Boolean, default: false },
  subtasks: [{
    text: { type: String, required: true },
    completed: { type: Boolean, default: false }
  }],
});

const Quest = mongoose.model('Quest', questSchema);

// Rutas
app.get('/', (req, res) => {
  res.json({ message: 'API de QuestLog funcionando con MongoDB LOCAL' });
});

// GET todas las quests del usuario
app.get('/api/quests', authenticate, async (req, res) => {
  try {
    const quests = await Quest.find({ userId: req.userId, archived: false });
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
    const quest = await Quest.findOne({ _id: req.params.id, userId: req.userId });
    if (!quest) return res.status(404).json({ error: 'Quest no encontrada' });

    const wasCompleted = quest.completed;
    const isNowCompleted = req.body.completed;

    const user = await User.findById(req.userId);
    const isChallenge = !!quest.fromChallenge;
    const earnedCoins = Math.floor(quest.xpReward / 10);

    // Caso 1: Se completa ahora (false -> true)
    if (!wasCompleted && isNowCompleted) {
      user.stats.totalXP += quest.xpReward;
      user.stats.level = calculateLevel(user.stats.totalXP);
      if (isChallenge) {
        user.stats.completedChallenges += 1;
        if (!user.completedChallenges.includes(quest.fromChallenge)) {
          user.completedChallenges.push(quest.fromChallenge);
        }
      } else {
        user.stats.completedQuests += 1;
      }

      // AÑADIR MONEDAS
      user.coins = (user.coins || 0) + earnedCoins;

      // AÑADIR XP A LA MASCOTA ACTIVA
      const activeIndex = user.activePetIndex || 0;
      if (user.pets && user.pets[activeIndex]) {
        const pet = user.pets[activeIndex];
        pet.xp = (pet.xp || 0) + quest.xpReward;
        pet.stage = getPetStageByXP(pet.xp);
      }

      await user.save();
    }
    
    // Caso 2: Se desmarca (true -> false)
    if (wasCompleted && !isNowCompleted) {
      user.stats.totalXP -= quest.xpReward;
      user.stats.level = calculateLevel(user.stats.totalXP);
      if (isChallenge) {
        user.stats.completedChallenges -= 1;
        user.completedChallenges = user.completedChallenges.filter(
          id => id.toString() !== quest.fromChallenge.toString()
        );
      } else {
        user.stats.completedQuests -= 1;
      }

      // RESTAR MONEDAS
      user.coins = (user.coins && user.coins >= earnedCoins ? user.coins - earnedCoins : 0);

      // RESTAR XP A LA MASCOTA ACTIVA
      const activeIndex = user.activePetIndex || 0;
      if (user.pets && user.pets[activeIndex]) {
        const pet = user.pets[activeIndex];
        pet.xp = Math.max(0, (pet.xp || 0) - quest.xpReward);
        pet.stage = getPetStageByXP(pet.xp);
      }

      await user.save();
    }

    const updatedQuest = await Quest.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: 'after' }
    );
    
    // Enviar también información de evolución si ocurrió
    res.json({ 
      quest: updatedQuest,
      coins: user.coins
    });
  } catch (error) {
    console.error('Error en PUT /quests:', error);
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
    // Primero buscar, NO eliminar
    const quest = await Quest.findOne({ _id: req.params.id, userId: req.userId });
    if (!quest) return res.status(404).json({ error: 'Quest no encontrada' });

    if (quest.completed) {
      // Si está completada, archivarla
      quest.archived = true;
      await quest.save();
      res.json({ message: 'Tarea archivada (historial)' });
    } else {
      // Si no está completada, eliminarla realmente
      await Quest.deleteOne({ _id: req.params.id });
      res.json({ message: 'Tarea eliminada' });
    }
  } catch (error) {
    console.error('Error en DELETE /quests:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET quests archivadas (historial)
app.get('/api/quests/archived', authenticate, async (req, res) => {
  try {
    const quests = await Quest.find({ userId: req.userId, archived: true }).sort({ createdAt: -1 });
    res.json(quests);
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

// Obtener perfil de usuario
app.get('/api/auth/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('username email stats lastCelebratedLevel completedChallenges cosmetics coins pets ownedBackgrounds');
    res.json(user);
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
      { returnDocument: 'after' }
    );
    res.json({ username: user.username });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ===== RUTAS PARA MASCOTA =====

// Obtener estado de la mascota del usuario
app.get('/api/pets', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json({ pets: user.pets || [], activeIndex: user.activePetIndex || 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Inicializar mascota (regalo aleatorio)
app.post('/api/pets/init', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (user.pets && user.pets.length > 0) {
      return res.status(400).json({ error: 'Ya tienes mascotas' });
    }
    
    const packs = [
      { animal: 'dog', background: 'dogPaw' },
      { animal: 'cat', background: 'ballOfWool' },
      { animal: 'rabbit', background: 'carrot' }
    ];
    
    const randomPack = packs[Math.floor(Math.random() * packs.length)];

    user.pets = [{
      animal: randomPack.animal,
      background: randomPack.background,
      stage: 'egg',
      xp: 0,
      isActive: true
    }];
    user.activePetIndex = 0;
    await user.save();
    
    res.json({ success: true, pets: user.pets, activeIndex: user.activePetIndex });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cambiar mascota activa
app.post('/api/pets/activate', authenticate, async (req, res) => {
  try {
    const { index } = req.body;
    const user = await User.findById(req.userId);
    
    if (!user.pets || index >= user.pets.length) {
      return res.status(400).json({ error: 'Índice inválido' });
    }
    
    // Desmarcar todas
    user.pets.forEach(pet => pet.isActive = false);
    // Marcar la seleccionada
    user.pets[index].isActive = true;
    user.activePetIndex = index;
    await user.save();
    
    res.json({ success: true, activeIndex: index });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Actualizar el último nivel celebrado
app.put('/api/auth/update-last-level', authenticate, async (req, res) => {
  try {
    const { level } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    
    // Solo actualizar si el nivel es mayor que el último celebrado
    if (level > (user.stats.lastCelebratedLevel || 0)) {
      user.stats.lastCelebratedLevel = level;
      await user.save();
    }
    
    res.json({ success: true, lastCelebratedLevel: user.stats.lastCelebratedLevel });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== RUTAS PARA TIENDA =====

// Obtener catálogo de items disponibles
app.get('/api/shop/items', async (req, res) => {
  const items = {
    animals: [
      { id: 'common', name: 'Huevo misterioso', rarity: 'Común', price: 300, type: 'animal' },
      { id: 'rare', name: 'Huevo misterioso', rarity: 'Raro', price: 600, type: 'animal' },
      { id: 'mythical', name: 'Huevo misterioso', rarity: 'Mitológico', price: 1000, type: 'animal' }
    ],
    backgrounds: [
      { id: 'sea', name: 'Fondo Marino', price: 300, type: 'background' },
      { id: 'volcano', name: 'Fondo Volcánico', price: 300, type: 'background' },
      { id: 'ice', name: 'Fondo Helado', price: 300, type: 'background' }
    ],
    cosmetics: {
      hats: [
        { id: 'sombrero', name: 'Sombrero', price: 150 },
        { id: 'corona', name: 'Corona', price: 300 }
      ],
      accessories: [
        { id: 'espada', name: 'Espada', price: 200 },
        { id: 'escudo', name: 'Escudo', price: 250 }
      ]
    }
  };
  res.json(items);
});

// Comprar un animal (huevo aleatorio de los no poseídos)
app.post('/api/shop/buy-animal', authenticate, async (req, res) => {
  try {
    const { rarity } = req.body; // 'common', 'rare', 'mythical'
    const user = await User.findById(req.userId);
    
    const prices = { common: 300, rare: 600, mythical: 1000 };
    const price = prices[rarity];
    
    if ((user.coins || 0) < price) {
      return res.status(400).json({ error: 'Monedas insuficientes' });
    }
    
    // Animales disponibles según rareza
    const animalsByRarity = {
      common: ['dog', 'cat', 'rabbit'],
      rare: ['axolotl', 'fennecfox', 'slowloris'],
      mythical: ['dragon', 'griffin', 'phoenix']
    };
    
    // ANIMALES QUE YA POSEE EL USUARIO
    const ownedAnimals = user.pets.map(pet => pet.animal);
    const availableToBuy = animalsByRarity[rarity].filter(a => !ownedAnimals.includes(a));
    
    // SI YA TIENE TODOS LOS ANIMALES DE ESTA RAREZA
    if (availableToBuy.length === 0) {
      let rarityName = '';
      if (rarity === 'common') rarityName = 'comunes';
      else if (rarity === 'rare') rarityName = 'raros';
      else rarityName = 'mitológicos';
      
      return res.status(400).json({ 
        error: `¡Ya tienes todos los animales ${rarityName}! Prueba otra rareza.` 
      });
    }
    
    // SELECCIONAR ANIMAL ALEATORIO DE LOS DISPONIBLES
    const randomAnimal = availableToBuy[Math.floor(Math.random() * availableToBuy.length)];
    
    // Asignar fondo por defecto según animal
    const defaultBackgrounds = {
      dog: 'dogPaw',
      cat: 'ballOfWool',
      rabbit: 'carrot',
      axolotl: 'sea',
      fennecfox: 'desert',
      slowloris: 'forest',
      dragon: 'starsNight',
      griffin: 'sky',
      phoenix: 'rainbowFire'
    };
    
    user.pets.push({
      animal: randomAnimal,
      background: defaultBackgrounds[randomAnimal],
      stage: 'egg',
      xp: 0,
      isActive: false
    });
    user.coins -= price;
    await user.save();
    
    res.json({ success: true, pet: user.pets[user.pets.length - 1], coins: user.coins });
  } catch (error) {
    console.error('Error comprando animal:', error);
    res.status(500).json({ error: error.message });
  }
});

// Comprar fondo para mascota
app.post('/api/shop/buy-background', authenticate, async (req, res) => {
  try {
    const { backgroundId } = req.body;
    const user = await User.findById(req.userId);
    
    const backgrounds = { sea: 300, volcano: 300, ice: 300 };
    const price = backgrounds[backgroundId];
    
    if (!price) return res.status(400).json({ error: 'Fondo no válido' });
    if ((user.coins || 0) < price) {
      return res.status(400).json({ error: 'Monedas insuficientes' });
    }
    
    // Añadir a la colección de fondos del usuario si no lo tiene ya
    if (!user.ownedBackgrounds.includes(backgroundId)) {
      user.ownedBackgrounds.push(backgroundId);
    } else {
      return res.status(400).json({ error: 'Ya tienes este fondo' });
    }
    
    user.coins -= price;
    await user.save();
    
    res.json({ success: true, coins: user.coins, ownedBackgrounds: user.ownedBackgrounds });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Comprar cosmético (sombrero o accesorio)
app.post('/api/shop/buy-cosmetic', authenticate, async (req, res) => {
  try {
    const { type, itemId } = req.body; // type: 'hat' o 'accessory'
    const user = await User.findById(req.userId);
    
    const prices = {
      sombrero: 150, corona: 300, espada: 200, escudo: 250
    };
    const price = prices[itemId];
    
    if (!price) return res.status(400).json({ error: 'Item no válido' });
    if ((user.coins || 0) < price) {
      return res.status(400).json({ error: 'Monedas insuficientes' });
    }
    
    if (!user.cosmetics) {
      user.cosmetics = {
        owned: { hats: [], accessories: [] },
        equipped: { hat: null, accessory: null, position: { hat: { x: 50, y: 20 }, accessory: { x: 50, y: 80 } } }
      };
    }
    
    // Añadir el item a la colección correspondiente
    if (type === 'hat') {
      if (!user.cosmetics.owned.hats.includes(itemId)) {
        user.cosmetics.owned.hats.push(itemId);
      } else {
        return res.status(400).json({ error: 'Ya tienes este sombrero' });
      }
    } else if (type === 'accessory') {
      if (!user.cosmetics.owned.accessories.includes(itemId)) {
        user.cosmetics.owned.accessories.push(itemId);
      } else {
        return res.status(400).json({ error: 'Ya tienes este accesorio' });
      }
    }
    
    user.coins -= price;
    await user.save();
    
    res.json({ success: true, coins: user.coins, cosmetics: user.cosmetics });
  } catch (error) {
    console.error('Error comprando cosmético:', error);
    res.status(500).json({ error: error.message });
  }
});


// ===== RUTAS PARA COSMÉTICOS Y FONDOS =====

// Cambiar fondo de una mascota específica
app.post('/api/pets/change-background', authenticate, async (req, res) => {
  try {
    const { backgroundId } = req.body;
    const user = await User.findById(req.userId);
    
    const activeIndex = user.activePetIndex || 0;
    if (!user.pets || !user.pets[activeIndex]) {
      return res.status(400).json({ error: 'Mascota no encontrada' });
    }
    
    user.pets[activeIndex].background = backgroundId;
    await user.save();
    
    res.json({ success: true, pet: user.pets[activeIndex] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Base de datos: MongoDB LOCAL`);
});