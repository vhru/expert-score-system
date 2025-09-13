'use client';

import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    // 重定向到新的门户页面
    window.location.href = '/portal';
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">正在跳转到系统首页...</p>
      </div>
    </div>
  );
}
