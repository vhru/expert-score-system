'use client';

import { useState, useEffect } from 'react';
import FileUpload from './FileUpload';
import ExpertManagement from './ExpertManagement';
import TeamManagement from './TeamManagement';
import ReviewManagement from './ReviewManagement';
import Statistics from './Statistics';

interface AdminDashboardProps {
  user: any;
  token: string;
  onLogout: () => void;
}

export default function AdminDashboard({ user, token, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('teams');
  const [statistics, setStatistics] = useState(null);

  const tabs = [
    { id: 'teams', name: '团队管理', icon: '🏆' },
    { id: 'experts', name: '专家管理', icon: '👥' },
    { id: 'reviews', name: '评审管理', icon: '📝' },
    { id: 'statistics', name: '统计报告', icon: '📊' },
  ];

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/reviews/statistics', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setStatistics(data.statistics);
      }
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">管理员控制台</h1>
            <p className="text-gray-600">欢迎，{user.username}</p>
          </div>
          <button
            onClick={onLogout}
            className="btn-secondary"
          >
            退出登录
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'teams' && (
            <TeamManagement token={token} onUpdate={fetchStatistics} />
          )}
          {activeTab === 'experts' && (
            <ExpertManagement token={token} />
          )}
          {activeTab === 'reviews' && (
            <ReviewManagement token={token} onUpdate={fetchStatistics} />
          )}
          {activeTab === 'statistics' && (
            <Statistics statistics={statistics} />
          )}
        </div>
      </div>
    </div>
  );
}
