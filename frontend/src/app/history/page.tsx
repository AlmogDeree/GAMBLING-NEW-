'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function HistoryPage() {
  const [user, setUser] = useState<any>(null);
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBets: 0,
    totalWins: 0,
    totalWinAmount: 0,
    totalBetAmount: 0,
    winRate: 0
  });
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchUserBets();
  }, []);

  const fetchUserBets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/bets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setBets(response.data);
      calculateStats(response.data);
    } catch (error) {
      console.error('שגיאה בקבלת היסטוריה:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (betsData: any[]) => {
    const totalBets = betsData.length;
    const wins = betsData.filter(bet => bet.won);
    const totalWins = wins.length;
    const totalWinAmount = wins.reduce((sum, bet) => sum + bet.winAmount, 0);
    const totalBetAmount = betsData.reduce((sum, bet) => sum + bet.betAmount, 0);
    const winRate = totalBets > 0 ? (totalWins / totalBets) * 100 : 0;

    setStats({
      totalBets,
      totalWins,
      totalWinAmount,
      totalBetAmount,
      winRate
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL') + ' ' + date.toLocaleTimeString('he-IL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const goHome = () => {
    router.push('/');
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
              <div className="text-gray-300">/ היסטוריית הימורים</div>
            </div>
            
            <div className="flex items-center gap-4">
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
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.totalBets}</div>
            <div className="text-sm text-gray-300">סה״כ הימורים</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-center">
            <div className="text-2xl font-bold text-green-400">{stats.totalWins}</div>
            <div className="text-sm text-gray-300">זכיות</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-center">
            <div className="text-2xl font-bold text-yellow-400">{stats.winRate.toFixed(1)}%</div>
            <div className="text-sm text-gray-300">אחוז זכיות</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-center">
            <div className="text-2xl font-bold text-red-400">${stats.totalBetAmount}</div>
            <div className="text-sm text-gray-300">סה״כ הימור</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-center">
            <div className="text-2xl font-bold text-green-400">+${stats.totalWinAmount}</div>
            <div className="text-sm text-gray-300">סה״כ זכיות</div>
          </div>
        </div>

        {/* History Table */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 text-blue-400 text-xl">📋</div>
              <h2 className="text-xl font-bold">היסטוריית הימורים</h2>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="text-xl">טוען היסטוריה...</div>
            </div>
          ) : bets.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-xl text-gray-400">אין הימורים עדיין</div>
              <button 
                onClick={goHome}
                className="mt-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-2 px-6 rounded-lg"
              >
                התחל לשחק!
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black/20">
                  <tr>
                    <th className="px-6 py-3 text-right text-sm font-medium text-gray-300">תאריך</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-gray-300">המספר שלי</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-gray-300">טווח</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-gray-300">ניסיונות</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-gray-300">הימור</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-gray-300">מספרי המערכת</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-gray-300">תוצאה</th>
                  </tr>
                </thead>
                <tbody>
                  {bets.map((bet: any, index) => (
                    <tr key={bet._id} className={`border-b border-white/10 ${bet.won ? 'bg-green-500/5' : 'bg-red-500/5'}`}>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {formatDate(bet.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-400 text-black font-bold">
                          {bet.selectedNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-300">
                        1-{bet.range}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-300">
                        {bet.attempts}
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-medium">
                        ${bet.betAmount}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-1">
                          {bet.systemNumbers.map((num: number, idx: number) => (
                            <span 
                              key={idx} 
                              className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                num === bet.selectedNumber ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-300'
                              }`}
                            >
                              {num}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {bet.won ? (
                          <div className="text-green-400 font-bold">
                            ✅ +${bet.winAmount}
                          </div>
                        ) : (
                          <div className="text-red-400 font-bold">
                            ❌ -${bet.betAmount}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Back to Game Button */}
        <div className="text-center mt-8">
          <button 
            onClick={goHome}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-xl transition-all"
          >
            חזור למשחק
          </button>
        </div>

      </div>
    </div>
  );
}