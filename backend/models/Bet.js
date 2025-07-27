const mongoose = require('mongoose');

const betSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Changed from single number to array of numbers for multi-number betting
  selectedNumbers: [{
    type: Number,
    required: true
  }],
  
  // System generated numbers for the round
  systemNumbers: [{
    type: Number,
    required: true
  }],
  
  // Numbers that matched between selected and system
  winningNumbers: [{
    type: Number
  }],
  
  range: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  
  betAmount: {
    type: Number,
    required: true,
    min: 1
  },
  
  won: {
    type: Boolean,
    required: true,
    default: false
  },
  
  winAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  cashbackAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Near miss system (0 = no near miss, 1-3 = levels of near miss)
  nearMissLevel: {
    type: Number,
    default: 0,
    min: 0,
    max: 3
  },
  
  // Game metadata
  gameType: {
    type: String,
    default: 'multi_number',
    enum: ['single_number', 'multi_number']
  },
  
  // VIP level at time of bet (for historical tracking)
  vipLevelAtBet: {
    type: String,
    enum: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'],
    default: 'BRONZE'
  },
  
  // Additional game features
  multiplierApplied: {
    type: Number,
    default: 1.0
  },
  
  // Achievement progress tracking
  achievementProgress: [{
    achievementType: String,
    progress: Number,
    completed: { type: Boolean, default: false }
  }],
  
  // Session tracking
  sessionId: {
    type: String,
    default: () => Math.random().toString(36).substring(2, 15)
  },
  
  // IP tracking for security
  ipAddress: String,
  
  // User agent for analytics
  userAgent: String
}, {
  timestamps: true
});

// Indexes for better performance
betSchema.index({ userId: 1, createdAt: -1 });
betSchema.index({ won: 1, createdAt: -1 });
betSchema.index({ systemNumbers: 1 });
betSchema.index({ createdAt: -1 });
betSchema.index({ vipLevelAtBet: 1 });
betSchema.index({ gameType: 1 });
betSchema.index({ sessionId: 1 });

// Compound indexes for complex queries
betSchema.index({ userId: 1, won: 1, createdAt: -1 });
betSchema.index({ range: 1, createdAt: -1 });

// Virtual for net profit/loss calculation
betSchema.virtual('netResult').get(function() {
  return this.winAmount + this.cashbackAmount - this.betAmount;
});

// Virtual for win probability calculation
betSchema.virtual('winProbability').get(function() {
  return this.selectedNumbers.length / this.range;
});

// Virtual for payout ratio
betSchema.virtual('payoutRatio').get(function() {
  if (this.betAmount === 0) return 0;
  return this.winAmount / this.betAmount;
});

// Method to calculate win probability
betSchema.methods.calculateWinProbability = function() {
  return this.selectedNumbers.length / this.range;
};

// Method to check if bet was a near miss
betSchema.methods.isNearMiss = function() {
  return this.nearMissLevel > 0 && !this.won;
};

// Method to get near miss description
betSchema.methods.getNearMissDescription = function() {
  if (!this.isNearMiss()) return null;
  
  const descriptions = {
    1: 'Almost Won!',
    2: 'So Close!',
    3: 'One Number Away!'
  };
  
  return descriptions[this.nearMissLevel] || 'Near Miss!';
};

// Method to calculate expected value
betSchema.methods.getExpectedValue = function() {
  const probability = this.calculateWinProbability();
  const expectedWin = probability * this.winAmount;
  return expectedWin - this.betAmount;
};

