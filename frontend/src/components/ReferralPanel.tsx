import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { X, Copy, Share2, Users, DollarSign, TrendingUp, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { translations } from '@/translations';

interface ReferralPanelProps {
  user: any;
  onClose: () => void;
}

const ReferralPanel: React.FC<ReferralPanelProps> = ({ user, onClose }) => {
  const [referralStats, setReferralStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const language = (user.preferences?.language || 'he') as Language;
  const t = translations[language];

  useEffect(() => {
    fetchReferralStats();
  }, []);

  const fetchReferralStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/referral/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReferralStats(response.data);
    } catch (error) {
      console.error('Error fetching referral stats:', error);
      toast.error(t.error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(user.referralCode);
    toast.success(t.referralCodeCopied);
  };

  const shareReferral = () => {
    const shareUrl = `${window.location.origin}/register?ref=${user.referralCode}`;
    const shareText = `Join me on Bet on Number! Use my referral code: ${user.referralCode} and get $1000 welcome bonus!`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Bet on Number Referral',
        text: shareText,
        url: shareUrl
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied to clipboard!');
    }
  };

  return (
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
        className="bg-gradient-to-br from-purple-900/90 to-black/90 rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto border-2 border-purple-500/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            {t.referralProgram}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-xl">{t.loading}</div>
          </div>
        ) : (
          <>
            {/* Referral Code Section */}
            <div className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-2xl p-6 mb-8 border border-purple-400/30">
              <h3 className="text-xl font-bold mb-4">{t.yourReferralCode}</h3>
              <div className="bg-black/50 rounded-xl p-4 flex items-center justify-between mb-4">
                <span className="text-2xl font-mono font-bold text-yellow-400">
                  {user.referralCode}
                </span>
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={copyReferralCode}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-semibold transition-colors"
                  >
                    <Copy size={20} />
                    {t.copy}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={shareReferral}
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black px-6 py-3 rounded-lg flex items-center gap-2 font-semibold transition-colors"
                  >
                    <Share2 size={20} />
                    {t.share}
                  </motion.button>
                </div>
              </div>
              
              <div className="text-purple-300">
                <p className="mb-2">📣 Earn 15% commission on every bet your referrals make!</p>
                <p className="text-gray-200">💰 Get paid instantly to your balance when they play!</p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-xl p-6 border border-green-400/30"
              >
                <div className="flex items-center justify-between mb-3">
                  <DollarSign className="w-8 h-8 text-green-400" />
                  <span className="text-xs text-green-300">Total</span>
                </div>
                <div className="text-3xl font-bold text-green-400">
                  ${referralStats?.totalEarnings || 0}
                </div>
                <div className="text-sm text-gray-300 mt-1">{t.referralEarnings}</div>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-xl p-6 border border-blue-400/30"
              >
                <div className="flex items-center justify-between mb-3">
                  <Users className="w-8 h-8 text-blue-400" />
                  <span className="text-xs text-blue-300">Total</span>
                </div>
                <div className="text-3xl font-bold text-blue-400">
                  {referralStats?.totalReferrals || 0}
                </div>
                <div className="text-sm text-gray-300 mt-1">{t.totalReferrals}</div>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 rounded-xl p-6 border border-yellow-400/30"
              >
                <div className="flex items-center justify-between mb-3">
                  <TrendingUp className="w-8 h-8 text-yellow-400" />
                  <span className="text-xs text-yellow-300">Active</span>
                </div>
                <div className="text-3xl font-bold text-yellow-400">
                  {referralStats?.activeReferrals || 0}
                </div>
                <div className="text-sm text-gray-300 mt-1">Active Players</div>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl p-6 border border-purple-400/30"
              >
                <div className="flex items-center justify-between mb-3">
                  <UserPlus className="w-8 h-8 text-purple-400" />
                  <span className="text-xs text-purple-300">Rate</span>
                </div>
                <div className="text-3xl font-bold text-purple-400">15%</div>
                <div className="text-sm text-gray-300 mt-1">Commission Rate</div>
              </motion.div>
            </div>

            {/* Referral List */}
            {referralStats?.referralList && referralStats.referralList.length > 0 && (
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold mb-4">Your Referrals</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {referralStats.referralList.map((referral: any, index: number) => (
                    <motion.div
                      key={index}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-black/30 rounded-lg p-4 flex justify-between items-center"
                    >
                      <div>
                        <div className="font-semibold text-lg">{referral.username}***</div>
                        <div className="text-sm text-gray-400">
                          Joined: {new Date(referral.joinDate).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-400">
                          Total Bets: {referral.totalBets}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-400">
                          ${referral.yourEarnings}
                        </div>
                        <div className="text-sm text-gray-200">Earned</div>
                        <div className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                          referral.status === 'active' 
                            ? 'bg-green-500/30 text-green-300' 
                            : 'bg-gray-500/30 text-gray-300'
                        }`}>
                          {referral.status}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* How it Works */}
            <div className="mt-8 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-2xl p-6 border border-purple-400/20">
              <h3 className="text-xl font-bold mb-4 text-white">How It Works</h3>
              <div className="space-y-3 text-gray-200">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">1️⃣</span>
                  <p>Share your unique referral code with friends</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">2️⃣</span>
                  <p>They sign up using your code and get $1000 welcome bonus</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">3️⃣</span>
                  <p>You earn 15% commission on every bet they make</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">4️⃣</span>
                  <p>Get paid instantly to your balance - withdraw anytime!</p>
                </div>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ReferralPanel;