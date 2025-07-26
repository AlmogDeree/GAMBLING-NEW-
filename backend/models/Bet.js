const mongoose = require('mongoose');

const betSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  selectedNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  range: {
    type: Number,
    required: true,
    enum: [10, 20, 50, 100] // רק הערכים המותרים
  },
  attempts: {
    type: Number,
    required: true,
    enum: [1, 2, 3, 5] // רק הערכים המותרים
  },
  betAmount: {
    type: Number,
    required: true,
    min: 1
  },
  systemNumbers: [{
    type: Number,
    required: true
  }],
  won: {
    type: Boolean,
    required: true
  },
  winAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  probability: {
    type: Number,
    required: true // אחוז הסיכוי לזכייה
  },
  payoutRatio: {
    type: Number,
    required: true // היחס שחושב
  },
  gameType: {
    type: String,
    default: 'number-guess',
    enum: ['number-guess'] // בעתיד נוכל להוסיף סוגי משחקים
  },
  ipAddress: {
    type: String,
    default: null // לאבטחה
  }
}, {
  timestamps: true // יוסיף createdAt ו updatedAt אוטומטית
});

// אינדקסים לביצועים טובים יותר
betSchema.index({ userId: 1, createdAt: -1 });
betSchema.index({ won: 1, createdAt: -1 });
betSchema.index({ createdAt: -1 });

// מתודה סטטית לקבלת זכיות אחרונות
betSchema.statics.getRecentWins = function(limit = 10) {
  return this.find({ won: true })
    .populate('userId', 'username')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// מתודה סטטית לקבלת סטטיסטיקות משתמש
betSchema.statics.getUserStats = function(userId) {
  return this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalBets: { $sum: 1 },
        totalWins: { $sum: { $cond: ['$won', 1, 0] } },
        totalBetAmount: { $sum: '$betAmount' },
        totalWinAmount: { $sum: '$winAmount' },
        winRate: {
          $avg: {
            $cond: ['$won', 1, 0]
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Bet', betSchema);