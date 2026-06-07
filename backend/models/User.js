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
  activePetIndex: { type: Number, default: 0 },
  coins: { type: Number, default: 0 },
  cosmetics: {
    hats: [{ type: String }],
    accessories: [{ type: String }]
  }
});

module.exports = mongoose.model('User', userSchema);