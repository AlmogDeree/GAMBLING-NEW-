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
    enum: [10, 20, 50, 100]
  },
  attempts: {
    type: Number,
    required: true,
    enum: [1, 2, 3, 5]
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
    required: true
  },
  payoutRatio: {
    type: Number,
    required: true
  },
  gameType: {
    type: String,
    default: 'number-guess',
    enum: ['number-guess']
  },
  ipAddress: {
    type: String,
    default: null
  },
  vipLevel: {
    type: String,
    enum: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'],
    default: 'BRONZE'
  },
  cashbackAmount: {
    type: Number,
    default: 0
  },
  bonusUsed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better performance
betSchema.index({ userId: 1, createdAt: -1 });
betSchema.index({ won: 1, createdAt: -1 });
betSchema.index({ createdAt: -1 });
betSchema.index({ winAmount: -1 });

// Static method to get recent wins
betSchema.statics.getRecentWins = function(limit = 10) {
  return this.find({ won: true })
    .populate('userId', 'username')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get user statistics
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
        totalCashback: { $sum: '$cashbackAmount' },
        winRate: {
          $avg: {
            $cond: ['$won', 1, 0]
          }
        },
        biggestWin: { $max: '$winAmount' },
        averageBet: { $avg: '$betAmount' }
      }
    }
  ]);
};

// Static method to get hot and cold numbers
betSchema.statics.getNumberStats = function(range = 20, limit = 100) {
  return this.aggregate([
    { 
      $match: { 
        range: range,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      } 
    },
    { $unwind: '$systemNumbers' },
    {
      $group: {
        _id: '$systemNumbers',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);
};

// Method to calculate expected value
betSchema.methods.calculateExpectedValue = function() {
  const expectedWin = this.probability * this.winAmount;
  const expectedLoss = (1 - this.probability) * this.betAmount;
  return expectedWin - expectedLoss;
};

module.exports = mongoose.model('Bet', betSchema);