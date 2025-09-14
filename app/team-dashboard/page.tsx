'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
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

  const getDocumentTypeText = (documentType: string) => {
    const typeMap: { [key: string]: string } = {
      'commitmentLetter': '承诺书',
      'presentation': '项目展示',
      'supplementaryMaterials': '补充材料',
      'technicalInfo': '技术信息',
      'businessLicense': '营业执照',
      'businessPlan': '商业计划书'
    };
    return typeMap[documentType] || documentType;
  };

  const handleDownloadDocument = async (submission: TeamSubmission) => {
    try {
      const token = localStorage.getItem('teamToken');
      const response = await fetch(`/api/teams/download/${submission.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = submission.original_name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setMessage('下载失败');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Download error:', error);
      setMessage('下载失败');
      setMessageType('error');
    }
  };

  const handleUpdateForm = () => {
    // 跳转到表单更新页面
    router.push('/team-register-new?update=true');
  };

  const handleUpdateDocument = (submission: TeamSubmission) => {
    // 跳转到文档更新页面
    router.push(`/team-edit-document/${submission.id}`);
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">团队信息</h2>
              <button
                onClick={handleUpdateForm}
                className="btn-primary text-sm"
              >
                更新表单信息
              </button>
            </div>
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
            </div>

            {submissions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📁</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">暂无提交记录</h3>
                <p className="text-gray-500">您还没有提交任何作品。</p>
              </div>
            ) : (
              <div className="space-y-6">
                {submissions.map((submission) => (
                  <div key={submission.id} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {getDocumentTypeText(submission.document_type)}
                          </h3>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(submission.upload_status)}`}>
                            {getStatusText(submission.upload_status)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                          <div>
                            <p><span className="font-medium">文件名:</span> {submission.original_name}</p>
                            <p><span className="font-medium">文件类型:</span> {submission.mime_type}</p>
                          </div>
                          <div>
                            <p><span className="font-medium">提交时间:</span> {new Date(submission.created_at).toLocaleString()}</p>
                            <p><span className="font-medium">评审状态:</span> {getReviewStatusText(submission)}</p>
                            <p><span className="font-medium">文档ID:</span> #{submission.id}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => handleDownloadDocument(submission)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        下载文档
                      </button>
                      
                      <button
                        onClick={() => handleUpdateDocument(submission)}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        更新文档
                      </button>
                      
                      
                      <span className="text-xs text-gray-500">
                        最后更新: {new Date(submission.updated_at).toLocaleString()}
                      </span>
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
