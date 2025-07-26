'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>({});
  const [users, setUsers] = useState([]);
  const [recentBets, setRecentBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // קבלת סטטיסטיקות
      const statsResponse = await axios.get('http://localhost:5000/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // קבלת משתמשים
      const usersResponse = await axios.get('http://localhost:5000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // קבלת הימורים אחרונים
      const betsResponse = await axios.get('http://localhost:5000/api/admin/recent-bets?limit=20', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setStats(statsResponse.data);
      setUsers(usersResponse.data.users);
      setRecentBets(betsResponse.data);
      
    } catch (error) {
      console.error('שגיאה בקבלת נתוני מנהל:', error);
      alert('שגיאה בגישה לפאנל מנהל');
    } finally {
      setLoading(false);
    }
  };

  const updateUserBalance = async (userId: string, currentBalance: number) => {
    const newBalance = prompt(`עדכן יתרה למשתמש (יתרה נוכחית: $${currentBalance}):`);
    
    if (newBalance === null) return;
    
    const balanceNum = parseFloat(newBalance);
    if (isNaN(balanceNum) || balanceNum < 0) {
      alert('יתרה לא תקינה');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/admin/update-balance', {
        userId,
        newBalance: balanceNum,
        reason: 'עדכון מנהל'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('יתרה עודכנה בהצלחה!');
      fetchAdminData(); // רענון הנתונים
      
    } catch (error) {
      console.error('שגיאה בעדכון יתרה:', error);
      alert('שגיאה בעדכון היתרה');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL') + ' ' + 
           new Date(dateString).toLocaleTimeString('he-IL', { 
             hour: '2-digit', 
             minute: '2-digit' 
           });
  };

  const goHome = () => router.push('/');
  
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">טוען פאנל מנהל...</div>
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
              <div className="text-gray-300">/ פאנל מנהל 👑</div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="bg-red-600/20 border border-red-400 rounded-lg px-4 py-2">
                <div className="text-sm text-red-300">מנהל</div>
                <div className="text-sm font-bold text-red-400">{user.username}</div>
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

      {/* Tabs */}
      <div className="bg-black/10 border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            {[
              { id: 'dashboard', name: 'דשבורד', icon: '📊' },
              { id: 'users', name: 'משתמשים', icon: '👥' },
              { id: 'bets', name: 'הימורים', icon: '🎲' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 transition-all ${
                  activeTab === tab.id 
                    ? 'bg-yellow-400 text-black font-bold' 
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.icon} {tab.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            
            {/* Main Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
                <div className="text-3xl font-bold text-blue-400">{stats.totalUsers}</div>
                <div className="text-sm text-gray-300">סה״כ משתמשים</div>
                <div className="text-xs text-blue-300 mt-1">{stats.activeUsers} פעילים השבוע</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
                <div className="text-3xl font-bold text-green-400">{stats.totalBets}</div>
                <div className="text-sm text-gray-300">סה״כ הימורים</div>
                <div className="text-xs text-green-300 mt-1">{stats.betsToday} היום</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
                <div className="text-3xl font-bold text-yellow-400">{stats.winRate}%</div>
                <div className="text-sm text-gray-300">אחוז זכיות</div>
                <div className="text-xs text-yellow-300 mt-1">{stats.totalWins} זכיות</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
                <div className="text-3xl font-bold text-purple-400">${stats.revenue?.houseRevenue || 0}</div>
                <div className="text-sm text-gray-300">רווח הבית</div>
                <div className="text-xs text-purple-300 mt-1">${stats.revenue?.totalBetAmount || 0} הימורים</div>
              </div>
            </div>

            {/* Revenue Breakdown */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                💰 פירוט הכנסות
              </h3>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-green-500/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-400">${stats.revenue?.totalBetAmount || 0}</div>
                  <div className="text-sm text-gray-300">סה״כ הימורים</div>
                </div>
                
                <div className="text-center p-4 bg-red-500/20 rounded-lg">
                  <div className="text-2xl font-bold text-red-400">${stats.revenue?.totalWinAmount || 0}</div>
                  <div className="text-sm text-gray-300">סה״כ תשלומים</div>
                </div>
                
                <div className="text-center p-4 bg-yellow-500/20 rounded-lg border-2 border-yellow-400/50">
                  <div className="text-2xl font-bold text-yellow-400">${stats.revenue?.houseRevenue || 0}</div>
                  <div className="text-sm text-gray-300">רווח נקי</div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-xl font-bold flex items-center gap-2">
                👥 ניהול משתמשים
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black/20">
                  <tr>
                    <th className="px-6 py-3 text-right text-sm font-medium text-gray-300">שם משתמש</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-gray-300">אימייל</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-gray-300">יתרה</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-gray-300">הימורים</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-gray-300">אחוז זכיות</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-gray-300">רווח נקי</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-gray-300">תאריך הרשמה</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-gray-300">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user: any) => (
                    <tr key={user._id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="px-6 py-4 font-medium">{user.username}</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-300">{user.email}</td>
                      <td className="px-6 py-4 text-center font-bold text-green-400">${user.balance}</td>
                      <td className="px-6 py-4 text-center">{user.stats.totalBets}</td>
                      <td className="px-6 py-4 text-center text-yellow-400">{user.stats.winRate}%</td>
                      <td className={`px-6 py-4 text-center font-bold ${user.stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {user.stats.netProfit >= 0 ? '+' : ''}${user.stats.netProfit}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-300">
                        {new Date(user.createdAt).toLocaleDateString('he-IL')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => updateUserBalance(user._id, user.balance)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                        >
                          עדכן יתרה
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bets Tab */}
        {activeTab === 'bets' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-xl font-bold flex items-center gap-2">
                🎲 הימורים אחרונים
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black/20">
                  <tr>
                    <th className="px-6 py-3 text-right text-sm font-medium text-gray-300">תאריך</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-gray-300">משתמש</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-gray-300">מספר נבחר</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-gray-300">טווח</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-gray-300">הימור</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-gray-300">מספרי מערכת</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-gray-300">תוצאה</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBets.map((bet: any) => (
                    <tr key={bet._id} className={`border-b border-white/10 ${bet.won ? 'bg-green-500/5' : 'bg-red-500/5'}`}>
                      <td className="px-6 py-4 text-sm">{formatDate(bet.createdAt)}</td>
                      <td className="px-6 py-4 text-center font-medium">{bet.userId?.username || 'לא ידוע'}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-400 text-black font-bold text-sm">
                          {bet.selectedNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm">1-{bet.range}</td>
                      <td className="px-6 py-4 text-center font-medium">${bet.betAmount}</td>
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
                          <div className="text-green-400 font-bold">✅ +${bet.winAmount}</div>
                        ) : (
                          <div className="text-red-400 font-bold">❌ -${bet.betAmount}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}