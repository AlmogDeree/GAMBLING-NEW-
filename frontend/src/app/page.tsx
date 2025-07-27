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
  Gift, Crown, TrendingUp, Users, Timer, Zap, Copy, Share2,
  Play, Settings, DollarSign, Minus, Plus, X, ChevronDown
} from 'lucide-react';

// Import translations
import { translations, Language, languageFlags, languageNames } from '@/translations';

// Dynamic imports for better performance
const DailyBonus = dynamic(() => import('@/components/DailyBonus'), { ssr: false });
const VIPStatus = dynamic(() => import('@/components/VIPStatus'), { ssr: false });
const Leaderboard = dynamic(() => import('@/components/Leaderboard'), { ssr: false });
const GameAnimation = dynamic(() => import('@/components/GameAnimation'), { ssr: false });
const ReferralPanel = dynamic(() => import('@/components/ReferralPanel'), { ssr: false });

interface GameResult {
  won: boolean;
  winAmount: number;
  cashbackAmount: number;
  systemNumbers: number[];
  selectedNumbers: number[];
  winningNumbers: number[];
  nearMissLevel: number;
  newBalance: number;
  vipLevel?: string;
  newAchievements?: any[];
}

interface User {
  _id: string;
  username: string;
  balance: number;
  vipLevel: string;
  totalBets: number;
  totalWins: number;
  isAdmin?: boolean;
  referralCode: string;
  preferences?: {
    language: Language;
  };
}

