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
  }
}, {
  timestamps: true
});

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ totalBets: -1 });
userSchema.index({ createdAt: -1 });

// Method to update statistics
userSchema.methods.updateStats = function(won, winAmount = 0) {
  this.totalBets += 1;
  if (won) {
    this.totalWins += 1;
    this.totalWinAmount += winAmount;
  }
  return this.save();
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

// Helper method to check if user has achievement
userSchema.methods.hasAchievement = function(achievementName) {
  return this.achievements.some(a => a.name === achievementName);
};

// Method to update login streak
userSchema.methods.updateLoginStreak = function() {
  const now = new Date();
  const lastLogin = this.loginStreak.lastLoginDate;
  
  if (!lastLogin) {
    this.loginStreak.count = 1;
  } else {
    const daysSinceLastLogin = Math.floor((now - lastLogin) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLastLogin === 1) {
      // Consecutive day
      this.loginStreak.count += 1;
    } else if (daysSinceLastLogin > 1) {
      // Streak broken
      this.loginStreak.count = 1;
    }
    // If same day, don't update count
  }
  
  this.loginStreak.lastLoginDate = now;
  return this.save();
};

module.exports = mongoose.model('User', userSchema);