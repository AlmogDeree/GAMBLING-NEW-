const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  balance: {
    type: Number,
    default: 1000,
    min: 0
  },
  totalBets: {
    type: Number,
    default: 0
  },
  totalWins: {
    type: Number,
    default: 0
  },
  totalWinAmount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  welcomeBonusReceived: {
    type: Boolean,
    default: false
  },
  preferences: {
    soundEnabled: {
      type: Boolean,
      default: true
    },
    notificationsEnabled: {
      type: Boolean,
      default: true
    },
    language: {
      type: String,
      default: 'he',
      enum: ['he', 'en']
    }
  },
  achievements: [{
    name: String,
    earnedAt: Date
  }],
  loginStreak: {
    count: {
      type: Number,
      default: 0
    },
    lastLoginDate: Date
  },
  // Referral System
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  referralEarnings: {
    type: Number,
    default: 0
  },
  referralCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ totalBets: -1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ referralCode: 1 });

// Method to update statistics
userSchema.methods.updateStats = function(won, winAmount = 0) {
  this.totalBets += 1;
  if (won) {
    this.totalWins += 1;
    this.totalWinAmount += winAmount;
  }
  return this.save();
};

// Method to check if user has achievement
userSchema.methods.hasAchievement = function(achievementName) {
  return this.achievements.some(ach => ach.name === achievementName);
};

// Method to check and update achievements
userSchema.methods.checkAchievements = async function() {
  const achievements = [];
  
  // First bet achievement
  if (this.totalBets === 1 && !this.hasAchievement('first_bet')) {
    achievements.push({ name: 'first_bet', earnedAt: new Date() });
  }
  
  // First win achievement
  if (this.totalWins === 1 && !this.hasAchievement('first_win')) {
    achievements.push({ name: 'first_win', earnedAt: new Date() });
  }
  
  // Betting milestones
  const betMilestones = [10, 50, 100, 500, 1000, 5000];
  for (const milestone of betMilestones) {
    if (this.totalBets >= milestone && !this.hasAchievement(`bets_${milestone}`)) {
      achievements.push({ name: `bets_${milestone}`, earnedAt: new Date() });
    }
  }
  
  // Win milestones
  const winMilestones = [5, 25, 50, 100, 500];
  for (const milestone of winMilestones) {
    if (this.totalWins >= milestone && !this.hasAchievement(`wins_${milestone}`)) {
      achievements.push({ name: `wins_${milestone}`, earnedAt: new Date() });
    }
  }
  
  // Add new achievements
  if (achievements.length > 0) {
    this.achievements.push(...achievements);
    await this.save();
  }
  
  return achievements;
};

// Generate unique referral code
userSchema.methods.generateReferralCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

module.exports = mongoose.model('User', userSchema);