'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/api/login' : '/api/register';
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await axios.post(`http://localhost:5000${endpoint}`, payload);
      
      // שמירת הטוקן
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // הפניה לעמוד הראשי
      router.push('/');
      
    } catch (error: any) {
      setError(error.response?.data?.message || 'שגיאה בהתחברות');
    } finally {
      setLoading(false);
    }
  };

  // טסט מהיר עם משתמש לדוגמה
  const quickTest = async () => {
    setLoading(true);
    setError('');
    
    try {
      // יצירת משתמש טסט אם לא קיים
      try {
        await axios.post('http://localhost:5000/api/register', {
          username: 'testuser',
          email: 'test@test.com',
          password: '123456'
        });
      } catch (regError) {
        // המשתמש כבר קיים - זה בסדר
      }

      // התחברות
      const response = await axios.post('http://localhost:5000/api/login', {
        email: 'test@test.com',
        password: '123456'
      });
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      router.push('/');
      
    } catch (error: any) {
      setError('שגיאה בטסט מהיר');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center px-4">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 w-full max-w-md">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 text-6xl">🎯</div>
          <h1 className="text-3xl font-bold text-white mb-2">
            המר על מספר
          </h1>
          <p className="text-gray-300">
            {isLogin ? 'התחבר לחשבון שלך' : 'צור חשבון חדש'}
          </p>
        </div>

        {/* Toggle */}
        <div className="flex bg-black/20 rounded-lg p-1 mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              isLogin ? 'bg-yellow-400 text-black' : 'text-gray-300 hover:text-white'
            }`}
          >
            התחברות
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              !isLogin ? 'bg-yellow-400 text-black' : 'text-gray-300 hover:text-white'
            }`}
          >
            הרשמה
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                שם משתמש
              </label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-yellow-400 focus:outline-none"
                placeholder="הכנס שם משתמש"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              אימייל
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-yellow-400 focus:outline-none"
              placeholder="הכנס אימייל"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              סיסמה
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-yellow-400 focus:outline-none"
              placeholder="הכנס סיסמה"
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-400 text-red-300 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50"
          >
            {loading ? 'טוען...' : (isLogin ? 'התחבר' : 'הירשם')}
          </button>
        </form>

        {/* Quick Test */}
        <div className="mt-6">
          <button
            onClick={quickTest}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-all disabled:opacity-50"
          >
            🚀 טסט מהיר (test@test.com)
          </button>
        </div>

        {/* Demo Info */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-400/30 rounded-lg">
          <div className="text-blue-300 text-sm text-center">
            💡 לטסט ידני: test@test.com / 123456
            <br />
            או השתמש בכפתור הטסט המהיר למעלה!
          </div>
        </div>

      </div>
    </div>
  );
}