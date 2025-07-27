const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  referred: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  referralCode: {
    type: String,
    required: true
  },
  
  status: {
    type: String,
    enum: ['pending', 'active', 'inactive'],
    default: 'active'
  },
  
  commissionRate: {
    type: Number,
    default: 0.15, // 15%
    min: 0,
    max: 1
  },
  
  totalEarnings: {
    type: Number,
    default: 0
  },
  
  lastEarningDate: {
    type: Date
  },
  
  // Tracking when referral becomes active (first bet)
  activatedAt: {
    type: Date
  },
  
  // Bonus for referrer when referred user reaches milestones
  milestoneRewards: [{
    milestone: String, // 'first_bet', 'first_win', '100_bets', etc.
    rewardAmount: Number,
    earnedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Indexes
referralSchema.index({ referrer: 1 });
referralSchema.index({ referred: 1 });
referralSchema.index({ referralCode: 1 });
referralSchema.index({ status: 1 });
referralSchema.index({ createdAt: -1 });

// Compound indexes
referralSchema.index({ referrer: 1, status: 1 });
referralSchema.index({ referrer: 1, createdAt: -1 });

// Virtual for days since last earning
referralSchema.virtual('daysSinceLastEarning').get(function() {
  if (!this.lastEarningDate) return null;
  return Math.floor((new Date() - this.lastEarningDate) / (1000 * 60 * 60 * 24));
});

// Method to calculate commission for a bet
referralSchema.methods.calculateCommission = function(betAmount) {
  return Math.round(betAmount * this.commissionRate);
};

// Method to add earning
referralSchema.methods.addEarning = async function(amount) {
  this.totalEarnings += amount;
  this.lastEarningDate = new Date();
  
  // Update referrer's balance
  const User = mongoose.model('User');
  const referrer = await User.findById(this.referrer);
  if (referrer) {
    referrer.balance += amount;
    referrer.referralEarnings = (referrer.referralEarnings || 0) + amount;
    await referrer.save();
  }
  
  await this.save();
  return this;
};

// Method to add milestone reward
referralSchema.methods.addMilestoneReward = async function(milestone, rewardAmount) {
  // Check if milestone already rewarded
  const existingReward = this.milestoneRewards.find(r => r.milestone === milestone);
  if (existingReward) return false;
  
  this.milestoneRewards.push({
    milestone,
    rewardAmount,
    earnedAt: new Date()
  });
  
  this.totalEarnings += rewardAmount;
  
  // Update referrer's balance
  const User = mongoose.model('User');
  const referrer = await User.findById(this.referrer);
  if (referrer) {
    referrer.balance += rewardAmount;
    referrer.referralEarnings = (referrer.referralEarnings || 0) + rewardAmount;
    await referrer.save();
  }
  
  await this.save();
  return true;
};

// Static method to get referral stats for user
referralSchema.statics.getReferralStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { referrer: mongoose.Types.ObjectId(userId), status: 'active' } },
    {
      $group: {
        _id: null,
        totalReferrals: { $sum: 1 },
        totalEarnings: { $sum: '$totalEarnings' },
        activeReferrals: {
          $sum: {
            $cond: [
              {
                $gte: [
                  '$lastEarningDate',
                  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                ]
              },
              1,
              0
            ]
          }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalReferrals: 0,
    totalEarnings: 0,
    activeReferrals: 0
  };
};

// Static method to get top referrers
referralSchema.statics.getTopReferrers = async function(limit = 10) {
  return this.aggregate([
    { $match: { status: 'active' } },
    {
      $group: {
        _id: '$referrer',
        totalEarnings: { $sum: '$totalEarnings' },
        totalReferrals: { $sum: 1 },
        avgEarningPerReferral: { $avg: '$totalEarnings' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        username: '$user.username',
        totalEarnings: 1,
        totalReferrals: 1,
        avgEarningPerReferral: 1
      }
    },
    { $sort: { totalEarnings: -1 } },
    { $limit: limit }
  ]);
};

module.exports = mongoose.model('Referral', referralSchema);