const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
    lowercase: true,
    trim: true
  },
  
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  
  balance: {
    type: Number,
    default: 1000, // Welcome bonus
    min: 0
  },
  
  // Game statistics
  totalBets: {
    type: Number,
    default: 0
  },
  
  totalWins: {
    type: Number,
    default: 0
  },
  
  biggestWin: {
    type: Number,
    default: 0
  },
  
  totalWinAmount: {
    type: Number,
    default: 0
  },
  
  totalBetAmount: {
    type: Number,
    default: 0
  },
  
  // Referral system
  referralCode: {
    type: String,
    unique: true,
    required: true
  },
  
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  referralCount: {
    type: Number,
    default: 0
  },
  
  referralEarnings: {
    type: Number,
    default: 0
  },
  
  // Login tracking
  lastLogin: {
    type: Date,
    default: Date.now
  },
  
  loginStreak: {
    count: { type: Number, default: 1 },
    lastLoginDate: { type: Date, default: Date.now }
  },
  
  // Admin status
  isAdmin: {
    type: Boolean,
    default: false
  },
  
  // User preferences
  preferences: {
    language: {
      type: String,
      enum: ['he', 'en'],
      default: 'he'
    },
    soundEnabled: {
      type: Boolean,
      default: true
    },
    notifications: {
      type: Boolean,
      default: true
    },
    theme: {
      type: String,
      enum: ['dark', 'light'],
      default: 'dark'
    }
  },
  
  // Achievement system
  achievements: [{
    name: String,
    earnedAt: { type: Date, default: Date.now },
    description: String
  }],
  
  // Security and tracking
  lastIP: String,
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  isBanned: {
    type: Boolean,
    default: false
  },
  
  banReason: String,
  
  // Email verification
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  emailVerificationToken: String,
  
  // Password reset
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Session management
  activeSessions: [{
    sessionId: String,
    createdAt: { type: Date, default: Date.now },
    lastActivity: { type: Date, default: Date.now },
    ipAddress: String,
    userAgent: String
  }],
  
  // Daily bonus tracking
  lastDailyBonus: Date,
  dailyBonusStreak: {
    type: Number,
    default: 0
  },
  
  // VIP benefits tracking
  vipBenefitsUsed: {
    dailyBonus: { type: Date },
    weeklyBonus: { type: Date },
    monthlyBonus: { type: Date }
  }
}, {
  timestamps: true
});

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ referralCode: 1 });
userSchema.index({ referredBy: 1 });
userSchema.index({ isAdmin: 1 });
userSchema.index({ totalBets: -1 });
userSchema.index({ createdAt: -1 });

// Virtual for win rate
userSchema.virtual('winRate').get(function() {
  return this.totalBets > 0 ? ((this.totalWins / this.totalBets) * 100).toFixed(2) : 0;
});

// Virtual for profit/loss
userSchema.virtual('netProfit').get(function() {
  return this.totalWinAmount - this.totalBetAmount;
});

// Virtual for VIP level
userSchema.virtual('vipLevel').get(function() {
  if (this.totalBets >= 10000) return 'DIAMOND';
  if (this.totalBets >= 5000) return 'PLATINUM';
  if (this.totalBets >= 1000) return 'GOLD';
  if (this.totalBets >= 100) return 'SILVER';
  return 'BRONZE';
});

// Virtual for next VIP level requirements
userSchema.virtual('nextVIPLevel').get(function() {
  const current = this.vipLevel;
  const bets = this.totalBets;
  
  switch (current) {
    case 'BRONZE':
      return { level: 'SILVER', betsNeeded: 100 - bets };
    case 'SILVER':
      return { level: 'GOLD', betsNeeded: 1000 - bets };
    case 'GOLD':
      return { level: 'PLATINUM', betsNeeded: 5000 - bets };
    case 'PLATINUM':
      return { level: 'DIAMOND', betsNeeded: 10000 - bets };
    case 'DIAMOND':
      return { level: 'MAX', betsNeeded: 0 };
    default:
      return { level: 'SILVER', betsNeeded: 100 - bets };
  }
});