// Static method to get hot numbers for a specific range
betSchema.statics.getHotNumbers = async function(range = 10, limit = 5, days = 30) {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.aggregate([
    { $match: { createdAt: { $gte: cutoffDate } } },
    { $unwind: '$systemNumbers' },
    { $match: { 'systemNumbers': { $lte: range } } },
    { $group: { _id: '$systemNumbers', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]);
};

// Static method to get cold numbers for a specific range
betSchema.statics.getColdNumbers = async function(range = 10, limit = 5, days = 30) {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.aggregate([
    { $match: { createdAt: { $gte: cutoffDate } } },
    { $unwind: '$systemNumbers' },
    { $match: { 'systemNumbers': { $lte: range } } },
    { $group: { _id: '$systemNumbers', count: { $sum: 1 } } },
    { $sort: { count: 1 } },
    { $limit: limit }
  ]);
};

// Static method to get comprehensive user statistics
betSchema.statics.getUserStats = async function(userId, days = null) {
  const ObjectId = mongoose.Types.ObjectId;
  const matchCondition = { userId: new ObjectId(userId) };
  
  if (days) {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    matchCondition.createdAt = { $gte: cutoffDate };
  }
  
  try {
    const stats = await this.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: null,
          totalBets: { $sum: 1 },
          totalWins: { $sum: { $cond: ['$won', 1, 0] } },
          totalBetAmount: { $sum: '$betAmount' },
          totalWinAmount: { $sum: '$winAmount' },
          totalCashback: { $sum: '$cashbackAmount' },
          biggestWin: { $max: '$winAmount' },
          averageBet: { $avg: '$betAmount' },
          nearMisses: { $sum: { $cond: [{ $gt: ['$nearMissLevel', 0] }, 1, 0] } },
          longestWinStreak: { $max: '$winStreak' },
          multiNumberBets: { $sum: { $cond: [{ $eq: ['$gameType', 'multi_number'] }, 1, 0] } }
        }
      }
    ]);
    
    const result = stats[0] || {
      totalBets: 0,
      totalWins: 0,
      totalBetAmount: 0,
      totalWinAmount: 0,
      totalCashback: 0,
      biggestWin: 0,
      averageBet: 0,
      nearMisses: 0,
      longestWinStreak: 0,
      multiNumberBets: 0
    };
    
    // Calculate additional metrics
    result.winRate = result.totalBets > 0 ? (result.totalWins / result.totalBets * 100).toFixed(2) : 0;
    result.netProfit = result.totalWinAmount + result.totalCashback - result.totalBetAmount;
    result.roi = result.totalBetAmount > 0 ? (result.netProfit / result.totalBetAmount * 100).toFixed(2) : 0;
    result.averageWin = result.totalWins > 0 ? (result.totalWinAmount / result.totalWins).toFixed(2) : 0;
    
    return result;
  } catch (error) {
    console.error('Error in getUserStats:', error);
    return {
      totalBets: 0,
      totalWins: 0,
      totalBetAmount: 0,
      totalWinAmount: 0,
      totalCashback: 0,
      biggestWin: 0,
      averageBet: 0,
      nearMisses: 0,
      longestWinStreak: 0,
      multiNumberBets: 0,
      winRate: 0,
      netProfit: 0,
      roi: 0,
      averageWin: 0
    };
  }
};

// Static method to get number frequency analysis
betSchema.statics.getNumberFrequencyAnalysis = async function(range = 10, days = 30) {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const analysis = await this.aggregate([
    { $match: { createdAt: { $gte: cutoffDate } } },
    { $unwind: '$systemNumbers' },
    { $match: { 'systemNumbers': { $lte: range } } },
    {
      $group: {
        _id: '$systemNumbers',
        frequency: { $sum: 1 },
        lastAppearance: { $max: '$createdAt' }
      }
    },
    {
      $project: {
        number: '$_id',
        frequency: 1,
        lastAppearance: 1,
        daysSinceLastAppearance: {
          $divide: [
            { $subtract: [new Date(), '$lastAppearance'] },
            1000 * 60 * 60 * 24
          ]
        }
      }
    },
    { $sort: { frequency: -1 } }
  ]);
  
  return analysis;
};

// Static method to get game trends
betSchema.statics.getGameTrends = async function(days = 7) {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.aggregate([
    { $match: { createdAt: { $gte: cutoffDate } } },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          hour: { $hour: "$createdAt" }
        },
        totalBets: { $sum: 1 },
        totalWins: { $sum: { $cond: ['$won', 1, 0] } },
        totalVolume: { $sum: '$betAmount' },
        averageBet: { $avg: '$betAmount' },
        uniqueUsers: { $addToSet: '$userId' }
      }
    },
    {
      $project: {
        date: '$_id.date',
        hour: '$_id.hour',
        totalBets: 1,
        totalWins: 1,
        winRate: { $multiply: [{ $divide: ['$totalWins', '$totalBets'] }, 100] },
        totalVolume: 1,
        averageBet: 1,
        uniqueUsers: { $size: '$uniqueUsers' }
      }
    },
    { $sort: { date: 1, hour: 1 } }
  ]);
};

// Pre-save middleware to calculate additional fields
betSchema.pre('save', function(next) {
  // Calculate winning numbers
  if (this.selectedNumbers && this.systemNumbers) {
    this.winningNumbers = this.selectedNumbers.filter(num => 
      this.systemNumbers.includes(num)
    );
  }
  
  // Set win status based on winning numbers
  this.won = this.winningNumbers && this.winningNumbers.length > 0;
  
  next();
});

// Post-save middleware for real-time updates
betSchema.post('save', function(doc) {
  // Emit real-time update if this is a win
  if (doc.won) {
    // Note: In a real application, you'd have access to the io instance here
    console.log(`New win: $${doc.winAmount} by user ${doc.userId}`);
  }
});

module.exports = mongoose.model('Bet', betSchema);