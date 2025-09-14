'use client';

import { useState, useEffect } from 'react';
import { decryptData } from '@/lib/encryption';

interface ExpertReviewInterfaceProps {
  user: any;
  token: string;
  onLogout: () => void;
}

interface Assignment {
  id: number;
  file_id: number;
  expert_id: number;
  assignment_status: string;
  score: number | null;
  comments: string | null;
  created_at: string;
  updated_at: string;
  original_name: string;
  file_path: string;
  mime_type: string;
  team_name: string;
}

export default function ExpertReviewInterface({ user, token, onLogout }: ExpertReviewInterfaceProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [reviewForm, setReviewForm] = useState({
    score: '',
    comments: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const fetchAssignments = async () => {
    try {
      const response = await fetch('/api/expert/assignments', {
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

  const handleStartReview = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setReviewForm({
      score: assignment.score ? assignment.score.toString() : '',
      comments: assignment.comments || ''
    });
    setMessage('');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAssignment) return;
    
    const score = parseFloat(reviewForm.score);
    if (isNaN(score) || score < 0 || score > 100) {
      setMessage('请输入0-100之间的有效分数');
      setMessageType('error');
      return;
    }

    if (!reviewForm.comments.trim()) {
      setMessage('请输入评审意见');
      setMessageType('error');
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/expert/submit-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          assignmentId: selectedAssignment.id,
          score: score,
          comments: reviewForm.comments.trim()
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('评审提交成功！');
        setMessageType('success');
        setSelectedAssignment(null);
        fetchAssignments(); // 刷新任务列表
      } else {
        setMessage(data.error || '提交失败');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('网络错误，请重试');
      setMessageType('error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadFile = async (assignment: Assignment) => {
    try {
      const response = await fetch(`/api/expert/download/${assignment.file_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = assignment.original_name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to download file:', error);
      setMessage('文件下载失败');
      setMessageType('error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'assigned': return '待评审';
      case 'in_progress': return '评审中';
      case 'completed': return '已完成';
      default: return '未知';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">加载中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">专家评审系统</h1>
            <p className="text-gray-600">欢迎，{user.username} 专家</p>
          </div>
          <button
            onClick={onLogout}
            className="btn-secondary"
          >
            退出登录
          </button>
        </div>
      </div>

      {/* 评审任务列表 */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">我的评审任务</h2>
          <button
            onClick={fetchAssignments}
            className="btn-secondary"
          >
            刷新列表
          </button>
        </div>

        {assignments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无评审任务</h3>
            <p className="text-gray-500">您还没有被分配任何评审任务。</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {assignment.team_name || assignment.original_name}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(assignment.assignment_status)}`}>
                        {getStatusText(assignment.assignment_status)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>文件类型: {assignment.mime_type}</p>
                      <p>分配时间: {new Date(assignment.created_at).toLocaleString()}</p>
                      {assignment.score !== null && (
                        <p>已评分: {assignment.score}分</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDownloadFile(assignment)}
                      className="btn-secondary text-sm"
                    >
                      下载文件
                    </button>
                    <button
                      onClick={() => handleStartReview(assignment)}
                      className="btn-primary text-sm"
                    >
                      {assignment.assignment_status === 'completed' ? '修改评审' : 
                       assignment.assignment_status === 'assigned' ? '开始评审' : '继续评审'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 评审表单模态框 */}
      {selectedAssignment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  评审作品 - {selectedAssignment.team_name || selectedAssignment.original_name}
                </h3>
                <button
                  onClick={() => setSelectedAssignment(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">关闭</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label htmlFor="score" className="form-label">
                    评分 (0-100分) *
                  </label>
                  <input
                    id="score"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={reviewForm.score}
                    onChange={(e) => setReviewForm({ ...reviewForm, score: e.target.value })}
                    className="form-input"
                    placeholder="请输入0-100之间的分数"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="comments" className="form-label">
                    评审意见 *
                  </label>
                  <textarea
                    id="comments"
                    value={reviewForm.comments}
                    onChange={(e) => setReviewForm({ ...reviewForm, comments: e.target.value })}
                    className="form-input"
                    rows={6}
                    placeholder="请详细说明您的评审意见，包括作品的优点、不足和改进建议..."
                    required
                  />
                </div>

                {message && (
                  <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`}>
                    {message}
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setSelectedAssignment(null)}
                    className="btn-secondary"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary disabled:opacity-50"
                  >
                    {submitting ? '提交中...' : '提交评审'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
