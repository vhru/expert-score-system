'use client';

import { useEffect, useState } from 'react';

export default function MaintenancePage() {
  const [maintenanceInfo, setMaintenanceInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 检查维护状态
    fetch('/api/system/status')
      .then(res => res.json())
      .then(data => {
        setMaintenanceInfo(data.maintenance);
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to fetch maintenance status:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">检查系统状态中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* 维护图标 */}
          <div className="mx-auto h-24 w-24 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
            <svg className="h-12 w-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          {/* 标题 */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            系统维护中
          </h1>
          
          {/* 维护信息 */}
          {maintenanceInfo && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="text-left space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">维护信息</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {maintenanceInfo.message || '系统正在维护中，请稍后再试。'}
                  </p>
                </div>
                
                {maintenanceInfo.startTime && (
                  <div>
                    <h4 className="font-medium text-gray-900">维护开始时间</h4>
                    <p className="text-gray-600">{maintenanceInfo.startTime}</p>
                  </div>
                )}
                
                {maintenanceInfo.endTime && (
                  <div>
                    <h4 className="font-medium text-gray-900">预计结束时间</h4>
                    <p className="text-gray-600">{maintenanceInfo.endTime}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* 联系信息 */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-900 mb-2">需要帮助？</h3>
            <p className="text-blue-700 text-sm">
              如有紧急事务，请联系系统管理员
            </p>
          </div>
          
          {/* 刷新按钮 */}
          <div className="mt-6">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              刷新页面
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
