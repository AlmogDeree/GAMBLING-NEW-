const mongoose = require('mongoose');

const dailyBonusSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  streak: {
    type: Number,
    default: 1,
    min: 1
  },
  vipLevel: {
    type: String,
    enum: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'],
    default: 'BRONZE'
  },
  claimedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
dailyBonusSchema.index({ userId: 1, createdAt: -1 });
dailyBonusSchema.index({ createdAt: -1 });

// Static method to check if user can claim bonus
dailyBonusSchema.statics.canUserClaim = async function(userId) {
  const lastClaim = await this.findOne({ userId })
    .sort({ createdAt: -1 });
  
  if (!lastClaim) return true;
  
  const hoursSinceLastClaim = (new Date() - lastClaim.createdAt) / (1000 * 60 * 60);
  return hoursSinceLastClaim >= 24;
};

// Static method to get user's current streak
dailyBonusSchema.statics.getUserStreak = async function(userId) {
  const lastClaim = await this.findOne({ userId })
    .sort({ createdAt: -1 });
  
  if (!lastClaim) return 0;
  
  const daysSinceLastClaim = (new Date() - lastClaim.createdAt) / (1000 * 60 * 60 * 24);
  
  if (daysSinceLastClaim > 2) {
    // Streak broken
    return 0;
  }
  
  return lastClaim.streak || 1;
};

module.exports = mongoose.model('DailyBonus', dailyBonusSchema);