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
    min: 1
  },
  
  streak: {
    type: Number,
    default: 1,
    min: 1
  },
  
  vipLevel: {
    type: String,
    enum: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'],
    required: true
  },
  
  baseAmount: {
    type: Number,
    required: true
  },
  
  vipMultiplier: {
    type: Number,
    default: 1,
    min: 1
  },
  
  bonusType: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'special'],
    default: 'daily'
  },
  
  // Special bonus details
  specialBonus: {
    reason: String,
    eventName: String,
    originalAmount: Number
  }
}, {
  timestamps: true
});

// Indexes
dailyBonusSchema.index({ userId: 1, createdAt: -1 });
dailyBonusSchema.index({ createdAt: -1 });
dailyBonusSchema.index({ bonusType: 1 });
dailyBonusSchema.index({ vipLevel: 1 });

// Compound indexes
dailyBonusSchema.index({ userId: 1, bonusType: 1, createdAt: -1 });

// Virtual for days since claim
dailyBonusSchema.virtual('daysSinceClaim').get(function() {
  return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Static method to calculate next bonus amount
dailyBonusSchema.statics.calculateBonusAmount = function(streak, vipLevel) {
  const baseAmounts = [10, 20, 30, 50, 75, 100, 200];
  const dayIndex = Math.min(streak - 1, baseAmounts.length - 1);
  const baseAmount = baseAmounts[dayIndex];
  
  const vipMultipliers = {
    BRONZE: 1,
    SILVER: 1.2,
    GOLD: 1.5,
    PLATINUM: 2,
    DIAMOND: 3
  };
  
  const multiplier = vipMultipliers[vipLevel] || 1;
  return {
    baseAmount,
    multiplier,
    finalAmount: Math.round(baseAmount * multiplier)
  };
};

// Static method to check if user can claim bonus
dailyBonusSchema.statics.canUserClaimBonus = async function(userId) {
  const lastBonus = await this.findOne({ 
    userId: mongoose.Types.ObjectId(userId),
    bonusType: 'daily'
  }).sort({ createdAt: -1 });

  if (!lastBonus) return { canClaim: true, streak: 1 };

  const hoursSinceLastClaim = (new Date() - lastBonus.createdAt) / (1000 * 60 * 60);
  const canClaim = hoursSinceLastClaim >= 20; // Can claim every 20 hours
  
  let streak = 1;
  if (canClaim) {
    const daysSinceLastClaim = hoursSinceLastClaim / 24;
    if (daysSinceLastClaim <= 1.5) {
      streak = lastBonus.streak + 1;
    }
  }

  return {
    canClaim,
    streak,
    hoursUntilNext: canClaim ? 0 : (20 - hoursSinceLastClaim),
    lastClaimDate: lastBonus.createdAt
  };
};

// Static method to create bonus for user
dailyBonusSchema.statics.createBonusForUser = async function(userId, bonusType = 'daily', specialOptions = {}) {
  const User = mongoose.model('User');
  const user = await User.findById(userId);
  
  if (!user) throw new Error('User not found');

  let streak = 1;
  let amount;
  
  if (bonusType === 'daily') {
    const claimInfo = await this.canUserClaimBonus(userId);
    if (!claimInfo.canClaim) {
      throw new Error('Daily bonus not ready yet');
    }
    
    streak = claimInfo.streak;
    const bonusCalc = this.calculateBonusAmount(streak, user.vipLevel);
    amount = bonusCalc.finalAmount;
  } else {
    // Special bonus amounts
    amount = specialOptions.amount || 50;
  }

  // Create bonus record
  const bonus = new this({
    userId,
    amount,
    streak,
    vipLevel: user.vipLevel,
    baseAmount: bonusType === 'daily' ? this.calculateBonusAmount(streak, user.vipLevel).baseAmount : amount,
    vipMultiplier: bonusType === 'daily' ? this.calculateBonusAmount(streak, user.vipLevel).multiplier : 1,
    bonusType,
    specialBonus: specialOptions.special || null
  });

  await bonus.save();

  // Update user balance
  user.balance += amount;
  if (bonusType === 'daily') {
    user.lastDailyBonus = new Date();
    user.dailyBonusStreak = streak;
  }
  await user.save();

  return bonus;
};

// Static method to get user bonus history
dailyBonusSchema.statics.getUserBonusHistory = async function(userId, limit = 30) {
  return this.find({ userId: mongoose.Types.ObjectId(userId) })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('amount streak vipLevel bonusType createdAt specialBonus');
};

// Static method to get bonus statistics
dailyBonusSchema.statics.getBonusStats = async function(days = 30) {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const stats = await this.aggregate([
    { $match: { createdAt: { $gte: cutoffDate } } },
    {
      $group: {
        _id: null,
        totalBonuses: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        averageAmount: { $avg: '$amount' },
        uniqueUsers: { $addToSet: '$userId' },
        maxStreak: { $max: '$streak' },
        bonusesByType: {
          $push: {
            type: '$bonusType',
            amount: '$amount'
          }
        }
      }
    },
    {
      $project: {
        totalBonuses: 1,
        totalAmount: 1,
        averageAmount: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        maxStreak: 1,
        bonusesByType: 1
      }
    }
  ]);

  const vipStats = await this.aggregate([
    { $match: { createdAt: { $gte: cutoffDate } } },
    {
      $group: {
        _id: '$vipLevel',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        avgAmount: { $avg: '$amount' }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);

  return {
    overall: stats[0] || {
      totalBonuses: 0,
      totalAmount: 0,
      averageAmount: 0,
      uniqueUsers: 0,
      maxStreak: 0
    },
    byVipLevel: vipStats
  };
};

// Method to check if this breaks a streak
dailyBonusSchema.methods.isStreakBroken = function() {
  return this.streak === 1;
};

// Method to get next bonus preview
dailyBonusSchema.methods.getNextBonusPreview = function() {
  const nextStreak = this.streak + 1;
  return this.constructor.calculateBonusAmount(nextStreak, this.vipLevel);
};

module.exports = mongoose.model('DailyBonus', dailyBonusSchema);