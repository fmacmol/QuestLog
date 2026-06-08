const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  isAdmin: { type: Boolean, default: false },
  stats: {
    totalXP: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    completedQuests: { type: Number, default: 0 },
    completedChallenges: { type: Number, default: 0 }
  },
  completedChallenges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PublicChallenge' }],
  pets: [{
    animal: { type: String, required: true },
    background: { type: String, required: true },
    stage: { type: String, default: 'egg' },
    isActive: { type: Boolean, default: false }
  }],
  ownedBackgrounds: { type: [String], default: [] },
  activePetIndex: { type: Number, default: 0 },
  coins: { type: Number, default: 0 },
  cosmetics: {
    owned: {
      hats: { type: [String], default: [] },
      accessories: { type: [String], default: [] }
    },
    equipped: {
      hat: { type: String, default: null },
      accessory: { type: String, default: null },
      position: {
        hat: {
          x: { type: Number, default: 50 },
          y: { type: Number, default: 20 }
        },
        accessory: {
          x: { type: Number, default: 50 },
          y: { type: Number, default: 80 }
        }
      }
    }
  }
});

module.exports = mongoose.model('User', userSchema);