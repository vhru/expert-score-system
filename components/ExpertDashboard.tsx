'use client';

import { useState, useEffect } from 'react';
import MyAssignments from './MyAssignments';

interface ExpertDashboardProps {
  user: any;
  token: string;
  onLogout: () => void;
}

export default function ExpertDashboard({ user, token, onLogout }: ExpertDashboardProps) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignments = async () => {
    try {
      const response = await fetch('/api/reviews/my-assignments', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setAssignments(data.assignments);
      }
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">专家评审台</h1>
            <p className="text-gray-600">欢迎，{user.username}</p>
            <p className="text-sm text-gray-500">您当前有 {assignments.length} 个评审任务</p>
          </div>
          <button
            onClick={onLogout}
            className="btn-secondary"
          >
            退出登录
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-blue-900 mb-2">评审说明</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 请仔细阅读分配给您评审的文件</li>
          <li>• 根据评审标准给出0-100分的评分</li>
          <li>• 可以添加评审意见和建议</li>
          <li>• 提交后无法修改，请谨慎评分</li>
          <li>• 所有评审信息均匿名处理</li>
        </ul>
      </div>

      {/* Assignments */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">我的评审任务</h2>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-500">加载中...</p>
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">暂无评审任务</p>
            </div>
          ) : (
            <MyAssignments 
              assignments={assignments} 
              token={token} 
              onUpdate={fetchAssignments}
            />
          )}
        </div>
      </div>
    </div>
  );
}
