'use client';

import { useState, useEffect } from 'react';

interface TeamAudit {
  id: number;
  team_name: string;
  contact_email: string;
  is_enterprise: boolean;
  enterprise_name?: string;
  project_name?: string;
  project_brief?: string;
  project_stage?: string;
  contact_person_name?: string;
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
  audit_status: 'pending' | 'approved' | 'rejected';
  audit_notes?: string;
  audited_at?: string;
  audited_by?: string;
  created_at: string;
  documents: any[];
  coreMembers: any[];
  images: any[];
}

export default function AdminAuditPage() {
  const [teams, setTeams] = useState<TeamAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<TeamAudit | null>(null);
  const [auditNotes, setAuditNotes] = useState('');
  const [auditing, setAuditing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const token = localStorage.getItem('token');
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

  const handleAudit = async (teamId: number, status: 'approved' | 'rejected') => {
    setAuditing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/audit-team', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId,
          status,
          notes: auditNotes
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        setSelectedTeam(null);
        setAuditNotes('');
        fetchTeams(); // 刷新列表
      } else {
        alert(data.error || '审核失败');
      }
    } catch (error) {
      console.error('Audit error:', error);
      alert('审核失败');
    } finally {
      setAuditing(false);
    }
  };

  const handleDownloadDocument = async (document: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/download-document/${document.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = document.document_name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const handleDownloadZip = async (team: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/teams/${team.id}/download-zip`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '下载失败');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // 从响应头获取文件名，如果没有则使用默认名称
      const contentDisposition = response.headers.get('Content-Disposition');
      let fileName = `${team.team_name}_${team.contact_email}_${team.is_enterprise ? '企业组' : '团队组'}.zip`;
      
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch) {
          fileName = decodeURIComponent(fileNameMatch[1]);
        }
      }
      
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('ZIP下载错误:', error);
      alert(`ZIP下载失败: ${error.message}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待审核';
      case 'approved': return '审核通过';
      case 'rejected': return '审核不通过';
      default: return '未知';
    }
  };

  const filteredTeams = teams.filter(team => {
    if (filter === 'all') return true;
    return team.audit_status === filter;
  });

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
            <h1 className="text-xl font-semibold text-gray-900">团队审核管理</h1>
            <div className="flex items-center space-x-4">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">全部</option>
                <option value="pending">待审核</option>
                <option value="approved">审核通过</option>
                <option value="rejected">审核不通过</option>
              </select>
              <a
                href="/admin-dashboard"
                className="text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                返回管理后台
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 团队列表 */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">团队列表</h2>
                <p className="text-sm text-gray-500 mt-1">
                  共 {filteredTeams.length} 个团队
                </p>
              </div>
              <div className="divide-y divide-gray-200">
                {filteredTeams.map((team) => (
                  <div
                    key={team.id}
                    onClick={() => setSelectedTeam(team)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${
                      selectedTeam?.id === team.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {team.team_name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {team.contact_email}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(team.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(team.audit_status)}`}>
                        {getStatusText(team.audit_status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 团队详情 */}
          <div className="lg:col-span-2">
            {selectedTeam ? (
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium text-gray-900">
                      {selectedTeam.team_name} - 详细信息
                    </h2>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedTeam.audit_status)}`}>
                      {getStatusText(selectedTeam.audit_status)}
                    </span>
                  </div>
                </div>

                <div className="px-6 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 基本信息 */}
                    <div>
                      <h3 className="text-md font-medium text-gray-900 mb-3">基本信息</h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">团队名称:</span> {selectedTeam.team_name}</p>
                        <p><span className="font-medium">联系邮箱:</span> {selectedTeam.contact_email}</p>
                        <p><span className="font-medium">团队类型:</span> {selectedTeam.is_enterprise ? '企业团队' : '普通团队'}</p>
                        {selectedTeam.project_name && <p><span className="font-medium">项目名称:</span> {selectedTeam.project_name}</p>}
                        {selectedTeam.project_brief && <p><span className="font-medium">项目简介:</span> {selectedTeam.project_brief}</p>}
                        {selectedTeam.project_stage && <p><span className="font-medium">项目阶段:</span> {selectedTeam.project_stage}</p>}
                      </div>
                    </div>

                    {/* 联系人信息 */}
                    <div>
                      <h3 className="text-md font-medium text-gray-900 mb-3">联系人信息</h3>
                      <div className="space-y-2 text-sm">
                        {selectedTeam.contact_person_name && <p><span className="font-medium">联系人:</span> {selectedTeam.contact_person_name}</p>}
                        {selectedTeam.contact_person_phone && <p><span className="font-medium">联系电话:</span> {selectedTeam.contact_person_phone}</p>}
                        {selectedTeam.contact_person_email && <p><span className="font-medium">联系邮箱:</span> {selectedTeam.contact_person_email}</p>}
                        {selectedTeam.registration_country && <p><span className="font-medium">注册国家:</span> {selectedTeam.registration_country}</p>}
                        {selectedTeam.registration_year && <p><span className="font-medium">注册年份:</span> {selectedTeam.registration_year}</p>}
                      </div>
                    </div>
                  </div>

                  {/* 企业信息 */}
                  {selectedTeam.is_enterprise && (
                    <div className="mt-6">
                      <h3 className="text-md font-medium text-gray-900 mb-3">企业信息</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          {selectedTeam.enterprise_name && <p><span className="font-medium">企业名称:</span> {selectedTeam.enterprise_name}</p>}
                          {selectedTeam.unified_social_credit_code && <p><span className="font-medium">统一社会信用代码:</span> {selectedTeam.unified_social_credit_code}</p>}
                          {selectedTeam.legal_representative && <p><span className="font-medium">法定代表人:</span> {selectedTeam.legal_representative}</p>}
                        </div>
                        <div>
                          {selectedTeam.headquarters_location && <p><span className="font-medium">总部位置:</span> {selectedTeam.headquarters_location}</p>}
                          {selectedTeam.registered_capital_usd && <p><span className="font-medium">注册资本(美元):</span> {selectedTeam.registered_capital_usd.toLocaleString()}</p>}
                          {selectedTeam.website && <p><span className="font-medium">网站:</span> <a href={selectedTeam.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{selectedTeam.website}</a></p>}
                        </div>
                      </div>
                      {selectedTeam.enterprise_overview && (
                        <div className="mt-4">
                          <p className="font-medium text-sm">企业概述:</p>
                          <p className="text-sm text-gray-600 mt-1">{selectedTeam.enterprise_overview}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 核心成员 */}
                  {selectedTeam.coreMembers && selectedTeam.coreMembers.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-md font-medium text-gray-900 mb-3">核心成员</h3>
                      <div className="space-y-3">
                        {selectedTeam.coreMembers.map((member, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-3 text-sm">
                            <p><span className="font-medium">姓名:</span> {member.name}</p>
                            <p><span className="font-medium">国籍:</span> {member.nationality}</p>
                            <p><span className="font-medium">性别:</span> {member.gender}</p>
                            <p><span className="font-medium">出生日期:</span> {member.birth_date}</p>
                            <p><span className="font-medium">学历:</span> {member.highest_degree}</p>
                            <p><span className="font-medium">组织:</span> {member.organization}</p>
                            <p><span className="font-medium">职位:</span> {member.position}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 文档列表 */}
                  {selectedTeam.documents && selectedTeam.documents.length > 0 && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-md font-medium text-gray-900">提交文档</h3>
                        <button
                          onClick={() => handleDownloadZip(selectedTeam)}
                          className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium"
                        >
                          📦 下载ZIP包
                        </button>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-2">
                          共 {selectedTeam.documents.length} 个文档，总大小: {(selectedTeam.documents.reduce((sum, doc) => sum + doc.file_size, 0) / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {selectedTeam.documents.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between text-sm">
                              <span className="text-gray-700">{doc.document_name}</span>
                              <span className="text-gray-500">{(doc.file_size / 1024 / 1024).toFixed(2)} MB</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 审核操作 */}
                  {selectedTeam.audit_status === 'pending' && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h3 className="text-md font-medium text-gray-900 mb-3">审核操作</h3>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="audit-notes" className="block text-sm font-medium text-gray-700 mb-2">
                            审核备注
                          </label>
                          <textarea
                            id="audit-notes"
                            rows={3}
                            value={auditNotes}
                            onChange={(e) => setAuditNotes(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="请输入审核意见..."
                          />
                        </div>
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => handleAudit(selectedTeam.id, 'approved')}
                            disabled={auditing}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                          >
                            {auditing ? '审核中...' : '审核通过'}
                          </button>
                          <button
                            onClick={() => handleAudit(selectedTeam.id, 'rejected')}
                            disabled={auditing}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                          >
                            {auditing ? '审核中...' : '审核不通过'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 审核历史 */}
                  {selectedTeam.audit_status !== 'pending' && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h3 className="text-md font-medium text-gray-900 mb-3">审核历史</h3>
                      <div className="bg-gray-50 rounded-lg p-4 text-sm">
                        <p><span className="font-medium">审核状态:</span> {getStatusText(selectedTeam.audit_status)}</p>
                        {selectedTeam.audited_at && <p><span className="font-medium">审核时间:</span> {new Date(selectedTeam.audited_at).toLocaleString()}</p>}
                        {selectedTeam.audited_by && <p><span className="font-medium">审核人:</span> {selectedTeam.audited_by}</p>}
                        {selectedTeam.audit_notes && <p><span className="font-medium">审核备注:</span> {selectedTeam.audit_notes}</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-8 text-center">
                <p className="text-gray-500">请选择一个团队查看详细信息</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
