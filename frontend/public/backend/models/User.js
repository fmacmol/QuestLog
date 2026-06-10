const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  stats: {
    totalXP: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    completedQuests: { type: Number, default: 0 },
    lastCelebratedLevel: { type: Number, default: 0 }
  },
  pets: [{
    animal: { type: String, required: true },
    background: { type: String, required: true },
    stage: { type: String, default: 'egg' },
    xp: { type: Number, default: 0 },   
    isActive: { type: Boolean, default: false }
  }],
  ownedBackgrounds: { type: [String], default: [] },
  activePetIndex: { type: Number, default: 0 },
  coins: { type: Number, default: 0 },
  cosmetics: {
    owned: {
      hats: { type: [String], default: [] },
      accessories: { type: [String], default: [] }
    }
  }
});

module.exports = mongoose.model('User', userSchema);