'use client';

import { useState } from 'react';

export default function TestLoginPage() {
  const [credentials, setCredentials] = useState({
    username: 'admin@example.com',
    password: 'admin123'
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      setResult(data);

      if (data.token) {
        // 保存token到localStorage
        localStorage.setItem('token', data.token);
        console.log('Token已保存到localStorage:', data.token);
      }
    } catch (error) {
      setResult({ error: '登录失败', details: error });
    } finally {
      setLoading(false);
    }
  };

  const testToken = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setResult({ error: '没有找到token' });
      return;
    }

    try {
      const response = await fetch('/api/system/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setResult({ tokenTest: data });
    } catch (error) {
      setResult({ error: 'Token测试失败', details: error });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            JWT Token 测试
          </h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">用户名</label>
            <input
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials({...credentials, username: e.target.value})}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">密码</label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={handleLogin}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? '登录中...' : '登录获取Token'}
            </button>
            
            <button
              onClick={testToken}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              测试Token
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-white p-4 rounded-md shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-2">结果:</h3>
            <pre className="text-sm text-gray-600 overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
