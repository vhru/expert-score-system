'use client';

import { useState, useEffect } from 'react';
import { decryptData } from '@/lib/encryption';

interface TeamManagementProps {
  token: string;
  onUpdate: () => void;
}

interface Team {
  id: number;
  team_name: string;
  contact_email: string;
  encrypted_info: string;
  is_enterprise: boolean;
  enterprise_name?: string;
  enterprise_license?: string;
  status: string;
  created_at: string;
  updated_at: string;
  // 新增字段
  project_name?: string;
  project_brief?: string;
  project_stage?: string;
  contact_person_name?: string;
  contact_person_position?: string;
  contact_person_phone?: string;
  contact_person_email?: string;
  registration_country?: string;
  core_members_nationality?: string;
  registration_year?: number;
  unified_social_credit_code?: string;
  legal_representative?: string;
  headquarters_location?: string;
  registered_capital_usd?: number;
  website?: string;
  enterprise_overview?: string;
  // 关联数据
  images?: TeamImage[];
  coreMembers?: CoreMember[];
  documents?: TeamDocument[];
  reviewCompletionStatus?: string; // 评审完成状态
  reviewStatus?: {
    totalAssignments: number;
    completedAssignments: number;
    averageScore: string | null;
    assignments: {
      expertId: number;
      expertName: string;
      status: string;
      score: number | null;
      comments: string | null;
      createdAt: string;
      updatedAt: string;
    }[];
  };
}

interface TeamImage {
  id: number;
  image_name: string;
  image_path: string;
  image_size: number;
  mime_type: string;
  created_at: string;
}

interface CoreMember {
  id: number;
  team_id: number;
  member_order: number;
  name: string;
  nationality: string;
  gender: string;
  birth_date: string;
  id_type: string;
  id_number: string;
  phone: string;
  email: string;
  university: string;
  highest_degree: string;
  organization: string;
  position: string;
  cv_path?: string;
  created_at: string;
}

interface TeamDocument {
  id: number;
  team_id: number;
  document_type: string;
  document_name: string;
  document_path: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

export default function TeamManagement({ token, onUpdate }: TeamManagementProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/admin/teams', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setTeams(data.teams);
      }
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleViewDetails = (team: Team) => {
    try {
      // 解密团队信息
      const teamInfo = JSON.parse(decryptData(team.encrypted_info));
      setSelectedTeam({ ...team, teamInfo });
      setShowDetails(true);
    } catch (error) {
      console.error('Failed to decrypt team info:', error);
      setSelectedTeam(team);
      setShowDetails(true);
    }
  };

