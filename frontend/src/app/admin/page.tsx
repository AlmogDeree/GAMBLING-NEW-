'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  Users, DollarSign, TrendingUp, Activity, Settings, 
  BarChart3, PieChart, ArrowUpRight, ArrowDownRight,
  UserCheck, UserX, Edit, Save, X, RefreshCw
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalBets: number;
  totalWins: number;
  winRate: string;
  revenue: number;
  activeUsers: number;
  betsToday: number;
  vipDistribution: Array<{_id: string, count: number}>;
}

interface User {
  _id: string;
  username: string;
  email: string;
  balance: number;
  totalBets: number;
  vipLevel: string;
  isAdmin: boolean;
  createdAt: string;
  stats: {
    totalBets: number;
    totalWins: number;
    winRate: string;
    netProfit: number;
  };
}

interface RecentBet {
  _id: string;
  userId: {
    username: string;
    email: string;
  };
  selectedNumbers: number[];
  systemNumbers: number[];
  betAmount: number;
  won: boolean;
  winAmount: number;
  createdAt: string;
}

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalBets: 0,
    totalWins: 0,
    winRate: '0',
    revenue: 0,
    activeUsers: 0,
    betsToday: 0,
    vipDistribution: []
  });
  const [users, setUsers] = useState<User[]>([]);
  const [recentBets, setRecentBets] = useState<RecentBet[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [newBalance, setNewBalance] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (!parsedUser.isAdmin) {
      router.push('/');
      return;
    }

    setUser(parsedUser);
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [statsResponse, usersResponse, betsResponse] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/admin/users?limit=50', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/admin/recent-bets?limit=30', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setStats(statsResponse.data);
      setUsers(usersResponse.data.users);
      setRecentBets(betsResponse.data);
      
    } catch (error) {
      console.error('Error fetching admin data:', error);
      alert('Error accessing admin panel');
    } finally {
      setLoading(false);
    }
  };

  const updateUserBalance = async (userId: string, currentBalance: number) => {
    const balanceNum = parseFloat(newBalance);
    if (isNaN(balanceNum) || balanceNum < 0) {
      alert('Invalid balance amount');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/admin/update-balance', {
        userId,
        newBalance: balanceNum,
        reason: 'Admin manual update'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Balance updated successfully!');
      setEditingUser(null);
      setNewBalance('');
      fetchAdminData();
      
    } catch (error: any) {
      console.error('Error updating balance:', error);
      alert(error.response?.data?.message || 'Error updating balance');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getVIPColor = (level: string) => {
    const colors = {
      BRONZE: 'text-orange-400',
      SILVER: 'text-gray-300',
      GOLD: 'text-yellow-400',
      PLATINUM: 'text-purple-400',
      DIAMOND: 'text-cyan-400'
    };
    return colors[level as keyof typeof colors] || 'text-gray-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="flex items-center gap-3">
          <RefreshCw className="animate-spin" size={24} />
          <span className="text-xl">Loading admin panel...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      
      {/* Header */}
      <div className="bg-black/20 border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center font-bold text-white text-xl">
                A
              </div>
              <div>
                <div className="text-xl font-bold text-white">Admin Panel</div>
                <div className="text-sm text-gray-300">Welcome, {user?.username}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="bg-blue-600/80 border border-blue-400 rounded-lg px-4 py-2 hover:bg-blue-600/90 transition-colors text-white"
              >
                Back to Game
              </button>
              
              <button 
                onClick={logout}
                className="bg-red-600/80 border border-red-400 rounded-lg px-4 py-2 hover:bg-red-600/90 transition-colors text-white"
              >
                Logout
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
              { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
              { id: 'users', name: 'Users', icon: Users },
              { id: 'bets', name: 'Recent Bets', icon: Activity }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 transition-all flex items-center gap-2 ${
                  activeTab === tab.id 
                    ? 'bg-yellow-400 text-black font-bold' 
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon size={18} />
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            
            {/* Main Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
              >
                <div className="flex items-center justify-between mb-4">
                  <Users className="text-blue-400" size={24} />
                  <ArrowUpRight className="text-green-400" size={16} />
                </div>
                <div className="text-3xl font-bold text-white">{stats.totalUsers}</div>
                <div className="text-sm text-gray-300">Total Users</div>
                <div className="text-xs text-blue-300 mt-1">{stats.activeUsers} active this week</div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
              >
                <div className="flex items-center justify-between mb-4">
                  <Activity className="text-green-400" size={24} />
                  <ArrowUpRight className="text-green-400" size={16} />
                </div>
                <div className="text-3xl font-bold text-white">{stats.totalBets}</div>
                <div className="text-sm text-gray-300">Total Bets</div>
                <div className="text-xs text-green-300 mt-1">{stats.betsToday} today</div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
              >
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="text-yellow-400" size={24} />
                  <ArrowUpRight className="text-green-400" size={16} />
                </div>
                <div className="text-3xl font-bold text-white">{stats.winRate}%</div>
                <div className="text-sm text-gray-300">Win Rate</div>
                <div className="text-xs text-yellow-300 mt-1">{stats.totalWins} total wins</div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
              >
                <div className="flex items-center justify-between mb-4">
                  <DollarSign className="text-green-400" size={24} />
                  <ArrowUpRight className="text-green-400" size={16} />
                </div>
                <div className="text-3xl font-bold text-white">${stats.revenue}</div>
                <div className="text-sm text-gray-300">Revenue</div>
                <div className="text-xs text-green-300 mt-1">House profit</div>
              </motion.div>
            </div>

            {/* VIP Distribution */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <PieChart size={24} />
                VIP Level Distribution
              </h3>
              <div className="grid grid-cols-5 gap-4">
                {['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'].map(level => {
                  const count = stats.vipDistribution.find(v => v._id === level)?.count || 0;
                  return (
                    <div key={level} className="text-center">
                      <div className={`text-2xl font-bold ${getVIPColor(level)}`}>
                        {count}
                      </div>
                      <div className="text-sm text-gray-300">{level}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">User Management</h2>
              <button
                onClick={fetchAdminData}
                className="bg-blue-600/80 border border-blue-400 rounded-lg px-4 py-2 hover:bg-blue-600/90 transition-colors flex items-center gap-2 text-white"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-black/20 border-b border-white/10">
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">User</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Balance</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">VIP Level</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Stats</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Profit</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {users.map((userItem) => (
                      <tr key={userItem._id} className="hover:bg-white/5">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-white flex items-center gap-2">
                              {userItem.username}
                              {userItem.isAdmin && (
                                <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">ADMIN</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-400">{userItem.email}</div>
                            <div className="text-xs text-gray-500">{formatDate(userItem.createdAt)}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {editingUser === userItem._id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={newBalance}
                                onChange={(e) => setNewBalance(e.target.value)}
                                className="w-20 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                                placeholder={userItem.balance.toString()}
                              />
                              <button
                                onClick={() => updateUserBalance(userItem._id, userItem.balance)}
                                className="text-green-400 hover:text-green-300"
                              >
                                <Save size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingUser(null);
                                  setNewBalance('');
                                }}
                                className="text-red-400 hover:text-red-300"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-green-400">${userItem.balance}</span>
                              <button
                                onClick={() => {
                                  setEditingUser(userItem._id);
                                  setNewBalance(userItem.balance.toString());
                                }}
                                className="text-blue-400 hover:text-blue-300"
                              >
                                <Edit size={14} />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-bold ${getVIPColor(userItem.vipLevel)}`}>
                            {userItem.vipLevel}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="text-white">{userItem.stats.totalBets} bets</div>
                          <div className="text-green-400">{userItem.stats.totalWins} wins</div>
                          <div className="text-yellow-400">{userItem.stats.winRate}% rate</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-bold ${
                            userItem.stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            ${userItem.stats.netProfit}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {userItem.stats.totalBets > 0 ? (
                              <UserCheck className="text-green-400" size={16} />
                            ) : (
                              <UserX className="text-gray-400" size={16} />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Recent Bets Tab */}
        {activeTab === 'bets' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Recent Bets</h2>
              <button
                onClick={fetchAdminData}
                className="bg-blue-600/80 border border-blue-400 rounded-lg px-4 py-2 hover:bg-blue-600/90 transition-colors flex items-center gap-2 text-white"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-black/20 border-b border-white/10">
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">User</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Selected</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">System</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Bet</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Result</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {recentBets.map((bet) => (
                      <tr key={bet._id} className={`hover:bg-white/5 ${
                        bet.won ? 'bg-green-500/5' : 'bg-red-500/5'
                      }`}>
                        <td className="px-6 py-4">
                          <div className="font-medium text-white">
                            {bet.userId.username}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-1">
                            {bet.selectedNumbers.map((num, idx) => (
                              <span key={idx} className="bg-yellow-400 text-black px-2 py-1 rounded text-xs font-bold">
                                {num}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-1">
                            {bet.systemNumbers.map((num, idx) => (
                              <span key={idx} className={`px-2 py-1 rounded text-xs font-bold ${
                                bet.selectedNumbers.includes(num) ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-300'
                              }`}>
                                {num}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-white font-bold">
                          ${bet.betAmount}
                        </td>
                        <td className="px-6 py-4">
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
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {formatDate(bet.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}