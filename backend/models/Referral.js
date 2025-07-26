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
    required: true,
    unique: true
  },
  commissionRate: {
    type: Number,
    default: 0.15, // 15% default
    min: 0,
    max: 1
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  totalDeposits: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  lastEarningDate: Date,
  metadata: {
    registrationIp: String,
    userAgent: String
  }
}, {
  timestamps: true
});

// Indexes
referralSchema.index({ referrer: 1 });
referralSchema.index({ referred: 1 });
referralSchema.index({ referralCode: 1 });

module.exports = mongoose.model('Referral', referralSchema);