export default function HomePage() {
  // Core state
  const [user, setUser] = useState<User | null>(null);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [range, setRange] = useState(10);
  const [betAmount, setBetAmount] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  
  // UI state
  const [showWinAnimation, setShowWinAnimation] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [language, setLanguage] = useState<Language>('he');
  const [loading, setLoading] = useState(true);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  
  // Game data
  const [recentWins, setRecentWins] = useState([]);
  const [hotNumbers, setHotNumbers] = useState<number[]>([]);
  const [coldNumbers, setColdNumbers] = useState<number[]>([]);
  const [leaderboard, setLeaderboard] = useState([]);
  
  // Panel states
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showReferralPanel, setShowReferralPanel] = useState(false);
  const [showDailyBonus, setShowDailyBonus] = useState(false);
  const [showVIPStatus, setShowVIPStatus] = useState(false);
  
  // Countdown and animation
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [anticipationMultiplier, setAnticipationMultiplier] = useState(1.0);
  const [currentWinChance, setCurrentWinChance] = useState(0);
  
  const router = useRouter();
  const audioRefs = useRef<{[key: string]: HTMLAudioElement | null}>({});
  const countdownInterval = useRef<any>(null);
  const winChanceInterval = useRef<any>(null);

  // Language and translations
  const t = translations[language];

  // Initialize component
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    setLanguage(parsedUser.preferences?.language || 'he');
    document.dir = (parsedUser.preferences?.language || 'he') === 'he' || (parsedUser.preferences?.language || 'he') === 'ar' ? 'rtl' : 'ltr';
    
    // Initialize audio
    if (typeof window !== 'undefined') {
      audioRefs.current = {
        spin: new Audio('/sounds/spin.mp3'),
        win: new Audio('/sounds/win.mp3'),
        lose: new Audio('/sounds/lose.mp3'),
        click: new Audio('/sounds/click.mp3'),
        nearMiss: new Audio('/sounds/near-miss.mp3'),
        countdown: new Audio('/sounds/countdown.mp3')
      };
    }
    
    // Fetch initial data
    fetchUserData();
    fetchRecentWins();
    fetchHotColdNumbers();
    fetchLeaderboard();
    
    setLoading(false);
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
      setHotNumbers(response.data.hot.map((item: any) => item._id));
      setColdNumbers(response.data.cold.map((item: any) => item._id));
    } catch (error) {
      console.error('Error fetching number stats:', error);
    }
  };

  // Fetch leaderboard
  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/leaderboard');
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  // Play sound
  const playSound = (soundName: keyof typeof audioRefs.current) => {
    if (soundEnabled && audioRefs.current[soundName]) {
      audioRefs.current[soundName]?.play().catch(e => console.log('Sound play failed:', e));
    }
  };

  // Toggle number selection
  const toggleNumberSelection = (number: number) => {
    setSelectedNumbers(prev => {
      if (prev.includes(number)) {
        return prev.filter(n => n !== number);
      } else {
        return [...prev, number];
      }
    });
    playSound('click');
  };

  // Calculate probability and payout
  const calculateProbability = () => {
    if (selectedNumbers.length === 0) return 0;
    return selectedNumbers.length / range;
  };

  const calculatePayout = () => {
    const probability = calculateProbability();
    if (probability === 0) return 0;
    const houseEdge = 0.8;
    return (1 / probability) * houseEdge;
  };

  const probability = calculateProbability();
  const payoutRatio = calculatePayout();
  const potentialWin = Math.round(betAmount * payoutRatio);

  // Enhanced play game with countdown and new logic
  const playGame = async () => {
    if (!user || isPlaying || selectedNumbers.length === 0) return;
    
    if (user.balance < betAmount) {
      toast.error(t.insufficientBalance);
      return;
    }

    setIsPlaying(true);
    setShowCountdown(true);
    setCountdown(3);
    
    playSound('countdown');
    
    // Countdown animation
    countdownInterval.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval.current);
          setShowCountdown(false);
          startGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Dynamic win chance animation
    winChanceInterval.current = setInterval(() => {
      setAnticipationMultiplier(prev => {
        const newMultiplier = 1 + (Math.random() * 0.5);
        setCurrentWinChance(probability * newMultiplier * 100);
        return newMultiplier;
      });
    }, 100);
  };

  const startGame = async () => {
    try {
      clearInterval(winChanceInterval.current);
      playSound('spin');
      
      console.log('🎮 Starting game with:', { selectedNumbers, range, betAmount });
      
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/play', {
        selectedNumbers,
        range,
        betAmount
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('🎲 Game response:', response.data);

      // Simulate animation delay
      setTimeout(() => {
        const result = response.data;
        setGameResult(result);
        
        if (result.won) {
          playSound('win');
          setShowWinAnimation(true);
          setShowConfetti(true);
          
          const message = result.vipLevel 
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
              { icon: '🔥', duration: 3000 }
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
        setIsPlaying(false);
      }, 3000);
      
    } catch (error: any) {
      console.error('❌ Game error:', error);
      console.error('Error details:', error.response?.data);
      toast.error(error.response?.data?.message || 'Game error');
      setIsPlaying(false);
      setShowCountdown(false);
      clearInterval(countdownInterval.current);
      clearInterval(winChanceInterval.current);
    }
  };

  // Reset game for new round - COMBINED BUTTON
  const resetGame = () => {
    setGameResult(null);
    setSelectedNumbers([]);
    setIsPlaying(false);
    setShowCountdown(false);
    playSound('click');
  };

  // Language change
  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    document.dir = lang === 'he' || lang === 'ar' ? 'rtl' : 'ltr';
    setShowLanguageMenu(false);
    
    // Save preference
    if (user) {
      const updatedUser = { ...user, preferences: { ...user.preferences, language: lang } };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  // Language toggle - keep for backwards compatibility
  const toggleLanguage = () => {
    const newLang = language === 'he' ? 'en' : 'he';
    changeLanguage(newLang);
  };

  // Sound toggle
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    playSound('click');
  };

  // Copy referral code
  const copyReferralCode = () => {
    navigator.clipboard.writeText(user?.referralCode || '');
    toast.success(t.referralCodeCopied || 'Referral code copied!');
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-2xl">{t.loading}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white">
      <Toaster position="top-center" />
      
      {/* Confetti */}
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
        />
      )}

      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* Logo and Title */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center font-bold text-black text-xl">
                {user?.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{t.title}</h1>
                <div className="text-sm text-gray-300 flex items-center gap-2">
                  <Crown className="w-4 h-4 text-yellow-400" />
                  {user?.vipLevel || 'BRONZE'} VIP
                </div>
              </div>
            </div>
            
            {/* Controls */}
            <div className="flex items-center gap-4">
              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                  className="p-2 rounded-lg bg-gray-800/60 hover:bg-gray-700/70 transition-colors border border-gray-600 flex items-center gap-2"
                >
                  <span className="text-xl">{languageFlags[language]}</span>
                  <ChevronDown size={16} className={`transition-transform ${showLanguageMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Language Dropdown */}
                <AnimatePresence>
                  {showLanguageMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full mt-2 right-0 bg-gray-800 border border-gray-600 rounded-lg overflow-hidden shadow-xl z-50"
                    >
                      {Object.entries(languageNames).map(([code, name]) => (
                        <button
                          key={code}
                          onClick={() => changeLanguage(code as Language)}
                          className={`w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-700 transition-colors ${
                            language === code ? 'bg-gray-700' : ''
                          }`}
                        >
                          <span className="text-xl">{languageFlags[code as Language]}</span>
                          <span className="text-sm">{name}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
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
              
              {/* Admin Button - Fixed visibility */}
              {user?.isAdmin && (
                <button
                  onClick={() => router.push('/admin')}
                  className="admin-button bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors border border-red-400"
                >
                  {t.adminPanel}
                </button>
              )}
              
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

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Main Game Area */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Game Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
            >
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                <Zap className="w-6 h-6 text-yellow-400" />
                {t.selectNumber} (1-{range})
              </h2>

              {/* Number Selection Grid */}
              <div className="mb-6">
                <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                  {[...Array(range)].map((_, i) => {
                    const num = i + 1;
                    const isSelected = selectedNumbers.includes(num);
                    const isHot = hotNumbers.includes(num);
                    const isCold = coldNumbers.includes(num);
                    
                    return (
                      <motion.button
                        key={num}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleNumberSelection(num)}
                        disabled={isPlaying}
                        className={`
                          relative aspect-square rounded-lg font-bold text-sm md:text-base
                          transition-all duration-200
                          ${isSelected 
                            ? 'bg-yellow-400 text-black scale-110 shadow-lg border-2 border-yellow-300' 
                            : 'bg-gray-800/60 text-white hover:bg-gray-700/70'
                          }
                          ${isHot ? 'ring-2 ring-red-400' : ''}
                          ${isCold ? 'ring-2 ring-blue-400' : ''}
                          ${isPlaying ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                      >
                        {num}
                        {isHot && <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>}
                      </motion.button>
                    );
                  })}
                </div>
                <div className="text-sm text-gray-300 mt-2">
                  Selected: {selectedNumbers.length} numbers | {selectedNumbers.join(', ')}
                </div>
              </div>

              {/* Game Settings */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t.range}</label>
                  <select
                    value={range}
                    onChange={(e) => {
                      setRange(Number(e.target.value));
                      setSelectedNumbers([]);
                      fetchHotColdNumbers();
                    }}
                    disabled={isPlaying}
                    className="w-full bg-gray-800/60 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  >
                    <option value={10}>1-10</option>
                    <option value={20}>1-20</option>
                    <option value={50}>1-50</option>
                    <option value={100}>1-100</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t.betAmount}</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setBetAmount(Math.max(1, betAmount - 10))}
                      disabled={isPlaying}
                      className="p-2 bg-gray-800/60 border border-gray-600 rounded-lg hover:bg-gray-700/70 transition-colors text-white"
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(Math.max(1, Number(e.target.value)))}
                      disabled={isPlaying}
                      className="flex-1 bg-gray-800/60 border border-gray-600 rounded-lg px-3 py-2 text-center text-white"
                      min="1"
                    />
                    <button
                      onClick={() => setBetAmount(betAmount + 10)}
                      disabled={isPlaying}
                      className="p-2 bg-gray-800/60 border border-gray-600 rounded-lg hover:bg-gray-700/70 transition-colors text-white"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Game Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-purple-900/50 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-300">{t.winChance}</div>
                  <div className="text-lg font-bold text-purple-300">
                    {showCountdown ? `${currentWinChance.toFixed(1)}%` : `${(probability * 100).toFixed(1)}%`}
                  </div>
                </div>
                
                <div className="bg-blue-900/50 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-300">{t.payoutRatio}</div>
                  <div className="text-lg font-bold text-blue-300">
                    {showCountdown ? `${(payoutRatio * anticipationMultiplier).toFixed(2)}x` : `${payoutRatio.toFixed(2)}x`}
                  </div>
                </div>
                
                <div className="bg-green-900/50 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-300">{t.potentialWin}</div>
                  <div className="text-lg font-bold text-green-300">
                    ${showCountdown ? Math.round(potentialWin * anticipationMultiplier) : potentialWin}
                  </div>
                </div>
              </div>

              {/* Countdown Display */}
              <AnimatePresence>
                {showCountdown && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    className="text-center mb-6"
                  >
                    <div className="text-6xl font-bold text-yellow-400 mb-2">
                      {countdown}
                    </div>
                    <div className="text-lg text-gray-300">{t.countingDown}</div>
                    <div className="text-sm text-purple-300 mt-2">
                      {t.anticipationMultiplier}: {anticipationMultiplier.toFixed(2)}x
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Play Button */}
              <button
                onClick={playGame}
                disabled={isPlaying || selectedNumbers.length === 0 || (user?.balance || 0) < betAmount}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isPlaying ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    {showCountdown ? t.countingDown : t.spinning}
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Play size={20} />
                    {t.play} ${betAmount}
                  </div>
                )}
              </button>
            </motion.div>

            {/* Game Animation */}
            <AnimatePresence>
              {isPlaying && !showCountdown && (
                <GameAnimation 
                  systemNumbers={gameResult?.systemNumbers || []} 
                  selectedNumber={selectedNumbers[0] || 1} 
                  attempts={1}
                />
              )}
            </AnimatePresence>

            {/* Game Result */}
            <AnimatePresence>
              {gameResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
                >
                  <div className={`text-center text-6xl font-bold mb-4 ${
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
                      <div className="text-2xl font-bold text-yellow-400">
                        {selectedNumbers.join(', ')}
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
                  
                  {/* COMBINED BUTTON - Start New Game */}
                  <button
                    onClick={resetGame}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-8 rounded-lg transition-all"
                  >
                    {t.tryAgain}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

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
            <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-sm rounded-2xl p-6 border border-purple-400/30">
              <div className="flex items-center gap-3 mb-4">
                <Crown className="w-8 h-8 text-yellow-400" />
                <h3 className="text-xl font-bold text-white">{t.vipStatus}</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">{t.vipLevel}:</span>
                  <span className="font-bold text-yellow-400">{user?.vipLevel || 'BRONZE'}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">{t.totalBets}:</span>
                  <span className="font-bold text-white">{user?.totalBets || 0}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">{t.totalWins}:</span>
                  <span className="font-bold text-green-400">{user?.totalWins || 0}</span>
                </div>
              </div>
            </div>

            {/* Referral Program */}
            <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 backdrop-blur-sm rounded-2xl p-6 border border-green-400/30">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-8 h-8 text-green-400" />
                <h3 className="text-xl font-bold text-white">{t.referralProgram}</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-300 mb-2">{t.yourReferralCode}</div>
                  <div className="flex items-center gap-2">
                    <div className="referral-code-text flex-1 text-center bg-yellow-400 text-black font-bold py-2 px-4 rounded-lg">
                      {user?.referralCode}
                    </div>
                    <button
                      onClick={copyReferralCode}
                      className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-white"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="text-center text-sm text-green-300">
                  Earn 15% commission on every bet your referrals make!<br/>
                  Get paid instantly to your balance when they play!
                </div>
              </div>
            </div>

            {/* Hot & Cold Numbers */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp size={20} />
                Number Statistics
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-red-300 mb-2 flex items-center gap-2">
                    🔥 {t.hotNumbers}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {hotNumbers.slice(0, 5).map((num: number) => (
                      <span key={num} className="bg-red-600/20 text-red-300 px-2 py-1 rounded text-xs">
                        {num}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-blue-300 mb-2 flex items-center gap-2">
                    ❄️ {t.coldNumbers}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {coldNumbers.slice(0, 5).map((num: number) => (
                      <span key={num} className="bg-blue-600/20 text-blue-300 px-2 py-1 rounded text-xs">
                        {num}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Wins */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Trophy size={20} />
                {t.recentWins}
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {recentWins.slice(0, 10).map((win: any, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-white/10">
                    <div className="text-sm">
                      <span className="font-medium text-white">{win.username.substring(0, 4)}***</span>
                      <span className="text-gray-400 mx-2">won</span>
                      <span className="text-green-400 font-bold">${win.winAmount}</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(win.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Leaderboard Panel */}
            <AnimatePresence>
              {showLeaderboard && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">{t.leaderboard}</h3>
                    <button
                      onClick={() => setShowLeaderboard(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {leaderboard.slice(0, 10).map((player: any, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-white/10">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-yellow-500 text-black' :
                            index === 1 ? 'bg-gray-400 text-black' :
                            index === 2 ? 'bg-orange-600 text-white' :
                            'bg-gray-700 text-white'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-white">{player.username}</div>
                            <div className="text-xs text-gray-400">{player.vipLevel}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-green-400 font-bold">${player.totalProfit}</div>
                          <div className="text-xs text-gray-400">{player.totalWins} wins</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Referral Panel */}
            <AnimatePresence>
              {showReferralPanel && (
                <ReferralPanel 
                  user={user} 
                  onClose={() => setShowReferralPanel(false)} 
                />
              )}
            </AnimatePresence>

            {/* Daily Bonus Panel */}
            <AnimatePresence>
              {showDailyBonus && (
                <DailyBonus 
                  user={user} 
                  onClaim={() => {
                    fetchUserData();
                    setShowDailyBonus(false);
                  }} 
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}