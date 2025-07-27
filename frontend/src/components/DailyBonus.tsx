import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Gift, Calendar, Zap } from 'lucide-react';

interface DailyBonusProps {
  user: any;
  onClaim: () => void;
}

const DailyBonus: React.FC<DailyBonusProps> = ({ user, onClaim }) => {
  const [canClaim, setCanClaim] = useState(false);
  const [streak, setStreak] = useState(0);
  const [timeUntilNext, setTimeUntilNext] = useState('');
  const [loading, setLoading] = useState(false);

  const bonusAmounts = [10, 20, 30, 50, 75, 100, 200];
  const vipMultipliers = {
    BRONZE: 1,
    SILVER: 1.2,
    GOLD: 1.5,
    PLATINUM: 2,
    DIAMOND: 3
  };

  useEffect(() => {
    checkBonusStatus();
    const interval = setInterval(checkBonusStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const checkBonusStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/daily-bonus/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCanClaim(response.data.canClaim);
      setStreak(response.data.streak);
      
      if (!response.data.canClaim && response.data.hoursUntilNext) {
        const hours = Math.floor(response.data.hoursUntilNext);
        const minutes = Math.floor((response.data.hoursUntilNext - hours) * 60);
        setTimeUntilNext(`${hours}h ${minutes}m`);
      }
    } catch (error) {
      console.error('Error checking bonus status:', error);
    }
  };

  const claimBonus = async () => {
    if (!canClaim || loading) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/claim-daily-bonus', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const { amount, streak: newStreak, vipMultiplier } = response.data;
        
        toast.success(
          <div>
            <div className="font-bold">Daily Bonus Claimed!</div>
            <div>+${amount} added to balance</div>
            {vipMultiplier > 1 && (
              <div className="text-sm">VIP {user.vipLevel} bonus: x{vipMultiplier}</div>
            )}
            <div className="text-sm">Streak: {newStreak} days</div>
          </div>,
          { duration: 5000 }
        );
        
        setCanClaim(false);
        setStreak(newStreak);
        onClaim(); // Refresh user data
        checkBonusStatus();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error claiming bonus');
    } finally {
      setLoading(false);
    }
  };

  const nextBonusAmount = bonusAmounts[Math.min(streak, 6)] * vipMultipliers[user.vipLevel as keyof typeof vipMultipliers];

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 backdrop-blur-sm rounded-2xl p-6 border border-yellow-400/30"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Gift className="w-5 h-5 text-yellow-400" />
          Daily Bonus
        </h3>
        <div className="flex items-center gap-1">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-bold">{streak} Day Streak</span>
        </div>
      </div>

      {/* Streak Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span>Streak Progress</span>
          <span>{streak}/7 days</span>
        </div>
        <div className="bg-black/40 rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((streak / 7) * 100, 100)}%` }}
            className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
          />
        </div>
      </div>

      {/* Bonus Preview */}
      <div className="bg-black/30 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm">Next Bonus:</span>
          <span className="font-bold text-yellow-400">${nextBonusAmount}</span>
        </div>
        {user.vipLevel !== 'BRONZE' && (
          <div className="text-xs text-yellow-300 mt-1">
            Includes {user.vipLevel} VIP multiplier
          </div>
        )}
      </div>

      {/* Claim Button */}
      <motion.button
        whileHover={canClaim ? { scale: 1.05 } : {}}
        whileTap={canClaim ? { scale: 0.95 } : {}}
        onClick={claimBonus}
        disabled={!canClaim || loading}
        className={`
          w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2
          ${canClaim 
            ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black shadow-lg shadow-yellow-500/30' 
            : 'bg-gray-700 text-gray-400 cursor-not-allowed'}
        `}
      >
        {loading ? (
          <span>Claiming...</span>
        ) : canClaim ? (
          <>
            <Gift className="w-5 h-5" />
            <span>Claim ${nextBonusAmount}</span>
          </>
        ) : (
          <>
            <Calendar className="w-5 h-5" />
            <span>Next in {timeUntilNext}</span>
          </>
        )}
      </motion.button>

      {/* Bonus Schedule */}
      <div className="mt-4 text-xs text-gray-400">
        <div className="font-bold mb-1">7-Day Bonus Schedule:</div>
        <div className="grid grid-cols-7 gap-1">
          {bonusAmounts.map((amount, idx) => (
            <div
              key={idx}
              className={`
                text-center p-1 rounded
                ${idx < streak 
                  ? 'bg-green-500/20 text-green-400' 
                  : idx === streak 
                    ? 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-400' 
                    : 'bg-black/20 text-gray-500'}
              `}
            >
              ${amount}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default DailyBonus;