'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import Confetti from 'react-confetti';
import dynamic from 'next/dynamic';
import { 
  Home, History, Trophy, User, Volume2, VolumeX, Globe,
  Gift, Crown, TrendingUp, Users, Timer, Zap, Copy, Share2
} from 'lucide-react';

// Import translations
import { translations, Language } from '@/translations';

// Dynamic imports for better performance
const DailyBonus = dynamic(() => import('@/components/DailyBonus'), { ssr: false });
const VIPStatus = dynamic(() => import('@/components/VIPStatus'), { ssr: false });
const Leaderboard = dynamic(() => import('@/components/Leaderboard'), { ssr: false });
const GameAnimation = dynamic(() => import('@/components/GameAnimation'), { ssr: false });
const ReferralPanel = dynamic(() => import('@/components/ReferralPanel'), { ssr: false });

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [selectedNumber, setSelectedNumber] = useState(5);
  const [range, setRange] = useState(10);
  const [attempts, setAttempts] = useState(3);
  const [betAmount, setBetAmount] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameResult, setGameResult] = useState<any>(null);
  const [showWinAnimation, setShowWinAnimation] = useState(false);
  const [recentWins, setRecentWins] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [language, setLanguage] = useState<Language>('he');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [hotNumbers, setHotNumbers] = useState<number[]>([]);
  const [coldNumbers, setColdNumbers] = useState<number[]>([]);
  const [showReferralPanel, setShowReferralPanel] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownValue, setCountdownValue] = useState(3);
  const [currentWinChance, setCurrentWinChance] = useState(0);
  
  const router = useRouter();
  const t = translations[language];
  const audioRefs = useRef({
    spin: null as HTMLAudioElement | null,
    win: null as HTMLAudioElement | null,
    lose: null as HTMLAudioElement | null,
    coin: null as HTMLAudioElement | null,
    nearMiss: null as HTMLAudioElement | null
  });

  // Initialize
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setLanguage(parsedUser.preferences?.language || 'he');
      setSoundEnabled(parsedUser.preferences?.soundEnabled !== false);
      
      // Set document direction
      document.dir = language === 'he' ? 'rtl' : 'ltr';
      
      fetchUserData();
      fetchRecentWins();
      fetchHotColdNumbers();
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/login');
    }

    // Initialize audio
    audioRefs.current = {
      spin: new Audio('/sounds/spin.mp3'),
      win: new Audio('/sounds/win.mp3'),
      lose: new Audio('/sounds/lose.mp3'),
      coin: new Audio('/sounds/coin.mp3'),
      nearMiss: new Audio('/sounds/near-miss.mp3')
    };

    // Socket connection
    const socket = require('socket.io-client')('http://localhost:5000');
    
    socket.on('connect', () => {
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUserData = JSON.parse(userData);
        socket.emit('authenticate', parsedUserData.id);
      }
    });

    socket.on('big-win', (data: any) => {
      toast.success(`${data.username} ${t.win} $${data.amount}!`, {
        icon: '🎉',
        duration: 5000
      });
    });

    socket.on('referral-earning', (data: any) => {
      toast.success(
        <div>
          <div className="font-bold">{t.referralBonus}!</div>
          <div>+${data.amount} from {data.fromUser}</div>
        </div>,
        { duration: 5000 }
      );
      fetchUserData();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Fetch user data
  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // Fetch recent wins
  const fetchRecentWins = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/recent-wins');
      setRecentWins(response.data);
    } catch (error) {
      console.error('Error fetching recent wins:', error);
    }
  };

  // Fetch hot and cold numbers
  const fetchHotColdNumbers = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/number-stats?range=${range}`);
      setHotNumbers(response.data.hot);
      setColdNumbers(response.data.cold);
    } catch (error) {
      console.error('Error fetching number stats:', error);
    }
  };

  // Play sound
  const playSound = (soundName: keyof typeof audioRefs.current) => {
    if (soundEnabled && audioRefs.current[soundName]) {
      audioRefs.current[soundName]?.play().catch(e => console.log('Sound play failed:', e));
    }
  };

  // Calculate probability and payout
  const calculateProbability = () => {
    return 1 - Math.pow(1 - (1 / range), attempts);
  };

  const calculatePayout = () => {
    const probability = calculateProbability();
    const houseEdge = 0.8;
    return (1 / probability) * houseEdge;
  };

  const probability = calculateProbability();
  const payoutRatio = calculatePayout();
  const potentialWin = Math.round(betAmount * payoutRatio);

  // Enhanced play game with countdown
  const playGame = async () => {
    if (!user || betAmount > user.balance || betAmount < 1) return;
    
    setIsPlaying(true);
    setGameResult(null);
    setShowCountdown(true);
    setCountdownValue(3);
    setCurrentWinChance(0);
    
    playSound('spin');
    
    // Countdown animation
    const countdownInterval = setInterval(() => {
      setCountdownValue(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setShowCountdown(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Animate win chance
    const winChanceInterval = setInterval(() => {
      setCurrentWinChance(prev => {
        const newValue = prev + Math.random() * 20 - 10;
        return Math.max(0, Math.min(100, newValue));
      });
    }, 100);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/bet', {
        selectedNumber,
        range,
        attempts,
        betAmount
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const result = response.data;
      
      // Stop animations after 3 seconds
      setTimeout(() => {
        clearInterval(winChanceInterval);
        setShowCountdown(false);
        setGameResult(result);
        setUser({...user, balance: result.newBalance});
        
        if (result.won) {
          playSound('win');
          setShowWinAnimation(true);
          setShowConfetti(true);
          
          const message = result.vipLevel !== 'BRONZE' 
            ? `WIN! +$${result.winAmount} (${result.vipLevel} VIP Bonus!)`
            : `WIN! +$${result.winAmount}`;
          
          toast.success(message, { duration: 5000 });
          
          setTimeout(() => {
            setShowWinAnimation(false);
            setShowConfetti(false);
          }, 5000);
        } else {
          // Check for near miss
          if (result.nearMissLevel > 0) {
            playSound('nearMiss');
            const nearMissMessages = [
              '',
              t.almostWon,
              t.soClose,
              t.oneNumberAway
            ];
            
            toast.error(
              <div>
                <div className="font-bold">{nearMissMessages[result.nearMissLevel]}</div>
                <div className="text-sm">{t.tryAgain}</div>
              </div>,
              { icon: '😫', duration: 3000 }
            );
          } else {
            playSound('lose');
          }
          
          if (result.cashbackAmount > 0) {
            toast(`${t.cashback}: +$${result.cashbackAmount}`, {
              icon: '💰',
              duration: 3000
            });
          }
        }

        // Show achievements
        if (result.newAchievements && result.newAchievements.length > 0) {
          result.newAchievements.forEach((achievement: any) => {
            toast.success(`Achievement Unlocked: ${achievement.name}`, {
              icon: '🏆',
              duration: 4000
            });
          });
        }

        fetchRecentWins();
        fetchUserData();
        fetchHotColdNumbers();
      }, 3000);
      
    } catch (error: any) {
      console.error('Game error:', error);
      toast.error(error.response?.data?.message || t.error);
      setIsPlaying(false);
      setShowCountdown(false);
      clearInterval(countdownInterval);
      clearInterval(winChanceInterval);
    }
  };

  const resetGame = () => {
    setGameResult(null);
    setIsPlaying(false);
    setShowCountdown(false);
  };

  const toggleLanguage = () => {
    const newLang = language === 'he' ? 'en' : 'he';
    setLanguage(newLang);
    document.dir = newLang === 'he' ? 'rtl' : 'ltr';
    localStorage.setItem('language', newLang);
    
    // Update user preferences
    updateUserPreferences({ language: newLang });
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    updateUserPreferences({ soundEnabled: !soundEnabled });
  };

  const updateUserPreferences = async (preferences: any) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch('http://localhost:5000/api/user/preferences', preferences, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  const copyReferralCode = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      toast.success(t.referralCodeCopied);
    }
  };

  const shareReferralCode = () => {
    if (user?.referralCode) {
      const shareUrl = `${window.location.origin}/register?ref=${user.referralCode}`;
      const shareText = `Join me on Bet on Number! Use my referral code: ${user.referralCode}`;
      
      if (navigator.share) {
        navigator.share({
          title: 'Bet on Number',
          text: shareText,
          url: shareUrl
        });
      } else {
        navigator.clipboard.writeText(shareUrl);
        toast.success('Share link copied!');
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-900">
      <Toaster position="top-center" />
      {showConfetti && <Confetti recycle={false} numberOfPieces={200} />}
      
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-purple-500/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              {t.title}
            </h1>
            
            <div className="flex items-center gap-4">
              {/* Language Toggle with Flags */}
              <button
                onClick={toggleLanguage}
                className="p-2 rounded-lg bg-purple-800/60 hover:bg-purple-700/70 transition-colors border border-purple-400/50"
                title={language === 'he' ? 'Switch to English' : 'החלף לעברית'}
              >
                {language === 'he' ? '🇬🇧' : '🇮🇱'}
              </button>
              
              {/* Sound Toggle */}
              <button
                onClick={toggleSound}
                className="p-2 rounded-lg bg-purple-800/60 hover:bg-purple-700/70 transition-colors border border-purple-400/50"
              >
                {soundEnabled ? <Volume2 size={20} className="text-white" /> : <VolumeX size={20} className="text-white" />}
              </button>
              
              {/* Balance */}
              <div className="bg-green-600/20 border border-green-400 rounded-lg px-4 py-2">
                <div className="text-sm text-green-300">{t.balance}</div>
                <div className="text-xl font-bold text-green-400">${user?.balance || 0}</div>
              </div>
              
              {/* User Menu */}
              <div className="bg-blue-600/20 border border-blue-400 rounded-lg px-4 py-2">
                <div className="text-sm text-blue-300">{t.hello} {user?.username}</div>
                <button 
                  onClick={logout}
                  className="text-xs text-red-300 hover:text-red-400"
                >
                  {t.logout}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Main Game Area */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Game Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/50"
            >
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                <Zap className="w-6 h-6 text-yellow-400" />
                {t.selectNumber}
              </h2>

              {/* Number Selection Grid */}
              <div className="mb-6">
                <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                  {[...Array(range)].map((_, i) => {
                    const num = i + 1;
                    const isHot = hotNumbers.includes(num);
                    const isCold = coldNumbers.includes(num);
                    
                    return (
                      <motion.button
                        key={num}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedNumber(num)}
                        disabled={isPlaying}
                        className={`
                          relative aspect-square rounded-lg font-bold text-sm md:text-base
                          transition-all duration-200
                          ${selectedNumber === num 
                            ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-black shadow-lg shadow-yellow-500/30' 
                            : 'bg-purple-800/60 hover:bg-purple-700/70 border border-purple-400/50 text-white'}
                          ${isHot ? 'ring-2 ring-red-400' : ''}
                          ${isCold ? 'ring-2 ring-blue-400' : ''}
                          ${isPlaying ? 'cursor-not-allowed opacity-50' : ''}
                        `}
                      >
                        {num}
                        {isHot && (
                          <span className="absolute -top-1 -right-1 text-xs">🔥</span>
                        )}
                        {isCold && (
                          <span className="absolute -top-1 -right-1 text-xs">❄️</span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Game Settings */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-200">
                    {t.range}
                  </label>
                  <select
                    value={range}
                    onChange={(e) => {
                      setRange(parseInt(e.target.value));
                      fetchHotColdNumbers();
                    }}
                    disabled={isPlaying}
                    className="w-full px-3 py-2 bg-purple-800/60 border border-purple-400 rounded-lg text-white focus:border-yellow-400"
                  >
                    <option value="10">1-10</option>
                    <option value="20">1-20</option>
                    <option value="50">1-50</option>
                    <option value="100">1-100</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-200">
                    {t.attempts}
                  </label>
                  <select
                    value={attempts}
                    onChange={(e) => setAttempts(parseInt(e.target.value))}
                    disabled={isPlaying}
                    className="w-full px-3 py-2 bg-black/50 border border-purple-500 rounded-lg text-white"
                  >
                    <option value="1">1</option>
                    <option value="3">3</option>
                    <option value="5">5</option>
                    <option value="10">10</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-200">
                    {t.betAmount}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={user?.balance || 0}
                    value={betAmount}
                    onChange={(e) => setBetAmount(parseInt(e.target.value) || 0)}
                    disabled={isPlaying}
                    className="w-full px-3 py-2 bg-black/50 border border-purple-500 rounded-lg text-white"
                  />
                </div>
              </div>

              {/* Bet Amount Quick Select */}
              <div className="grid grid-cols-5 gap-2 mb-6">
                {[10, 25, 50, 100, 250].map(amount => (
                  <motion.button
                    key={amount}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setBetAmount(amount)}
                    disabled={isPlaying || amount > user?.balance}
                    className={`
                      py-2 rounded-lg font-semibold transition-all
                      ${betAmount === amount 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg' 
                        : 'bg-purple-800/60 hover:bg-purple-700/70 border border-purple-400/50 text-white'}
                      ${amount > user?.balance ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    ${amount}
                  </motion.button>
                ))}
              </div>

              {/* Stats Display */}
              <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                <div className="bg-blue-800/50 rounded-lg p-3 border border-blue-400/70">
                  <div className="text-2xl font-bold text-blue-300">
                    {(probability * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-200">{t.winChance}</div>
                </div>
                
                <div className="bg-yellow-800/50 rounded-lg p-3 border border-yellow-400/70">
                  <div className="text-2xl font-bold text-yellow-300">
                    x{payoutRatio.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-200">{t.payoutRatio}</div>
                </div>
                
                <div className="bg-green-800/50 rounded-lg p-3 border border-green-400/70">
                  <div className="text-2xl font-bold text-green-300">
                    ${potentialWin}
                  </div>
                  <div className="text-sm text-gray-200">{t.potentialWin}</div>
                </div>
              </div>

              {/* Countdown Display */}
              <AnimatePresence>
                {showCountdown && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="mb-6 text-center"
                  >
                    <motion.div
                      key={countdownValue}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-6xl font-bold text-yellow-400 mb-2"
                    >
                      {countdownValue}
                    </motion.div>
                    <div className="text-purple-100">{t.countingDown}</div>
                    <div className="mt-2">
                      <div className="text-sm text-gray-200">{t.currentWinChance}</div>
                      <div className="w-full bg-black/50 rounded-full h-2 mt-1">
                        <motion.div
                          animate={{ width: `${currentWinChance}%` }}
                          className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Play Button or Result */}
              {!gameResult ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={playGame}
                  disabled={isPlaying || betAmount > user?.balance || betAmount < 1}
                  className={`
                    w-full py-4 rounded-2xl font-bold text-xl transition-all
                    ${isPlaying || betAmount > user?.balance || betAmount < 1
                      ? 'bg-gray-600 cursor-not-allowed opacity-50'
                      : 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black shadow-lg shadow-yellow-500/30'}
                  `}
                >
                  {isPlaying ? t.spinning : `${t.play} $${betAmount}`}
                </motion.button>
              ) : (
                /* Game Result */
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center"
                >
                  <div className={`text-5xl font-bold mb-4 ${
                    gameResult.won ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {gameResult.won ? t.win : t.lose}
                  </div>
                  
                  {gameResult.nearMissLevel > 0 && !gameResult.won && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="text-3xl mb-4 text-yellow-400"
                    >
                      {gameResult.nearMissLevel === 3 ? t.oneNumberAway :
                       gameResult.nearMissLevel === 2 ? t.soClose :
                       t.almostWon}
                    </motion.div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-purple-900/70 rounded-lg p-4">
                      <div className="text-sm text-gray-200">{t.yourNumber}</div>
                      <div className="text-3xl font-bold text-yellow-400">
                        {selectedNumber}
                      </div>
                    </div>
                    
                    <div className="bg-purple-900/70 rounded-lg p-4">
                      <div className="text-sm text-gray-200">{t.systemNumbers}</div>
                      <div className="text-2xl font-bold text-blue-300">
                        {gameResult.systemNumbers.join(', ')}
                      </div>
                    </div>
                  </div>
                  
                  {gameResult.won && (
                    <div className="text-4xl font-bold text-green-400 mb-4">
                      +${gameResult.winAmount}
                    </div>
                  )}
                  
                  {gameResult.cashbackAmount > 0 && (
                    <div className="text-xl text-yellow-400 mb-4">
                      {t.cashback}: +${gameResult.cashbackAmount}
                    </div>
                  )}
                  
                  <button
                    onClick={resetGame}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-8 rounded-lg transition-all"
                  >
                    {t.tryAgain}
                  </button>
                </motion.div>
              )}
            </motion.div>

            {/* Navigation Buttons */}
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => router.push('/history')}
                className="bg-purple-800/60 backdrop-blur-sm border border-purple-400/50 rounded-xl p-4 hover:bg-purple-700/70 transition-colors flex items-center justify-center gap-2 text-white"
              >
                <History size={20} />
                <span>{t.bettingHistory}</span>
              </button>
              
              <button
                onClick={() => setShowLeaderboard(!showLeaderboard)}
                className="bg-yellow-800/60 backdrop-blur-sm border border-yellow-400/50 rounded-xl p-4 hover:bg-yellow-700/70 transition-colors flex items-center justify-center gap-2 text-white"
              >
                <Trophy size={20} />
                <span>{t.leaderboard}</span>
              </button>
              
              <button
                onClick={() => setShowReferralPanel(!showReferralPanel)}
                className="bg-green-800/60 backdrop-blur-sm border border-green-400/50 rounded-xl p-4 hover:bg-green-700/70 transition-colors flex items-center justify-center gap-2 text-white"
              >
                <Users size={20} />
                <span>{t.referralProgram}</span>
              </button>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            
            {/* VIP Status */}
            {user && <VIPStatus user={user} />}
            
            {/* Daily Bonus */}
            {user && <DailyBonus user={user} onClaim={fetchUserData} />}
            
            {/* Recent Wins */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-black/60 backdrop-blur-sm rounded-2xl p-6 border border-green-400/50"
            >
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                <Zap className="w-5 h-5 text-green-400" />
                {t.recentWins}
              </h3>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {recentWins.map((win: any, index) => (
                  <motion.div
                    key={index}
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-purple-900/60 rounded-lg p-3 flex justify-between items-center"
                  >
                    <div>
                      <div className="font-semibold text-white">{win.user}</div>
                      <div className="text-xs text-gray-300">{win.time}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-bold">+${win.win}</div>
                      <div className="text-xs text-gray-300">${win.bet} bet</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Quick Referral */}
            {user?.referralCode && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-black/60 backdrop-blur-sm rounded-2xl p-6 border border-purple-400/50"
              >
                <h3 className="text-lg font-bold mb-3 text-white">{t.yourReferralCode}</h3>
                <div className="bg-purple-900/60 rounded-lg p-3 mb-3 flex items-center justify-between">
                  <span className="font-mono text-lg text-yellow-400">{user.referralCode}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={copyReferralCode}
                      className="p-2 bg-purple-700/60 hover:bg-purple-600/70 rounded-lg transition-colors"
                      title={t.copyCode}
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={shareReferralCode}
                      className="p-2 bg-purple-700/60 hover:bg-purple-600/70 rounded-lg transition-colors"
                      title={t.share}
                    >
                      <Share2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-purple-200">
                  Earn 15% commission on every bet!
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Modals */}
        <AnimatePresence>
          {showLeaderboard && (
            <Leaderboard onClose={() => setShowLeaderboard(false)} />
          )}
          
          {showReferralPanel && user && (
            <ReferralPanel 
              user={user} 
              onClose={() => setShowReferralPanel(false)} 
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}