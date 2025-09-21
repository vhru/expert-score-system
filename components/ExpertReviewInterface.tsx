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

interface TeamAssignment {
  team_name: string;
  team_id: number;
  assignments: Assignment[];
  overall_score: number | null;
  overall_comments: string | null;
  status: string;
}

export default function ExpertReviewInterface({ user, token, onLogout }: ExpertReviewInterfaceProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [teamAssignments, setTeamAssignments] = useState<TeamAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<TeamAssignment | null>(null);
  const [reviewForm, setReviewForm] = useState({
    score: '',
    comments: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
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
        
        // 按团队分组
        const teamMap = new Map<string, TeamAssignment>();
        
        data.assignments.forEach((assignment: Assignment) => {
          const teamName = assignment.team_name;
          if (!teamMap.has(teamName)) {
            teamMap.set(teamName, {
              team_name: teamName,
              team_id: assignment.id, // 使用第一个assignment的id作为team_id
              assignments: [],
              overall_score: null,
              overall_comments: null,
              status: 'assigned'
            });
          }
          
          const teamAssignment = teamMap.get(teamName)!;
          teamAssignment.assignments.push(assignment);
          
          // 更新团队状态
          if (assignment.assignment_status === 'completed') {
            teamAssignment.status = 'completed';
            teamAssignment.overall_score = assignment.score;
            teamAssignment.overall_comments = assignment.comments;
          } else if (assignment.assignment_status === 'in_progress') {
            teamAssignment.status = 'in_progress';
          }
        });
        
        setTeamAssignments(Array.from(teamMap.values()));
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

  const handleStartReview = (teamAssignment: TeamAssignment) => {
    setSelectedTeam(teamAssignment);
    setReviewForm({
      score: teamAssignment.overall_score ? teamAssignment.overall_score.toString() : '',
      comments: teamAssignment.overall_comments || ''
    });
    setMessage('');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTeam) return;
    
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
      // 为团队的所有文件提交评审
      const promises = selectedTeam.assignments.map(assignment => 
        fetch('/api/expert/submit-review', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            assignmentId: assignment.id,
            score: score,
            comments: reviewForm.comments.trim()
          }),
        })
      );

      const responses = await Promise.all(promises);
      const results = await Promise.all(responses.map(r => r.json()));

      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;
      
      if (successCount === totalCount) {
        setMessage('团队评审提交成功！');
        setMessageType('success');
        setSelectedTeam(null);
        fetchAssignments(); // 刷新任务列表
      } else if (successCount > 0) {
        setMessage(`评审提交部分成功：${successCount}/${totalCount} 个任务已提交`);
        setMessageType('success');
        setSelectedTeam(null);
        fetchAssignments(); // 刷新任务列表
      } else {
        setMessage('评审提交失败，请重试');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('网络错误，请重试');
      setMessageType('error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadZip = async (teamAssignment: TeamAssignment) => {
    console.log('🔍 开始ZIP下载流程:', teamAssignment.team_name);
    setDownloading(teamAssignment.team_name);
    setMessage('');
    setMessageType('');
    
    try {
      // 获取团队ID
      console.log('🔍 步骤1: 获取团队信息...');
      const team = await fetch(`/api/admin/teams/by-name/${encodeURIComponent(teamAssignment.team_name)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('🔍 获取团队信息响应:', team.status, team.statusText);
      
      if (!team.ok) {
        const errorText = await team.text();
        console.error('❌ 获取团队信息失败:', errorText);
        setMessage('获取团队信息失败');
        setMessageType('error');
        return;
      }
      
      const teamData = await team.json();
      console.log('🔍 团队数据:', teamData);
      const teamId = teamData.team?.id;
      
      if (!teamId) {
        console.error('❌ 团队ID不存在:', teamData);
        setMessage('团队ID不存在');
        setMessageType('error');
        return;
      }
      
      console.log('🔍 步骤2: 开始下载ZIP文件...', teamId);
      const response = await fetch(`/api/admin/teams/${teamId}/download-zip`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('🔍 ZIP下载响应:', response.status, response.statusText);
      
      if (response.ok) {
        console.log('🔍 步骤3: 处理ZIP文件...');
        const blob = await response.blob();
        console.log('🔍 ZIP文件大小:', blob.size, 'bytes');
        
        if (blob.size === 0) {
          console.error('❌ ZIP文件为空');
          setMessage('ZIP文件为空，可能没有文档');
          setMessageType('error');
          return;
        }
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${teamAssignment.team_name}_团队资料.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        console.log('✅ ZIP下载完成');
        setMessage('ZIP下载完成！');
        setMessageType('success');
      } else {
        const errorText = await response.text();
        console.error('❌ ZIP下载失败:', response.status, errorText);
        setMessage(`ZIP下载失败: ${response.status}`);
        setMessageType('error');
      }
    } catch (error) {
      console.error('❌ ZIP下载异常:', error);
      setMessage('ZIP下载失败');
      setMessageType('error');
    } finally {
      setDownloading(null);
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

        {teamAssignments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无评审任务</h3>
            <p className="text-gray-500">您还没有被分配任何评审任务。</p>
          </div>
        ) : (
          <div className="space-y-4">
            {teamAssignments.map((teamAssignment) => (
              <div key={teamAssignment.team_name} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {teamAssignment.team_name}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(teamAssignment.status)}`}>
                        {getStatusText(teamAssignment.status)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>文件数量: {teamAssignment.assignments.length} 个</p>
                      <p>分配时间: {new Date(teamAssignment.assignments[0]?.created_at).toLocaleString()}</p>
                      {teamAssignment.overall_score !== null && (
                        <p>已评分: {teamAssignment.overall_score}分</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDownloadZip(teamAssignment)}
                      disabled={downloading === teamAssignment.team_name}
                      className="btn-secondary text-sm disabled:opacity-50"
                    >
                      {downloading === teamAssignment.team_name ? '⏳ 准备中...' : '📦 下载ZIP'}
                    </button>
                    <button
                      onClick={() => handleStartReview(teamAssignment)}
                      className="btn-primary text-sm"
                    >
                      {teamAssignment.status === 'completed' ? '修改评审' : 
                       teamAssignment.status === 'assigned' ? '开始评审' : '继续评审'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 评审表单模态框 */}
      {selectedTeam && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  评审团队 - {selectedTeam.team_name}
                </h3>
                <button
                  onClick={() => setSelectedTeam(null)}
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
                    onClick={() => setSelectedTeam(null)}
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
