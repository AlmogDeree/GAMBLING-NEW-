import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Star, TrendingUp, Gift } from 'lucide-react';

interface VIPStatusProps {
  user: any;
}

const VIPLevels = {
  BRONZE: { 
    name: 'Bronze', 
    minBets: 0, 
    cashback: 0.01, 
    color: 'from-orange-600 to-orange-800',
    icon: '🥉',
    benefits: ['1% Cashback', 'Basic Support']
  },
  SILVER: { 
    name: 'Silver', 
    minBets: 100, 
    cashback: 0.02, 
    color: 'from-gray-400 to-gray-600',
    icon: '🥈',
    benefits: ['2% Cashback', '1.2x Daily Bonus', 'Priority Support']
  },
  GOLD: { 
    name: 'Gold', 
    minBets: 500, 
    cashback: 0.03, 
    color: 'from-yellow-400 to-yellow-600',
    icon: '🥇',
    benefits: ['3% Cashback', '1.5x Daily Bonus', 'VIP Events']
  },
  PLATINUM: { 
    name: 'Platinum', 
    minBets: 1000, 
    cashback: 0.05, 
    color: 'from-purple-400 to-purple-600',
    icon: '💎',
    benefits: ['5% Cashback', '2x Daily Bonus', 'Personal Manager']
  },
  DIAMOND: { 
    name: 'Diamond', 
    minBets: 5000, 
    cashback: 0.1, 
    color: 'from-blue-400 to-cyan-600',
    icon: '💠',
    benefits: ['10% Cashback', '3x Daily Bonus', 'Exclusive Tournaments', 'VIP Rewards']
  }
};

const VIPStatus: React.FC<VIPStatusProps> = ({ user }) => {
  const currentLevel = user.vipLevel || 'BRONZE';
  const currentLevelData = VIPLevels[currentLevel as keyof typeof VIPLevels];
  
  // Find next level
  const levels = Object.keys(VIPLevels);
  const currentIndex = levels.indexOf(currentLevel);
  const nextLevel = currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
  const nextLevelData = nextLevel ? VIPLevels[nextLevel as keyof typeof VIPLevels] : null;
  
  // Calculate progress
  const progress = nextLevelData 
    ? ((user.totalBets - currentLevelData.minBets) / (nextLevelData.minBets - currentLevelData.minBets)) * 100
    : 100;
  
  const betsUntilNext = nextLevelData ? nextLevelData.minBets - user.totalBets : 0;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="bg-gradient-to-br from-black/40 to-purple-900/40 backdrop-blur-sm rounded-2xl p-6 border border-purple-400/30"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Crown className="w-5 h-5 text-purple-400" />
          VIP Status
        </h3>
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className={`px-4 py-2 rounded-full bg-gradient-to-r ${currentLevelData.color} font-bold flex items-center gap-2`}
        >
          <span className="text-xl">{currentLevelData.icon}</span>
          <span>{currentLevelData.name}</span>
        </motion.div>
      </div>

      {/* Progress to Next Level */}
      {nextLevel && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Progress to {nextLevelData?.name}</span>
            <span className="text-purple-400">{Math.round(progress)}%</span>
          </div>
          <div className="bg-black/40 rounded-full h-3 overflow-hidden mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 1 }}
              className="h-full bg-gradient-to-r from-purple-400 to-pink-500"
            />
          </div>
          <div className="text-xs text-gray-400 text-center">
            {betsUntilNext} more bets to {nextLevelData?.name}
          </div>
        </div>
      )}

      {/* Current Benefits */}
      <div className="bg-black/30 rounded-lg p-4 mb-4">
        <div className="text-sm font-bold mb-2 flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-400" />
          Your Benefits
        </div>
        <div className="space-y-1">
          {currentLevelData.benefits.map((benefit, idx) => (
            <div key={idx} className="text-sm flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>{benefit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-black/30 rounded-lg p-3">
          <div className="text-xs text-gray-400">Total Bets</div>
          <div className="text-lg font-bold">{user.totalBets}</div>
        </div>
        <div className="bg-black/30 rounded-lg p-3">
          <div className="text-xs text-gray-400">Cashback Rate</div>
          <div className="text-lg font-bold text-green-400">
            {(currentLevelData.cashback * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Next Level Preview */}
      {nextLevelData && (
        <div className="mt-4 p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-400/20">
          <div className="text-xs font-bold mb-1">Next Level Rewards:</div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{nextLevelData.icon}</span>
              <span className="text-sm font-bold">{nextLevelData.name}</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-green-400">
                {(nextLevelData.cashback * 100).toFixed(0)}% Cashback
              </div>
              <div className="text-xs text-gray-400">
                +{nextLevelData.benefits.length - currentLevelData.benefits.length} new benefits
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default VIPStatus;