'use client';

import { useState, useEffect } from 'react';
import ExpertReviewInterface from '@/components/ExpertReviewInterface';

export default function ExpertDashboard() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 检查登录状态
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    
    if (!savedUser || !savedToken) {
      window.location.href = '/expert-login';
      return;
    }

    try {
      const userData = JSON.parse(savedUser);
      if (userData.role !== 'expert') {
        window.location.href = '/expert-login';
        return;
      }
      
      setUser(userData);
      setToken(savedToken);
    } catch (error) {
      console.error('Failed to parse user data:', error);
      window.location.href = '/expert-login';
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/expert-login';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <ExpertReviewInterface user={user} token={token} onLogout={handleLogout} />;
}
