'use client';

import { useState, useEffect } from 'react';
import { decryptData } from '@/lib/encryption';

interface ExpertManagementProps {
  token: string;
}

interface Expert {
  id: number;
  username: string;
  role: string;
  expert_type?: string;
  encrypted_info: string;
  created_at: string;
  personalInfo?: any;
}

export default function ExpertManagement({ token }: ExpertManagementProps) {
  const [activeTab, setActiveTab] = useState('list');
  const [singleExpert, setSingleExpert] = useState({
    username: '',
    password: '',
    personalInfo: '',
    expertType: 'team'
  });
  const [batchExperts, setBatchExperts] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [experts, setExperts] = useState<Expert[]>([]);
  const [expertsLoading, setExpertsLoading] = useState(true);
  const [editingExpert, setEditingExpert] = useState<Expert | null>(null);
  const [editForm, setEditForm] = useState({
    username: '',
    password: '',
    personalInfo: '',
    expertType: 'team'
  });

  const fetchExperts = async () => {
    try {
      const response = await fetch('/api/admin/experts', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setExperts(data.experts);
      }
    } catch (error) {
      console.error('Failed to fetch experts:', error);
    } finally {
      setExpertsLoading(false);
    }
  };

  useEffect(() => {
    fetchExperts();
  }, []);

  const handleEditExpert = (expert: Expert) => {
    try {
      const personalInfo = expert.encrypted_info ? JSON.parse(decryptData(expert.encrypted_info)) : '';
      setEditingExpert(expert);
      setEditForm({
        username: expert.username,
        password: '', // 不显示密码
        personalInfo: personalInfo || '',
        expertType: expert.expert_type || 'team'
      });
    } catch (error) {
      setEditingExpert(expert);
      setEditForm({
        username: expert.username,
        password: '',
        personalInfo: expert.encrypted_info || '',
        expertType: expert.expert_type || 'team'
      });
    }
  };

  const handleUpdateExpert = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingExpert) return;
    
    if (!editForm.username.trim()) {
      setMessage('用户名不能为空');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`/api/admin/experts/${editingExpert.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: editForm.username,
          password: editForm.password || undefined, // 只有填写了密码才更新
          personalInfo: editForm.personalInfo
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('专家信息更新成功！');
        setMessageType('success');
        setEditingExpert(null);
        fetchExperts(); // 刷新专家列表
      } else {
        setMessage(data.error || '更新失败');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('网络错误，请重试');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpert = async (expertId: number) => {
    if (!confirm('确定要删除这个专家账号吗？此操作不可恢复。')) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`/api/admin/experts/${expertId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setMessage('专家账号删除成功！');
        setMessageType('success');
        fetchExperts(); // 刷新专家列表
      } else {
        setMessage(data.error || '删除失败');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('网络错误，请重试');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!singleExpert.username || !singleExpert.password) {
      setMessage('用户名和密码不能为空');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/experts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(singleExpert),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('专家创建成功！');
        setMessageType('success');
        setSingleExpert({ username: '', password: '', personalInfo: '', expertType: 'team' });
        fetchExperts(); // 刷新专家列表
      } else {
        setMessage(data.error || '创建失败');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('网络错误，请重试');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!batchExperts.trim()) {
      setMessage('请输入专家信息');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // 解析批量数据
      const lines = batchExperts.trim().split('\n');
      const experts = lines.map(line => {
        const parts = line.split(',');
        return {
          username: parts[0]?.trim() || '',
          password: parts[1]?.trim() || '',
          personalInfo: parts[2]?.trim() || ''
        };
      }).filter(expert => expert.username && expert.password);

      if (experts.length === 0) {
        setMessage('没有有效的专家数据');
        setMessageType('error');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/experts/batch-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ experts }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(data.message);
        setMessageType('success');
        setBatchExperts('');
        fetchExperts(); // 刷新专家列表
      } else {
        setMessage(data.error || '批量创建失败');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('网络错误，请重试');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">专家管理</h2>
        <p className="text-sm text-gray-600 mb-6">
          创建专家账号，用于盲审评审
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('list')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'list'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            专家列表
          </button>
          <button
            onClick={() => setActiveTab('single')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'single'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            单个创建
          </button>
          <button
            onClick={() => setActiveTab('batch')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'batch'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            批量创建
          </button>
        </nav>
      </div>

      {message && (
        <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}

      {activeTab === 'list' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">已注册专家</h3>
            <button
              onClick={fetchExperts}
              className="btn-secondary"
            >
              刷新列表
            </button>
          </div>

          {expertsLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">加载中...</span>
            </div>
          ) : experts.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-2">👥</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无专家</h3>
              <p className="text-gray-500">还没有创建任何专家账号。</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {experts.map((expert) => (
                  <li key={expert.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <h4 className="text-lg font-medium text-gray-900">
                            {expert.username}
                          </h4>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {expert.role}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            expert.expert_type === 'enterprise' 
                              ? 'bg-orange-100 text-orange-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {expert.expert_type === 'enterprise' ? '企业专家' : '团队专家'}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          注册时间: {new Date(expert.created_at).toLocaleString()}
                        </div>
                        {expert.personalInfo && (
                          <div className="mt-1 text-sm text-gray-600">
                            个人信息: {expert.personalInfo}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditExpert(expert)}
                          className="btn-secondary text-sm"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDeleteExpert(expert.id)}
                          className="btn-danger text-sm"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {activeTab === 'single' && (
        <form onSubmit={handleSingleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="form-label">
              用户名 *
            </label>
            <input
              id="username"
              type="text"
              value={singleExpert.username}
              onChange={(e) => setSingleExpert({ ...singleExpert, username: e.target.value })}
              className="form-input"
              placeholder="输入专家用户名"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="form-label">
              密码 *
            </label>
            <input
              id="password"
              type="password"
              value={singleExpert.password}
              onChange={(e) => setSingleExpert({ ...singleExpert, password: e.target.value })}
              className="form-input"
              placeholder="输入专家密码"
              required
            />
          </div>

          <div>
            <label htmlFor="expertType" className="form-label">
              专家类型 *
            </label>
            <select
              id="expertType"
              value={singleExpert.expertType}
              onChange={(e) => setSingleExpert({ ...singleExpert, expertType: e.target.value })}
              className="form-input"
              required
            >
              <option value="team">团队专家 - 评审团队组作品</option>
              <option value="enterprise">企业专家 - 评审企业组作品</option>
            </select>
          </div>

          <div>
            <label htmlFor="personalInfo" className="form-label">
              个人信息（可选）
            </label>
            <textarea
              id="personalInfo"
              value={singleExpert.personalInfo}
              onChange={(e) => setSingleExpert({ ...singleExpert, personalInfo: e.target.value })}
              className="form-input"
              rows={3}
              placeholder="输入专家相关信息..."
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? '创建中...' : '创建专家'}
            </button>
          </div>
        </form>
      )}

      {activeTab === 'batch' && (
        <form onSubmit={handleBatchSubmit} className="space-y-6">
          <div>
            <label htmlFor="batchExperts" className="form-label">
              批量专家信息 *
            </label>
            <textarea
              id="batchExperts"
              value={batchExperts}
              onChange={(e) => setBatchExperts(e.target.value)}
              className="form-input"
              rows={10}
              placeholder="每行一个专家，格式：用户名,密码,个人信息&#10;例如：&#10;expert1,password123,张三&#10;expert2,password456,李四"
            />
            <p className="mt-1 text-sm text-gray-500">
              格式：用户名,密码,个人信息（每行一个专家）
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? '创建中...' : '批量创建'}
            </button>
          </div>
        </form>
      )}

      {/* 编辑专家模态框 */}
      {editingExpert && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  编辑专家信息
                </h3>
                <button
                  onClick={() => setEditingExpert(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">关闭</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleUpdateExpert} className="space-y-4">
                <div>
                  <label htmlFor="edit-username" className="form-label">
                    用户名 *
                  </label>
                  <input
                    id="edit-username"
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="form-input"
                    placeholder="输入专家用户名"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="edit-password" className="form-label">
                    新密码 (留空则不修改)
                  </label>
                  <input
                    id="edit-password"
                    type="password"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    className="form-input"
                    placeholder="输入新密码"
                  />
                </div>

                  <div>
                    <label htmlFor="edit-expertType" className="form-label">
                      专家类型 *
                    </label>
                    <select
                      id="edit-expertType"
                      value={editForm.expertType}
                      onChange={(e) => setEditForm({ ...editForm, expertType: e.target.value })}
                      className="form-input"
                      required
                    >
                      <option value="team">团队专家 - 评审团队组作品</option>
                      <option value="enterprise">企业专家 - 评审企业组作品</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="edit-personalInfo" className="form-label">
                      个人信息
                    </label>
                    <textarea
                      id="edit-personalInfo"
                      value={editForm.personalInfo}
                      onChange={(e) => setEditForm({ ...editForm, personalInfo: e.target.value })}
                      className="form-input"
                      rows={3}
                      placeholder="输入专家相关信息..."
                    />
                  </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setEditingExpert(null)}
                    className="btn-secondary"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary disabled:opacity-50"
                  >
                    {loading ? '更新中...' : '更新专家'}
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
