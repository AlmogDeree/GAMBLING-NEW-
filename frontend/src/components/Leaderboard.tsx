import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Trophy, Crown, Medal, X, TrendingUp } from 'lucide-react';

interface LeaderboardProps {
  onClose: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ onClose }) => {
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'alltime'>('weekly');
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [period]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/leaderboard?period=${period}`);
      setLeaders(response.data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-orange-600" />;
      default:
        return <span className="text-lg font-bold">#{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-600/20 to-yellow-400/20 border-yellow-400/50';
      case 2:
        return 'from-gray-600/20 to-gray-400/20 border-gray-400/50';
      case 3:
        return 'from-orange-600/20 to-orange-400/20 border-orange-400/50';
      default:
        return 'from-purple-600/10 to-blue-600/10 border-purple-400/30';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-purple-900/90 to-blue-900/90 backdrop-blur-md rounded-3xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden border border-white/20"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="w-8 h-8 text-yellow-400" />
              Leaderboard
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Period Selector */}
          <div className="flex gap-2 mb-6">
            {(['weekly', 'monthly', 'alltime'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`
                  px-4 py-2 rounded-lg font-bold capitalize transition-all
                  ${period === p 
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black' 
                    : 'bg-white/10 hover:bg-white/20'}
                `}
              >
                {p === 'alltime' ? 'All Time' : p}
              </button>
            ))}
          </div>

          {/* Leaders List */}
          <div className="space-y-3 overflow-y-auto max-h-[50vh]">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
                <p className="mt-4 text-gray-400">Loading rankings...</p>
              </div>
            ) : leaders.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No data available for this period
              </div>
            ) : (
              leaders.map((leader, idx) => (
                <motion.div
                  key={leader._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`
                    relative bg-gradient-to-r ${getRankColor(idx + 1)} 
                    rounded-xl p-4 border backdrop-blur-sm
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className="w-12 flex justify-center">
                        {getRankIcon(idx + 1)}
                      </div>
                      
                      {/* User Info */}
                      <div>
                        <div className="font-bold text-lg flex items-center gap-2">
                          {leader.username}***
                          {leader.vipLevel !== 'BRONZE' && (
                            <span className={`
                              text-xs px-2 py-1 rounded-full font-bold
                              ${leader.vipLevel === 'DIAMOND' ? 'bg-cyan-500/20 text-cyan-400' :
                                leader.vipLevel === 'PLATINUM' ? 'bg-purple-500/20 text-purple-400' :
                                leader.vipLevel === 'GOLD' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-gray-500/20 text-gray-400'}
                            `}>
                              {leader.vipLevel}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-400">
                          {leader.totalWins} wins
                        </div>
                      </div>
                    </div>
                    
                    {/* Stats */}
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-green-400 font-bold text-lg">
                        <TrendingUp className="w-5 h-5" />
                        <span>+${leader.totalProfit}</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Biggest: ${leader.biggestWin}
                      </div>
                    </div>
                  </div>

                  {/* Special effects for top 3 */}
                  {idx < 3 && (
                    <motion.div
                      animate={{
                        scale: [1, 1.02, 1],
                        opacity: [0.3, 0.5, 0.3]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-orange-400/10 rounded-xl blur-xl"
                    />
                  )}
                </motion.div>
              ))
            )}
          </div>

          {/* Footer Info */}
          <div className="mt-6 text-center text-sm text-gray-400">
            Rankings update every hour
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Leaderboard;