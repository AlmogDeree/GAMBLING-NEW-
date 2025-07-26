'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [achievements, setAchievements] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const userObj = JSON.parse(userData);
    setUser(userObj);
    setNewUsername(userObj.username);
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // קבלת נתוני משתמש
      const userResponse = await axios.get('http://localhost:5000/api/user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // קבלת הימורים
      const betsResponse = await axios.get('http://localhost:5000/api/bets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUser(userResponse.data);
      setBets(betsResponse.data);
      calculateAchievements(betsResponse.data, userResponse.data);
      
    } catch (error) {
      console.error('שגיאה בקבלת נתונים:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAchievements = (betsData: any[], userData: any) => {
    const achievements = [];
    const totalBets = betsData.length;
    const totalWins = betsData.filter(bet => bet.won).length;
    const winStreak = calculateWinStreak(betsData);
    const biggestWin = Math.max(...betsData.map(bet => bet.winAmount || 0));

    // הישגים שונים
    if (totalBets >= 1) achievements.push({ 
      name: 'הימור ראשון', 
      icon: '🎯', 
      description: 'ביצעת את ההימור הראשון!',
      earned: true 
    });

    if (totalBets >= 10) achievements.push({ 
      name: 'מהמר קבוע', 
      icon: '🎲', 
      description: 'ביצעת 10 הימורים',
      earned: true 
    });

    if (totalBets >= 50) achievements.push({ 
      name: 'מהמר ותיק', 
      icon: '🏅', 
      description: 'ביצעת 50 הימורים',
      earned: totalBets >= 50 
    });

    if (totalWins >= 1) achievements.push({ 
      name: 'זוכה ראשון', 
      icon: '🏆', 
      description: 'זכית בהימור הראשון!',
      earned: true 
    });

    if (winStreak >= 3) achievements.push({ 
      name: 'רצף זכיות', 
      icon: '🔥', 
      description: 'רצף של 3 זכיות ברצף',
      earned: true 
    });

    if (biggestWin >= 100) achievements.push({ 
      name: 'זכייה גדולה', 
      icon: '💎', 
      description: 'זכית ביותר מ-$100 בהימור אחד',
      earned: true 
    });

    // הישגים עתידיים
    achievements.push({ 
      name: 'מאסטר', 
      icon: '👑', 
      description: 'בצע 100 הימורים',
      earned: totalBets >= 100 
    });

    achievements.push({ 
      name: 'מיליונר', 
      icon: '💰', 
      description: 'הגע ליתרה של $10,000',
      earned: userData.balance >= 10000 
    });

    setAchievements(achievements);
  };

  const calculateWinStreak = (betsData: any[]) => {
    let maxStreak = 0;
    let currentStreak = 0;
    
    for (let i = betsData.length - 1; i >= 0; i--) {
      if (betsData[i].won) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    
    return maxStreak;
  };

  const calculateLevel = () => {
    const totalBets = bets.length;
    const level = Math.floor(totalBets / 10) + 1;
    const nextLevelBets = (level * 10) - totalBets;
    return { level, nextLevelBets };
  };

  const calculateStats = () => {
    const totalBets = bets.length;
    const wins = bets.filter((bet: any) => bet.won);
    const totalWins = wins.length;
    const totalWinAmount = wins.reduce((sum: number, bet: any) => sum + bet.winAmount, 0);
    const totalBetAmount = bets.reduce((sum: number, bet: any) => sum + bet.betAmount, 0);
    const winRate = totalBets > 0 ? (totalWins / totalBets) * 100 : 0;
    const profit = totalWinAmount - totalBetAmount;

    return {
      totalBets,
      totalWins,
      totalWinAmount,
      totalBetAmount,
      winRate,
      profit
    };
  };

  const goHome = () => router.push('/');
  const goHistory = () => router.push('/history');
  
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">טוען פרופיל...</div>
      </div>
    );
  }

  const stats = calculateStats();
  const { level, nextLevelBets } = calculateLevel();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button 
                onClick={goHome}
                className="flex items-center gap-2 hover:text-yellow-400 transition-colors"
              >
                <div className="w-8 h-8 text-yellow-400 text-2xl">🎯</div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  המר על מספר
                </h1>
              </button>
              <div className="text-gray-300">/ פרופיל</div>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={goHistory}
                className="bg-purple-600/20 border border-purple-400 rounded-lg px-3 py-2 hover:bg-purple-600/30 transition-all text-sm"
              >
                📊 היסטוריה
              </button>
              
              <div className="bg-green-600/20 border border-green-400 rounded-lg px-4 py-2">
                <div className="text-sm text-green-300">יתרה</div>
                <div className="text-xl font-bold text-green-400">${user.balance}</div>
              </div>
              
              <button 
                onClick={logout}
                className="bg-red-600/20 border border-red-400 rounded-lg px-3 py-2 hover:bg-red-600/30 transition-all text-sm"
              >
                התנתק
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* Profile Header */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-4xl font-bold text-black">
                {user.username.charAt(0).toUpperCase()}
              </div>
              
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl font-bold">{user.username}</h2>
                  <div className="bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-bold">
                    רמה {level}
                  </div>
                </div>
                <div className="text-gray-300 mb-2">חבר מאז: {new Date(user.createdAt).toLocaleDateString('he-IL')}</div>
                <div className="text-sm text-blue-300">
                  {nextLevelBets > 0 ? `עוד ${nextLevelBets} הימורים לרמה הבאה` : 'רמה מקסימלית!'}
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl mb-2">🎯</div>
              <div className="text-sm text-gray-300">מהמר מקצועי</div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Statistics */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 text-blue-400 text-xl">📊</div>
              <h3 className="text-xl font-bold">סטטיסטיקות</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg">
                <span>סה״כ הימורים</span>
                <span className="font-bold text-blue-400">{stats.totalBets}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg">
                <span>זכיות</span>
                <span className="font-bold text-green-400">{stats.totalWins}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg">
                <span>אחוז זכיות</span>
                <span className="font-bold text-yellow-400">{stats.winRate.toFixed(1)}%</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg">
                <span>סה״כ הושקע</span>
                <span className="font-bold text-red-400">${stats.totalBetAmount}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg">
                <span>סה״כ זכיות</span>
                <span className="font-bold text-green-400">${stats.totalWinAmount}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg border-2 border-yellow-400/30">
                <span className="font-bold">רווח/הפסד נקי</span>
                <span className={`font-bold text-xl ${stats.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stats.profit >= 0 ? '+' : ''}${stats.profit}
                </span>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 text-yellow-400 text-xl">🏆</div>
              <h3 className="text-xl font-bold">הישגים</h3>
            </div>
            
            <div className="space-y-3">
              {achievements.map((achievement, index) => (
                <div 
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    achievement.earned 
                      ? 'bg-yellow-400/10 border-yellow-400/30' 
                      : 'bg-gray-600/10 border-gray-600/30 opacity-50'
                  }`}
                >
                  <div className="text-2xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <div className="font-medium">{achievement.name}</div>
                    <div className="text-sm text-gray-300">{achievement.description}</div>
                  </div>
                  {achievement.earned && (
                    <div className="text-yellow-400">✅</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Level Progress */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mt-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 text-purple-400 text-xl">⭐</div>
            <h3 className="text-xl font-bold">התקדמות ברמות</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>רמה נוכחית: {level}</span>
              <span>רמה הבאה: {level + 1}</span>
            </div>
            
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-purple-400 to-pink-400 h-3 rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min(100, ((stats.totalBets % 10) / 10) * 100)}%` 
                }}
              ></div>
            </div>
            
            <div className="text-sm text-gray-300 text-center">
              {nextLevelBets > 0 
                ? `עוד ${nextLevelBets} הימורים לרמה ${level + 1}` 
                : 'הגעת לרמה המקסימלית!'}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex justify-center gap-4 mt-8">
          <button 
            onClick={goHome}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold py-3 px-8 rounded-xl transition-all"
          >
            חזור למשחק
          </button>
          
          <button 
            onClick={goHistory}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-xl transition-all"
          >
            היסטוריה מפורטת
          </button>
        </div>

      </div>
    </div>
  );
}