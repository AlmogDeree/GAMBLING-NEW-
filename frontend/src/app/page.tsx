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
  Gift, Crown, TrendingUp, Users, Timer, Zap
} from 'lucide-react';

// Dynamic imports for better performance
const DailyBonus = dynamic(() => import('@/components/DailyBonus'), { ssr: false });
const VIPStatus = dynamic(() => import('@/components/VIPStatus'), { ssr: false });
const Leaderboard = dynamic(() => import('@/components/Leaderboard'), { ssr: false });
const GameAnimation = dynamic(() => import('@/components/GameAnimation'), { ssr: false });

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
  const [language, setLanguage] = useState('he');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [hotNumbers, setHotNumbers] = useState<number[]>([]);
  const [coldNumbers, setColdNumbers] = useState<number[]>([]);
  
  const router = useRouter();
  const audioRefs = useRef({
    spin: null as HTMLAudioElement | null,
    win: null as HTMLAudioElement | null,
    lose: null as HTMLAudioElement | null,
    coin: null as HTMLAudioElement | null
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
      
      // Load sounds (with error handling)
      try {
        audioRefs.current = {
          spin: new Audio('/sounds/spin.mp3'),
          win: new Audio('/sounds/win.mp3'),
          lose: new Audio('/sounds/lose.mp3'),
          coin: new Audio('/sounds/coin.mp3')
        };
      } catch (error) {
        console.log('Sound loading failed, continuing without sounds');
        setSoundEnabled(false);
      }
    } catch (error) {
      router.push('/login');
    }
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
      console.error('Error fetching wins:', error);
    }
  };

  // Fetch hot and cold numbers
  const fetchHotColdNumbers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/number-stats?range=${range}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        setHotNumbers(response.data.hot || []);
        setColdNumbers(response.data.cold || []);
      }
    } catch (error) {
      console.error('Error fetching number stats:', error);
    }
  };

  // Play sound
  const playSound = (soundName: keyof typeof audioRefs.current) => {
    if (soundEnabled && audioRefs.current[soundName]) {
      audioRefs.current[soundName]!.play().catch(e => {
        console.log('Sound play failed:', e);
        // Ignore sound errors
      });
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

  // Play game
  const playGame = async () => {
    if (!user || betAmount > user.balance || betAmount < 1) return;
    
    setIsPlaying(true);
    setGameResult(null);
    playSound('spin');
    
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
      
      // Animate result reveal
      setTimeout(() => {
        setGameResult(result);
        setUser({...user, balance: result.newBalance});
        
        if (result.won) {
          playSound('win');
          setShowWinAnimation(true);
          setShowConfetti(true);
          toast.success(
            <div>
              <div className="font-bold">WIN! +${result.winAmount}</div>
              {result.vipLevel !== 'BRONZE' && (
                <div className="text-sm">{result.vipLevel} VIP Bonus Applied!</div>
              )}
            </div>,
            { duration: 5000 }
          );
          
          setTimeout(() => {
            setShowWinAnimation(false);
            setShowConfetti(false);
          }, 5000);
        } else {
          playSound('lose');
          if (result.cashbackAmount > 0) {
            toast(`Cashback: +${result.cashbackAmount}`, {
              icon: '💰',
              duration: 3000
            });
          }
        }

        fetchRecentWins();
        fetchUserData();
        fetchHotColdNumbers();
      }, 2000);
      
    } catch (error: any) {
      console.error('Game error:', error);
      toast.error(error.response?.data?.message || 'Game error');
      setIsPlaying(false);
    }
  };

  const resetGame = () => {
    setGameResult(null);
    setIsPlaying(false);
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

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const t = {
    he: {
      title: 'המר על מספר',
      selectNumber: 'בחר מספר',
      range: 'טווח',
      attempts: 'ניסיונות',
      betAmount: 'סכום הימור',
      play: 'המר',
      balance: 'יתרה',
      winChance: 'סיכוי לזכייה',
      payoutRatio: 'יחס תשלום',
      potentialWin: 'זכייה אפשרית',
      win: 'ניצחת!',
      lose: 'לא הפעם',
      yourNumber: 'המספר שלך',
      systemNumbers: 'המספרים שנבחרו',
      tryAgain: 'נסה שוב',
      spinning: 'מסובב...',
      hotNumbers: 'מספרים חמים',
      coldNumbers: 'מספרים קרים',
      recentWins: 'זכיות אחרונות',
      leaderboard: 'טבלת מובילים',
      logout: 'התנתק'
    },
    en: {
      title: 'Bet on Number',
      selectNumber: 'Select Number',
      range: 'Range',
      attempts: 'Attempts',
      betAmount: 'Bet Amount',
      play: 'Bet',
      balance: 'Balance',
      winChance: 'Win Chance',
      payoutRatio: 'Payout Ratio',
      potentialWin: 'Potential Win',
      win: 'You Won!',
      lose: 'Not This Time',
      yourNumber: 'Your Number',
      systemNumbers: 'System Numbers',
      tryAgain: 'Try Again',
      spinning: 'Spinning...',
      hotNumbers: 'Hot Numbers',
      coldNumbers: 'Cold Numbers',
      recentWins: 'Recent Wins',
      leaderboard: 'Leaderboard',
      logout: 'Logout'
    }
  }[language] || {};

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <Toaster position="top-center" />
      {showConfetti && <Confetti />}
      
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 text-yellow-400 text-2xl"
              >
                🎯
              </motion.div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                {t.title}
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Quick Stats */}
              <div className="hidden md:flex items-center gap-3">
                <div className="bg-green-600/20 border border-green-400 rounded-lg px-3 py-2">
                  <div className="text-xs text-green-300">{t.balance}</div>
                  <div className="text-lg font-bold text-green-400">${user.balance}</div>
                </div>
                
                <div className="bg-purple-600/20 border border-purple-400 rounded-lg px-3 py-2">
                  <Crown className="w-4 h-4 text-purple-400 mb-1" />
                  <div className="text-xs font-bold text-purple-400">{user.vipLevel}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSound}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </button>
                
                <button
                  onClick={toggleLanguage}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Globe size={20} />
                </button>
                
                <button
                  onClick={() => setShowLeaderboard(!showLeaderboard)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Trophy size={20} />
                </button>
                
                <button
                  onClick={logout}
                  className="text-sm bg-red-600/20 border border-red-400 rounded-lg px-3 py-2 hover:bg-red-600/30 transition-all"
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
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
            >
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
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
                        className={`
                          relative aspect-square rounded-lg font-bold text-sm md:text-base
                          transition-all duration-200
                          ${selectedNumber === num 
                            ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-black shadow-lg shadow-yellow-500/30' 
                            : 'bg-black/40 hover:bg-black/60 border border-white/20'}
                          ${isHot ? 'ring-2 ring-red-400' : ''}
                          ${isCold ? 'ring-2 ring-blue-400' : ''}
                        `}
                      >
                        {num}
                        {isHot && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        )}
                        {isCold && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Game Settings */}
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    {t.range} (1-?)
                  </label>
                  <select 
                    value={range} 
                    onChange={(e) => {
                      setRange(Number(e.target.value));
                      fetchHotColdNumbers();
                    }}
                    className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-yellow-400 focus:outline-none"
                  >
                    <option value="10">1-10</option>
                    <option value="20">1-20</option>
                    <option value="50">1-50</option>
                    <option value="100">1-100</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    {t.attempts}
                  </label>
                  <select 
                    value={attempts} 
                    onChange={(e) => setAttempts(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-yellow-400 focus:outline-none"
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="5">5</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    {t.betAmount} ($)
                  </label>
                  <input 
                    type="number" 
                    value={betAmount} 
                    onChange={(e) => setBetAmount(Number(e.target.value))}
                    min="1" 
                    max={user.balance}
                    className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-yellow-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick Bet Buttons */}
              <div className="grid grid-cols-5 gap-2 mb-6">
                {[10, 25, 50, 100, 500].map(amount => (
                  <motion.button
                    key={amount}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setBetAmount(Math.min(amount, user.balance))}
                    disabled={amount > user.balance}
                    className={`
                      py-2 rounded-lg font-bold text-sm transition-all
                      ${betAmount === amount 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' 
                        : 'bg-black/40 hover:bg-black/60 border border-white/20'}
                      ${amount > user.balance ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    ${amount}
                  </motion.button>
                ))}
              </div>

              {/* Play Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={playGame}
                disabled={isPlaying || betAmount > user.balance || betAmount < 1}
                className={`
                  w-full py-4 rounded-2xl font-bold text-xl transition-all
                  ${isPlaying || betAmount > user.balance
                    ? 'bg-gray-600 cursor-not-allowed opacity-50'
                    : 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black shadow-lg shadow-yellow-500/30'}
                `}
              >
                {isPlaying ? t.spinning : `${t.play} ${betAmount}`}
              </motion.button>
            </motion.div>

            {/* Statistics Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
            >
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Statistics
              </h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-500/20 rounded-lg border border-blue-400/30">
                  <div className="text-2xl font-bold text-blue-400">
                    {(probability * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-300">{t.winChance}</div>
                </div>
                
                <div className="text-center p-4 bg-yellow-500/20 rounded-lg border border-yellow-400/30">
                  <div className="text-2xl font-bold text-yellow-400">
                    ×{payoutRatio.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-300">{t.payoutRatio}</div>
                </div>
                
                <div className="text-center p-4 bg-green-500/20 rounded-lg border border-green-400/30">
                  <div className="text-2xl font-bold text-green-400">
                    ${potentialWin}
                  </div>
                  <div className="text-sm text-gray-300">{t.potentialWin}</div>
                </div>
              </div>

              {/* Hot/Cold Numbers */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="bg-red-500/10 rounded-lg p-3 border border-red-400/30">
                  <div className="text-sm font-bold text-red-400 mb-2">{t.hotNumbers}</div>
                  <div className="flex gap-2 flex-wrap">
                    {hotNumbers.slice(0, 5).map(num => (
                      <span key={num} className="bg-red-500/20 px-2 py-1 rounded text-xs">
                        {num}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-400/30">
                  <div className="text-sm font-bold text-blue-400 mb-2">{t.coldNumbers}</div>
                  <div className="flex gap-2 flex-wrap">
                    {coldNumbers.slice(0, 5).map(num => (
                      <span key={num} className="bg-blue-500/20 px-2 py-1 rounded text-xs">
                        {num}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Recent Wins */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
            >
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                {t.recentWins}
              </h3>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {recentWins.map((win: any, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-green-500/10 border border-green-400/30 rounded-lg p-3 flex justify-between items-center"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-green-400">🎉</span>
                      <span className="font-bold">{win.user}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-400">+${win.win}</div>
                      <div className="text-xs text-gray-400">{win.time}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Daily Bonus */}
            <DailyBonus user={user} onClaim={fetchUserData} />
            
            {/* VIP Status */}
            <VIPStatus user={user} />
            
            {/* Quick Links */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg font-bold mb-4">Quick Links</h3>
              <div className="space-y-2">
                <button
                  onClick={() => router.push('/history')}
                  className="w-full flex items-center gap-3 p-3 bg-black/30 rounded-lg hover:bg-black/50 transition-colors"
                >
                  <History className="w-5 h-5" />
                  <span>Betting History</span>
                </button>
                
                <button
                  onClick={() => router.push('/profile')}
                  className="w-full flex items-center gap-3 p-3 bg-black/30 rounded-lg hover:bg-black/50 transition-colors"
                >
                  <User className="w-5 h-5" />
                  <span>Profile & Achievements</span>
                </button>
                
                {user.isAdmin && (
                  <button
                    onClick={() => router.push('/admin')}
                    className="w-full flex items-center gap-3 p-3 bg-black/30 rounded-lg hover:bg-black/50 transition-colors"
                  >
                    <Crown className="w-5 h-5" />
                    <span>Admin Panel</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Game Animation Overlay */}
      <AnimatePresence>
        {isPlaying && !gameResult && (
          <GameAnimation
            systemNumbers={[]}
            selectedNumber={selectedNumber}
            attempts={attempts}
          />
        )}
      </AnimatePresence>

      {/* Game Result Modal */}
      <AnimatePresence>
        {gameResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={resetGame}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`
                bg-gradient-to-br p-8 rounded-3xl max-w-md w-full
                ${gameResult.won 
                  ? 'from-green-600 to-emerald-700 border-2 border-green-400' 
                  : 'from-red-600 to-rose-700 border-2 border-red-400'}
              `}
            >
              <div className="text-center">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="text-6xl mb-4"
                >
                  {gameResult.won ? '🎉' : '😔'}
                </motion.div>
                
                <h2 className="text-3xl font-bold mb-4">
                  {gameResult.won ? t.win : t.lose}
                </h2>
                
                <div className="mb-6">
                  <div className="text-lg mb-2">{t.systemNumbers}:</div>
                  <div className="flex justify-center gap-3">
                    {gameResult.systemNumbers.map((num: number, idx: number) => (
                      <motion.div
                        key={idx}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`
                          w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold
                          ${num === selectedNumber 
                            ? 'bg-white text-black' 
                            : 'bg-black/30 text-white/70'}
                        `}
                      >
                        {num}
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                <div className="text-sm mb-4">
                  {t.yourNumber}: <span className="font-bold text-yellow-300">{selectedNumber}</span>
                </div>
                
                {gameResult.won && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-3xl font-bold text-yellow-300 mb-4"
                  >
                    +${gameResult.winAmount}
                  </motion.div>
                )}
                
                {gameResult.cashbackAmount > 0 && (
                  <div className="text-sm text-yellow-300 mb-4">
                    VIP Cashback: +${gameResult.cashbackAmount}
                  </div>
                )}
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resetGame}
                  className="bg-white/20 hover:bg-white/30 px-8 py-3 rounded-xl font-bold transition-all"
                >
                  {t.tryAgain}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <Leaderboard onClose={() => setShowLeaderboard(false)} />
      )}
    </div>
  );
}