'use client';

import { useState, useEffect } from 'react';

interface TeamSubmission {
  id: number;
  original_name: string;
  team_name: string;
  file_size: number;
  mime_type: string;
  upload_status: string;
  created_at: string;
  updated_at: string;
  review_status?: string;
  expert_assignments?: any[];
}

export default function TeamDashboard() {
  const [teamInfo, setTeamInfo] = useState<any>(null);
  const [submissions, setSubmissions] = useState<TeamSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem('teamToken');
    const savedTeamInfo = localStorage.getItem('teamInfo');
    
    if (!token || !savedTeamInfo) {
      window.location.href = '/team-login';
      return;
    }

    try {
      setTeamInfo(JSON.parse(savedTeamInfo));
      fetchSubmissions(token);
    } catch (error) {
      console.error('Failed to parse team info:', error);
      window.location.href = '/team-login';
    }
  }, []);

  const fetchSubmissions = async (token: string) => {
    try {
      const response = await fetch('/api/teams/submissions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setSubmissions(data.submissions);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('teamToken');
    localStorage.removeItem('teamInfo');
    window.location.href = '/team-login';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已提交';
      case 'pending': return '待处理';
      case 'processing': return '处理中';
      case 'failed': return '失败';
      default: return '未知';
    }
  };

  const getReviewStatusText = (submission: TeamSubmission) => {
    if (!submission.expert_assignments || submission.expert_assignments.length === 0) {
      return '待分配专家';
    }
    
    const completed = submission.expert_assignments.filter(a => a.assignment_status === 'completed').length;
    const total = submission.expert_assignments.length;
    
    if (completed === 0) {
      return '评审中';
    } else if (completed === total) {
      return '评审完成';
    } else {
      return `评审中 (${completed}/${total})`;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-xl font-semibold text-gray-900">
              团队管理后台 - {teamInfo?.teamName}
            </h1>
            <div className="flex items-center space-x-4">
              <a 
                href="/team-submit" 
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                提交新作品
              </a>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* 团队信息卡片 */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">团队信息</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">团队名称:</span>
                <p className="font-medium">{teamInfo?.teamName}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">联系邮箱:</span>
                <p className="font-medium">{teamInfo?.contactEmail}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">联系人:</span>
                <p className="font-medium">{teamInfo?.contactPerson || '未填写'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">联系电话:</span>
                <p className="font-medium">{teamInfo?.contactPhone || '未填写'}</p>
              </div>
            </div>
          </div>

          {/* 作品提交记录 */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-gray-900">作品提交记录</h2>
              <a 
                href="/team-submit" 
                className="btn-primary"
              >
                提交新作品
              </a>
            </div>

            {submissions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📁</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">暂无提交记录</h3>
                <p className="text-gray-500">您还没有提交任何作品。</p>
                <a 
                  href="/team-submit" 
                  className="mt-4 inline-block btn-primary"
                >
                  立即提交作品
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <div key={submission.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            {submission.team_name || submission.original_name}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(submission.upload_status)}`}>
                            {getStatusText(submission.upload_status)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 space-y-1">
                          <p>文件类型: {submission.mime_type}</p>
                          <p>文件大小: {formatFileSize(submission.file_size)}</p>
                          <p>提交时间: {new Date(submission.created_at).toLocaleString()}</p>
                          <p>评审状态: {getReviewStatusText(submission)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
