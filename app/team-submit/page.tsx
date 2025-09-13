'use client';

import { useState } from 'react';

export default function TeamSubmitPage() {
  const [teamInfo, setTeamInfo] = useState({
    teamName: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    teamDescription: ''
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const handleTeamInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTeamInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // 检查文件类型 - 只允许PDF
      if (selectedFile.type !== 'application/pdf') {
        setMessage('只支持PDF格式文件，请选择PDF文件');
        setMessageType('error');
        return;
      }

      // 检查文件大小 (10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setMessage('文件大小不能超过10MB');
        setMessageType('error');
        return;
      }

      setFile(selectedFile);
      setMessage('');
      setMessageType('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证必填字段
    if (!teamInfo.teamName.trim()) {
      setMessage('请输入团队名称');
      setMessageType('error');
      return;
    }

    if (!file) {
      setMessage('请选择要上传的作品文件');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('teamInfo', JSON.stringify(teamInfo));

      const response = await fetch('/api/team-submit', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setMessage('作品提交成功！您的团队作品已成功提交，请等待专家评审。');
        setMessageType('success');
        setFile(null);
        setTeamInfo({
          teamName: '',
          contactPerson: '',
          contactPhone: '',
          contactEmail: '',
          teamDescription: ''
        });
        // 重置文件输入
        const fileInput = document.getElementById('file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        setMessage(data.error || '提交失败');
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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              团队作品提交系统
            </h1>
            <p className="text-lg text-gray-600">
              请填写团队信息并上传您的参赛作品
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 团队信息 */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">团队信息</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="teamName" className="form-label">
                    团队名称 *
                  </label>
                  <input
                    id="teamName"
                    name="teamName"
                    type="text"
                    value={teamInfo.teamName}
                    onChange={handleTeamInfoChange}
                    className="form-input"
                    placeholder="请输入团队名称"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="contactPerson" className="form-label">
                    联系人姓名
                  </label>
                  <input
                    id="contactPerson"
                    name="contactPerson"
                    type="text"
                    value={teamInfo.contactPerson}
                    onChange={handleTeamInfoChange}
                    className="form-input"
                    placeholder="请输入联系人姓名"
                  />
                </div>

                <div>
                  <label htmlFor="contactPhone" className="form-label">
                    联系电话
                  </label>
                  <input
                    id="contactPhone"
                    name="contactPhone"
                    type="tel"
                    value={teamInfo.contactPhone}
                    onChange={handleTeamInfoChange}
                    className="form-input"
                    placeholder="请输入联系电话"
                  />
                </div>

                <div>
                  <label htmlFor="contactEmail" className="form-label">
                    联系邮箱
                  </label>
                  <input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    value={teamInfo.contactEmail}
                    onChange={handleTeamInfoChange}
                    className="form-input"
                    placeholder="请输入联系邮箱"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="teamDescription" className="form-label">
                  团队介绍
                </label>
                <textarea
                  id="teamDescription"
                  name="teamDescription"
                  value={teamInfo.teamDescription}
                  onChange={handleTeamInfoChange}
                  className="form-input"
                  rows={3}
                  placeholder="请简要介绍您的团队和作品..."
                />
              </div>
            </div>

            {/* 文件上传 */}
            <div className="bg-green-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">作品文件</h2>
              
              <div>
                <label htmlFor="file" className="form-label">
                  选择作品文件 *
                </label>
                <input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  className="form-input"
                  accept=".pdf,application/pdf"
                  required
                />
                {file && (
                  <p className="mt-2 text-sm text-gray-600">
                    已选择: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  支持PDF、DOC、DOCX、图片和文本文件，单个文件最大10MB
                </p>
              </div>
            </div>

            {message && (
              <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`}>
                {message}
              </div>
            )}

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading || !file || !teamInfo.teamName.trim()}
                className="btn-primary disabled:opacity-50 px-8 py-3 text-lg"
              >
                {loading ? '提交中...' : '提交作品'}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">提交说明</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• 请确保团队名称准确，这将作为评审时的标识</li>
              <li>• 请确保文件格式正确，大小不超过10MB</li>
              <li>• 提交后无法修改，请仔细检查所有信息</li>
              <li>• 您的团队信息将被加密存储，确保隐私安全</li>
              <li>• 作品将由专业评审团队进行盲审</li>
              <li>• 评审结果将通过邮件或电话通知</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
