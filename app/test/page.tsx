'use client';

import { useState } from 'react';

export default function TestPage() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const testDatabaseInit = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/init', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setMessage('✅ 数据库初始化成功！');
      } else {
        setMessage(`❌ 数据库初始化失败: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ 网络错误: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'admin@example.com',
          password: 'admin123'
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('✅ 登录测试成功！');
      } else {
        setMessage(`❌ 登录测试失败: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ 网络错误: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          系统测试页面
        </h1>

        <div className="space-y-4">
          <button
            onClick={testDatabaseInit}
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50"
          >
            {loading ? '测试中...' : '测试数据库初始化'}
          </button>

          <button
            onClick={testLogin}
            disabled={loading}
            className="w-full btn-secondary disabled:opacity-50"
          >
            {loading ? '测试中...' : '测试管理员登录'}
          </button>
        </div>

        {message && (
          <div className="mt-6 p-4 rounded-md bg-gray-50">
            <p className="text-sm text-gray-700">{message}</p>
          </div>
        )}

        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            ← 返回主页
          </a>
        </div>

        <div className="mt-6 text-xs text-gray-500">
          <p>系统状态检查：</p>
          <ul className="mt-2 space-y-1">
            <li>• 前端: ✅ Next.js 运行中</li>
            <li>• 样式: ✅ Tailwind CSS 已加载</li>
            <li>• API: 🔄 需要测试</li>
            <li>• 数据库: 🔄 需要测试</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
