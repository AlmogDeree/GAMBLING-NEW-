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
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // יוסיף createdAt ו updatedAt אוטומטית
});

// אינדקסים לביצועים טובים יותר
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

// מתודה לעדכון סטטיסטיקות המשתמש
userSchema.methods.updateStats = function(won, winAmount = 0) {
  this.totalBets += 1;
  if (won) {
    this.totalWins += 1;
    this.totalWinAmount += winAmount;
  }
  return this.save();
};

module.exports = mongoose.model('User', userSchema);