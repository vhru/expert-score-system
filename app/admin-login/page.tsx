'use client';

import { useState } from 'react';

export default function AdminLoginPage() {
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginForm.username.trim() || !loginForm.password) {
      setMessage('请输入用户名和密码');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginForm),
      });

      const data = await response.json();

      if (data.success) {
        if (data.user.role === 'admin') {
          // 保存登录状态
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.setItem('token', data.token);
          
          // 跳转到管理员控制台
          window.location.href = '/admin-dashboard';
        } else {
          setMessage('此账号不是管理员账号');
          setMessageType('error');
        }
      } else {
        setMessage(data.error || '登录失败');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('网络错误，请重试');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="text-6xl mb-4">👨‍💼</div>
          <h2 className="text-3xl font-bold text-gray-900">
            管理员登录
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            系统管理员专用登录入口
          </p>
        </div>
        
        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  用户名
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="输入管理员用户名"
                  value={loginForm.username}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  密码
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="输入密码"
                  value={loginForm.password}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {message && (
              <div className={`mt-4 p-3 rounded-lg ${
                messageType === 'success' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </div>
        </form>

        {/* Footer Links */}
        <div className="text-center space-y-2">
          <a 
            href="/portal" 
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            ← 返回系统首页
          </a>
          <div className="text-xs text-gray-500">
            管理员账号具有系统完全访问权限
          </div>
        </div>
      </div>
    </div>
  );
}