  const handleDownloadFile = async (team: Team) => {
    try {
      const response = await fetch(`/api/admin/download/${team.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = team.team_name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to download file:', error);
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '活跃';
      case 'inactive':
        return '非活跃';
      case 'suspended':
        return '已暂停';
      default:
        return '未知';
    }
  };

  // 获取评审状态颜色
  const getReviewStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'not_assigned':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 获取评审状态文本
  const getReviewStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'in_progress':
        return '评审中';
      case 'assigned':
        return '已分配';
      case 'not_assigned':
        return '未分配';
      default:
        return '未知';
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
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">加载中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">团队管理</h2>
        <button
          onClick={fetchTeams}
          className="btn-secondary"
        >
          刷新列表
        </button>
      </div>

      {teams.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🏆</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无团队作品</h3>
          <p className="text-gray-500">还没有团队提交作品，请等待团队提交。</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {teams.map((team) => (
              <li key={team.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {team.team_name}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getReviewStatusColor(team.reviewCompletionStatus || 'not_assigned')}`}>
                        {getReviewStatusText(team.reviewCompletionStatus || 'not_assigned')}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                      <span>团队类型: {team.is_enterprise ? '企业组' : '团队组'}</span>
                      <span>项目名称: {team.project_name || '未填写'}</span>
                      <span>注册时间: {new Date(team.created_at).toLocaleString()}</span>
                    </div>
                    {team.reviewStatus && (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-gray-600">
                            评审状态: {team.reviewStatus.completedAssignments}/{team.reviewStatus.totalAssignments} 完成
                          </span>
                          {team.reviewStatus.averageScore && (
                            <span className="text-green-600 font-medium">
                              平均分: {team.reviewStatus.averageScore}分
                            </span>
                          )}
                          {team.reviewStatus.totalAssignments === 0 && (
                            <span className="text-yellow-600">
                              待分配专家
                            </span>
                          )}
                        </div>
                        {team.reviewStatus.assignments.length > 0 && (
                          <div className="text-sm">
                            <span className="text-gray-600">分配专家: </span>
                            {team.reviewStatus.assignments.map((assignment, index) => (
                              <span key={assignment.expertId} className="inline-flex items-center">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  assignment.status === 'completed' 
                                    ? 'bg-green-100 text-green-800' 
                                    : assignment.status === 'in_progress'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {assignment.expertName}
                                  {assignment.score !== null && ` (${assignment.score}分)`}
                                </span>
                                {index < team.reviewStatus.assignments.length - 1 && <span className="mx-1">, </span>}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewDetails(team)}
                      className="btn-secondary text-sm"
                    >
                      查看详情
                    </button>
                    <button
                      onClick={() => handleDownloadFile(team)}
                      className="btn-primary text-sm"
                    >
                      下载文件
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 团队详情模态框 */}
      {showDetails && selectedTeam && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  团队详情 - {selectedTeam.team_name}
                </h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">关闭</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* 基本信息 */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">基本信息</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">团队名称:</span>
                      <p className="font-medium">{selectedTeam.team_name}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">项目名称:</span>
                      <p className="font-medium">{selectedTeam.project_name || '未填写'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">团队类型:</span>
                      <p className="font-medium">{selectedTeam.is_enterprise ? '企业组' : '团队组'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">状态:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedTeam.status)}`}>
                        {getStatusText(selectedTeam.status)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">联系邮箱:</span>
                      <p className="font-medium">{selectedTeam.contact_email}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">注册时间:</span>
                      <p className="font-medium">{new Date(selectedTeam.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* 团队信息 */}
                {selectedTeam.teamInfo && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">团队信息</h4>
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">团队名称:</span>
                        <p className="font-medium">{selectedTeam.teamInfo.teamName}</p>
                      </div>
                      {selectedTeam.teamInfo.contactPerson && (
                        <div>
                          <span className="text-gray-500">联系人:</span>
                          <p className="font-medium">{selectedTeam.teamInfo.contactPerson}</p>
                        </div>
                      )}
                      {selectedTeam.teamInfo.contactPhone && (
                        <div>
                          <span className="text-gray-500">联系电话:</span>
                          <p className="font-medium">{selectedTeam.teamInfo.contactPhone}</p>
                        </div>
                      )}
                      {selectedTeam.teamInfo.contactEmail && (
                        <div>
                          <span className="text-gray-500">联系邮箱:</span>
                          <p className="font-medium">{selectedTeam.teamInfo.contactEmail}</p>
                        </div>
                      )}
                      {selectedTeam.teamInfo.teamDescription && (
                        <div>
                          <span className="text-gray-500">团队介绍:</span>
                          <p className="font-medium">{selectedTeam.teamInfo.teamDescription}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 企业信息 */}
                {selectedTeam.is_enterprise && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">企业信息</h4>
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">企业名称:</span>
                        <p className="font-medium">{selectedTeam.enterprise_name || '未填写'}</p>
                      </div>
                      {selectedTeam.enterprise_license && (
                        <div>
                          <span className="text-gray-500">企业资质证书:</span>
                          <p className="font-medium">{selectedTeam.enterprise_license}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 团队图片 */}
                {selectedTeam.images && selectedTeam.images.length > 0 && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">团队图片 ({selectedTeam.images.length}张)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedTeam.images.map((image) => (
                        <div key={image.id} className="relative group">
                          <img
                            src={`/api/admin/team-images/${image.id}`}
                            alt={image.image_name}
                            className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => window.open(`/api/admin/team-images/${image.id}`, '_blank')}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                              </svg>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 truncate">{image.image_name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 提交时间 */}
                <div className="text-sm text-gray-500">
                  提交时间: {new Date(selectedTeam.created_at).toLocaleString()}
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowDetails(false)}
                  className="btn-secondary"
                >
                  关闭
                </button>
                <button
                  onClick={() => handleDownloadFile(selectedTeam)}
                  className="btn-primary"
                >
                  下载文件
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
