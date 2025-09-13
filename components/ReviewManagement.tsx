'use client';

import { useState, useEffect } from 'react';

interface ReviewManagementProps {
  token: string;
  onUpdate: () => void;
}

interface Assignment {
  id: number;
  file_id: number;
  expert_id: number;
  assignment_status: string;
  score?: number;
  comments?: string;
  original_name: string;
  expert_name: string;
  created_at: string;
  updated_at: string;
}

export default function ReviewManagement({ token, onUpdate }: ReviewManagementProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [showManualAssign, setShowManualAssign] = useState(false);
  const [availableTeams, setAvailableTeams] = useState<any[]>([]);
  const [availableExperts, setAvailableExperts] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedExperts, setSelectedExperts] = useState<number[]>([]);
  const [filteredExperts, setFilteredExperts] = useState<any[]>([]);

  const fetchAssignments = async () => {
    try {
      const response = await fetch('/api/reviews/all-assignments', {
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

  const handleAssignReviews = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/reviews/assign', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setMessage(data.message);
        setMessageType('success');
        fetchAssignments();
        onUpdate();
      } else {
        setMessage(data.error || '分配失败');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('网络错误，请重试');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableData = async () => {
    try {
      // 获取可用团队
      const teamsResponse = await fetch('/api/admin/teams', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const teamsData = await teamsResponse.json();
      if (teamsData.success) {
        setAvailableTeams(teamsData.teams);
      }

      // 获取可用专家
      const expertsResponse = await fetch('/api/admin/experts', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const expertsData = await expertsResponse.json();
      if (expertsData.success) {
        setAvailableExperts(expertsData.experts);
      }
    } catch (error) {
      console.error('Failed to fetch available data:', error);
    }
  };

  // 根据选择的团队过滤专家
  const filterExpertsByTeam = (teamId: string) => {
    if (!teamId) {
      setFilteredExperts([]);
      return;
    }
    
    const team = availableTeams.find(t => t.id.toString() === teamId);
    if (!team) {
      setFilteredExperts([]);
      return;
    }
    
    const teamType = team.is_enterprise ? 'enterprise' : 'team';
    const matchingExperts = availableExperts.filter(expert => expert.expert_type === teamType);
    setFilteredExperts(matchingExperts);
  };

  // 当选择的团队改变时，过滤专家
  useEffect(() => {
    filterExpertsByTeam(selectedTeam);
    setSelectedExperts([]); // 清空已选择的专家
  }, [selectedTeam, availableTeams, availableExperts]);

  useEffect(() => {
    fetchAssignments();
    fetchAvailableData();
  }, []);

  const handleManualAssign = async () => {
    if (!selectedTeam || selectedExperts.length === 0) {
      setMessage('请选择团队和专家');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/reviews/manual-assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          teamId: parseInt(selectedTeam),
          expertIds: selectedExperts
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('手动分配成功！');
        setMessageType('success');
        setShowManualAssign(false);
        setSelectedTeam('');
        setSelectedExperts([]);
        setFilteredExperts([]);
        fetchAssignments();
        onUpdate();
      } else {
        setMessage(data.error || '分配失败');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('网络错误，请重试');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpert = (expertId: number) => {
    setSelectedExperts(prev => 
      prev.includes(expertId) 
        ? prev.filter(id => id !== expertId)
        : [...prev, expertId]
    );
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'assigned': return '待评审';
      case 'in_progress': return '评审中';
      case 'completed': return '已完成';
      default: return status;
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

  const completedCount = assignments.filter(a => a.assignment_status === 'completed').length;
  const totalCount = assignments.length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-gray-900">评审管理</h2>
          <p className="text-sm text-gray-600">
            管理专家评审任务分配和进度
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleAssignReviews}
            disabled={loading}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? '分配中...' : '自动分配'}
          </button>
          <button
            onClick={() => setShowManualAssign(true)}
            className="btn-secondary"
          >
            手动分配
          </button>
        </div>
      </div>

      {message && (
        <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{totalCount}</div>
          <div className="text-sm text-gray-600">总分配任务</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{completedCount}</div>
          <div className="text-sm text-gray-600">已完成</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-yellow-600">{totalCount - completedCount}</div>
          <div className="text-sm text-gray-600">待完成</div>
        </div>
      </div>

      {/* Assignments List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">评审任务列表</h3>
        </div>
        <div className="overflow-x-auto">
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
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    文件名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    专家
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    评分
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    分配时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    更新时间
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assignments.map((assignment) => (
                  <tr key={assignment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {assignment.team_name || assignment.original_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {assignment.expert_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(assignment.assignment_status)}`}>
                        {getStatusText(assignment.assignment_status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {assignment.score !== null ? `${assignment.score} 分` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(assignment.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(assignment.updated_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 手动分配模态框 */}
      {showManualAssign && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">手动分配评审任务</h3>
                <button
                  onClick={() => setShowManualAssign(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* 选择团队 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择团队
                  </label>
                  <select
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">请选择团队</option>
                    {availableTeams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.team_name} ({team.is_enterprise ? '企业组' : '团队组'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 选择专家 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择专家 (可多选)
                    {selectedTeam && (
                      <span className="text-xs text-gray-500 ml-2">
                        - 只显示匹配的{availableTeams.find(t => t.id.toString() === selectedTeam)?.is_enterprise ? '企业' : '团队'}专家
                      </span>
                    )}
                  </label>
                  <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                    {filteredExperts.length === 0 ? (
                      <div className="text-sm text-gray-500 text-center py-2">
                        {selectedTeam ? '没有匹配的专家' : '请先选择团队'}
                      </div>
                    ) : (
                      filteredExperts.map((expert) => (
                        <label key={expert.id} className="flex items-center space-x-2 py-1">
                          <input
                            type="checkbox"
                            checked={selectedExperts.includes(expert.id)}
                            onChange={() => toggleExpert(expert.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">
                            {expert.username} ({expert.expert_type === 'enterprise' ? '企业专家' : '团队专家'})
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                {/* 按钮 */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowManualAssign(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleManualAssign}
                    disabled={loading || !selectedTeam || selectedExperts.length === 0}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
                  >
                    {loading ? '分配中...' : '确认分配'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