// Method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to generate password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = Math.random().toString(36).substring(2, 15) + 
                     Math.random().toString(36).substring(2, 15);
  
  this.passwordResetToken = resetToken;
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Method to check achievements
userSchema.methods.checkAchievements = async function() {
  const achievements = [];
  
  try {
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
    
    // Big win achievements
    const bigWinMilestones = [1000, 5000, 10000, 50000];
    for (const milestone of bigWinMilestones) {
      if (this.biggestWin >= milestone && !this.hasAchievement(`big_win_${milestone}`)) {
        achievements.push({ name: `big_win_${milestone}`, earnedAt: new Date() });
      }
    }
    
    // Login streak achievements
    const streakMilestones = [7, 30, 100];
    for (const milestone of streakMilestones) {
      if (this.loginStreak.count >= milestone && !this.hasAchievement(`streak_${milestone}`)) {
        achievements.push({ name: `streak_${milestone}`, earnedAt: new Date() });
      }
    }
    
    // Referral achievements
    const referralMilestones = [1, 5, 10, 25];
    for (const milestone of referralMilestones) {
      if (this.referralCount >= milestone && !this.hasAchievement(`referral_${milestone}`)) {
        achievements.push({ name: `referral_${milestone}`, earnedAt: new Date() });
      }
    }
    
    // Add new achievements
    if (achievements.length > 0) {
      this.achievements.push(...achievements);
      await this.save();
    }
    
    return achievements;
  } catch (error) {
    console.error('Achievement check error:', error);
    return [];
  }
};

// Method to check if user has specific achievement
userSchema.methods.hasAchievement = function(achievementName) {
  return this.achievements.some(achievement => achievement.name === achievementName);
};

// Method to update game statistics
userSchema.methods.updateGameStats = async function(betAmount, winAmount, won) {
  this.totalBets += 1;
  this.totalBetAmount += betAmount;
  
  if (won) {
    this.totalWins += 1;
    this.totalWinAmount += winAmount;
    if (winAmount > this.biggestWin) {
      this.biggestWin = winAmount;
    }
  }
  
  await this.save();
};

// Method to add session
userSchema.methods.addSession = function(sessionId, ipAddress, userAgent) {
  this.activeSessions.push({
    sessionId,
    ipAddress,
    userAgent,
    createdAt: new Date(),
    lastActivity: new Date()
  });
  
  // Keep only last 5 sessions
  if (this.activeSessions.length > 5) {
    this.activeSessions = this.activeSessions.slice(-5);
  }
};

// Method to remove session
userSchema.methods.removeSession = function(sessionId) {
  this.activeSessions = this.activeSessions.filter(
    session => session.sessionId !== sessionId
  );
};

// Method to get VIP benefits
userSchema.methods.getVIPBenefits = function() {
  const level = this.vipLevel;
  
  const benefits = {
    BRONZE: {
      cashbackRate: 0.01,
      dailyBonusMultiplier: 1,
      weeklyBonus: 0,
      monthlyBonus: 0,
      supportPriority: 'standard'
    },
    SILVER: {
      cashbackRate: 0.015,
      dailyBonusMultiplier: 1.2,
      weeklyBonus: 50,
      monthlyBonus: 0,
      supportPriority: 'standard'
    },
    GOLD: {
      cashbackRate: 0.02,
      dailyBonusMultiplier: 1.5,
      weeklyBonus: 100,
      monthlyBonus: 500,
      supportPriority: 'priority'
    },
    PLATINUM: {
      cashbackRate: 0.025,
      dailyBonusMultiplier: 2,
      weeklyBonus: 200,
      monthlyBonus: 1000,
      supportPriority: 'priority'
    },
    DIAMOND: {
      cashbackRate: 0.03,
      dailyBonusMultiplier: 3,
      weeklyBonus: 500,
      monthlyBonus: 2500,
      supportPriority: 'premium'
    }
  };
  
  return benefits[level] || benefits.BRONZE;
};

// Static method to find users by referral code
userSchema.statics.findByReferralCode = function(code) {
  return this.findOne({ referralCode: code });
};

// Static method to get top users by profit
userSchema.statics.getTopUsers = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ totalWinAmount: -1, totalWins: -1 })
    .limit(limit)
    .select('username totalWinAmount totalWins totalBets vipLevel');
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

// Pre-save middleware
userSchema.pre('save', async function(next) {
  // Hash password if modified
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  
  // Generate referral code if new user
  if (this.isNew && !this.referralCode) {
    this.referralCode = this.generateReferralCode();
  }
  
  next();
});

// Post-save middleware
userSchema.post('save', function(doc) {
  // Log important events
  if (doc.isModified('balance')) {
    console.log(`User ${doc.username} balance updated: $${doc.balance}`);
  }
});

module.exports = mongoose.model('User', userSchema);