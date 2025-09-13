'use client';

import { useState } from 'react';

export default function TeamLoginPage() {
  const [loginForm, setLoginForm] = useState({
    email: '',
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
    
    if (!loginForm.teamName.trim() || !loginForm.password) {
      setMessage('请输入团队名称和密码');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/teams/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginForm),
      });

      const data = await response.json();

      if (data.success) {
        // 保存登录状态
        localStorage.setItem('teamToken', data.token);
        localStorage.setItem('teamInfo', JSON.stringify(data.team));
        
        // 跳转到团队管理页面
        window.location.href = '/team-dashboard';
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            团队登录
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            登录您的团队账号，管理参赛作品
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                邮箱
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="邮箱地址"
                value={loginForm.email}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="密码"
                value={loginForm.password}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {message && (
            <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`}>
              {message}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </div>

          <div className="text-center space-y-2">
            <a 
              href="/portal" 
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              ← 返回系统首页
            </a>
            <div className="text-sm text-gray-600">
              还没有团队账号？{' '}
              <a href="/team-register" className="font-medium text-blue-600 hover:text-blue-500">
                立即注册
              </a>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
