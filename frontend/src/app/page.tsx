'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [selectedNumber, setSelectedNumber] = useState(5);
  const [range, setRange] = useState(10);
  const [attempts, setAttempts] = useState(3);
  const [betAmount, setBetAmount] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameResult, setGameResult] = useState<any>(null);
  const [showWinAnimation, setShowWinAnimation] = useState(false);
  const [recentWins, setRecentWins] = useState([]);
  const [userBets, setUserBets] = useState([]);
  const router = useRouter();

  // בדיקת התחברות בטעינת הדף
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    try {
      setUser(JSON.parse(userData));
      fetchUserData();
      fetchRecentWins();
      fetchUserBets();
    } catch (error) {
      router.push('/login');
    }
  }, []);

  // קבלת נתוני המשתמש מהשרת
  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
    } catch (error) {
      console.error('שגיאה בקבלת נתוני משתמש:', error);
    }
  };

  // קבלת זכיות אחרונות
  const fetchRecentWins = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/recent-wins');
      setRecentWins(response.data);
    } catch (error) {
      console.error('שגיאה בקבלת זכיות:', error);
    }
  };

  // קבלת היסטוריית הימורים
  const fetchUserBets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/bets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserBets(response.data);
    } catch (error) {
      console.error('שגיאה בקבלת היסטוריה:', error);
    }
  };

  // חישוב הסיכויים והיחס
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

  // הפעלת המשחק עם הבקנד
  const playGame = async () => {
    if (!user || betAmount > user.balance) return;
    
    setIsPlaying(true);
    
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
      
      setGameResult(result);
      setUser({...user, balance: result.newBalance});
      
      if (result.won) {
        setShowWinAnimation(true);
        setTimeout(() => setShowWinAnimation(false), 3000);
      }

      // עדכון נתונים
      fetchRecentWins();
      fetchUserBets();
      
    } catch (error: any) {
      console.error('שגיאה במשחק:', error);
      alert(error.response?.data?.message || 'שגיאה במשחק');
    } finally {
      setIsPlaying(false);
    }
  };

  const resetGame = () => {
    setGameResult(null);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">טוען...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 text-yellow-400 text-2xl">🎯</div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                המר על מספר
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push('/profile')}
                className="bg-yellow-600/20 border border-yellow-400 rounded-lg px-4 py-2 hover:bg-yellow-600/30 transition-all"
              >
                <div className="text-sm text-yellow-300">👤</div>
                <div className="text-xs text-yellow-300">פרופיל</div>
              </button>
              
              <button 
                onClick={() => router.push('/history')}
                className="bg-purple-600/20 border border-purple-400 rounded-lg px-4 py-2 hover:bg-purple-600/30 transition-all"
              >
                <div className="text-sm text-purple-300">📊</div>
                <div className="text-xs text-purple-300">היסטוריה</div>
              </button>
              
              <div className="bg-green-600/20 border border-green-400 rounded-lg px-4 py-2">
                <div className="text-sm text-green-300">יתרה</div>
                <div className="text-xl font-bold text-green-400">${user.balance}</div>
              </div>
              
              <div className="bg-blue-600/20 border border-blue-400 rounded-lg px-4 py-2">
                <div className="text-sm text-blue-300">שלום {user.username}</div>
                <button 
                  onClick={logout}
                  className="text-xs text-red-300 hover:text-red-400"
                >
                  התנתק
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid md:grid-cols-3 gap-8">
          
          {/* עמודה שמאלית - הגדרות המשחק */}
          <div className="md:col-span-2 space-y-6">
            
            {/* כרטיס הגדרות */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-6 h-6 text-yellow-400 text-xl">⚡</div>
                <h2 className="text-xl font-bold">הגדרות המשחק</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    בחר מספר (1-{range})
                  </label>
                  <select 
                    value={selectedNumber} 
                    onChange={(e) => setSelectedNumber(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-yellow-400 focus:outline-none"
                  >
                    {Array.from({length: range}, (_, i) => (
                      <option key={i+1} value={i+1}>{i+1}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    טווח (1 עד...)
                  </label>
                  <select 
                    value={range} 
                    onChange={(e) => {
                      const newRange = Number(e.target.value);
                      setRange(newRange);
                      if (selectedNumber > newRange) setSelectedNumber(newRange);
                    }}
                    className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-yellow-400 focus:outline-none"
                  >
                    <option value={10}>1-10</option>
                    <option value={20}>1-20</option>
                    <option value={50}>1-50</option>
                    <option value={100}>1-100</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    מספר ניסיונות
                  </label>
                  <select 
                    value={attempts} 
                    onChange={(e) => setAttempts(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-yellow-400 focus:outline-none"
                  >
                    <option value={1}>1 ניסיון</option>
                    <option value={2}>2 ניסיונות</option>
                    <option value={3}>3 ניסיונות</option>
                    <option value={5}>5 ניסיונות</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    סכום הימור ($)
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
            </div>

            {/* כרטיס סטטיסטיקות */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 text-green-400 text-xl">📈</div>
                <h3 className="text-lg font-bold">חישוב הסיכויים</h3>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-500/20 rounded-lg border border-blue-400/30">
                  <div className="text-2xl font-bold text-blue-400">
                    {(probability * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-300">סיכוי לזכייה</div>
                </div>
                
                <div className="text-center p-4 bg-yellow-500/20 rounded-lg border border-yellow-400/30">
                  <div className="text-2xl font-bold text-yellow-400">
                    ×{payoutRatio.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-300">יחס תשלום</div>
                </div>
                
                <div className="text-center p-4 bg-green-500/20 rounded-lg border border-green-400/30">
                  <div className="text-2xl font-bold text-green-400">
                    ${potentialWin}
                  </div>
                  <div className="text-sm text-gray-300">זכייה אפשרית</div>
                </div>
              </div>
            </div>

            {/* כפתור המשחק */}
            <div className="text-center">
              {!gameResult ? (
                <button 
                  onClick={playGame}
                  disabled={isPlaying || betAmount > user.balance}
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold py-4 px-12 rounded-2xl text-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl"
                >
                  {isPlaying ? "מסובב..." : `המר $${betAmount}`}
                </button>
              ) : (
                <div className="space-y-4">
                  <div className={`p-6 rounded-2xl border-2 ${gameResult.won ? 'bg-green-500/20 border-green-400' : 'bg-red-500/20 border-red-400'}`}>
                    <div className="text-center">
                      <div className="text-lg mb-2">המספרים שנבחרו:</div>
                      <div className="flex justify-center gap-3 mb-4">
                        {gameResult.systemNumbers.map((num: number, idx: number) => (
                          <div key={idx} className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                            num === selectedNumber ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-300'
                          }`}>
                            {num}
                          </div>
                        ))}
                      </div>
                      <div className="text-sm mb-2">המספר שלך: <span className="font-bold text-yellow-400">{selectedNumber}</span></div>
                      <div className={`text-2xl font-bold ${gameResult.won ? 'text-green-400' : 'text-red-400'}`}>
                        {gameResult.won ? `ניצחת! זכית ב-$${gameResult.winAmount}` : "לא זכית הפעם"}
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={resetGame}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-xl transition-all"
                  >
                    משחק חדש
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* עמודה ימנית - זכיות אחרונות */}
          <div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 sticky top-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-6 h-6 text-yellow-400 text-xl">🏆</div>
                <h3 className="text-lg font-bold">זכיות אחרונות</h3>
              </div>
              
              <div className="space-y-4">
                {recentWins.map((win: any, idx) => (
                  <div key={idx} className="p-4 rounded-lg border bg-white/5 border-white/10">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium">{win.user}</div>
                      <div className="text-xs text-gray-400">{win.time}</div>
                    </div>
                    <div className="flex justify-between">
                      <div className="text-sm text-gray-300">הימור: ${win.bet}</div>
                      <div className="text-green-400 font-bold">${win.win}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* אנימציית זכייה */}
      {showWinAnimation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 pointer-events-none">
          <div className="text-center animate-pulse">
            <div className="text-8xl mb-4 animate-bounce">👑</div>
            <div className="text-6xl font-bold text-yellow-400 mb-4 animate-pulse">
              🎉 ניצחת! 🎉
            </div>
            <div className="text-3xl text-white">
              זכית ב-${gameResult?.winAmount}!
            </div>
            <div className="flex justify-center mt-6 space-x-2">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="text-2xl animate-spin" style={{animationDelay: `${i * 0.1}s`}}>✨</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}