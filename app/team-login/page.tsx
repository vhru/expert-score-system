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
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');

  // 翻译文本
  const t = {
    zh: {
      title: '团队登录',
      email: '邮箱',
      password: '密码',
      login: '登录',
      register: '注册',
      switchLanguage: 'English',
      emailRequired: '请输入邮箱和密码',
      loginSuccess: '登录成功',
      loginFailed: '登录失败',
      privacyNotice: '⚠️ 重要提示：所有上传的信息仅用于本次STIC大赛评审，我们将严格保护您的隐私信息，不会用于其他用途。'
    },
    en: {
      title: 'Team Login',
      email: 'Email',
      password: 'Password',
      login: 'Login',
      register: 'Register',
      switchLanguage: '中文',
      emailRequired: 'Please enter email and password',
      loginSuccess: 'Login successful',
      loginFailed: 'Login failed',
      privacyNotice: '⚠️ Important Notice: All uploaded information is used solely for the STIC competition review. We strictly protect your privacy and will not use your information for any other purposes.'
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'zh' ? 'en' : 'zh');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginForm.email.trim() || !loginForm.password) {
      setMessage(t[language].emailRequired);
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
        setMessage(data.error || t[language].loginFailed);
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
          <div className="flex justify-between items-center">
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 flex-1">
              {t[language].title}
            </h2>
            <button
              type="button"
              onClick={toggleLanguage}
              className="mt-6 text-sm text-blue-600 hover:text-blue-500"
            >
              {t[language].switchLanguage}
            </button>
          </div>
          <p className="mt-2 text-center text-sm text-gray-600">
            {language === 'zh' ? '登录您的团队账号，管理参赛作品' : 'Login to your team account to manage submissions'}
          </p>
        </div>
        
        {/* 隐私提示 */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            {t[language].privacyNotice}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                {t[language].email}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder={language === 'zh' ? '邮箱地址' : 'Email address'}
                value={loginForm.email}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                {t[language].password}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder={language === 'zh' ? '密码' : 'Password'}
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
              {loading ? (language === 'zh' ? '登录中...' : 'Logging in...') : t[language].login}
            </button>
          </div>

          <div className="text-center space-y-2">
            <a 
              href="/portal" 
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              {language === 'zh' ? '← 返回系统首页' : '← Back to Home'}
            </a>
            {/* 注册链接已移除 - 请通过门户页面进行完整注册 */}
          </div>
        </form>
      </div>
    </div>
  );
}
