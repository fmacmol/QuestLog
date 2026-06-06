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
  pet: {
    animal: { type: String, default: null },
    background: { type: String, default: null }, 
    stage: { type: String, default: 'egg' },     
    claimed: { type: Boolean, default: false }   
  }
});

module.exports = mongoose.model('User', userSchema);