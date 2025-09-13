'use client';

import { useState } from 'react';

export default function TeamRegisterPage() {
  const [teamInfo, setTeamInfo] = useState({
    teamName: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    teamDescription: '',
    password: '',
    confirmPassword: '',
    isEnterprise: false,
    enterpriseName: '',
    enterpriseLicense: ''
  });
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setTeamInfo(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // 检查文件类型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    const validFiles = selectedFiles.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        setMessage(`文件 ${file.name} 格式不支持，只支持 JPG、PNG、GIF 格式`);
        setMessageType('error');
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        setMessage(`文件 ${file.name} 过大，不能超过10MB`);
        setMessageType('error');
        return false;
      }
      return true;
    });
    
    if (validFiles.length > 0) {
      setImages(prev => [...prev, ...validFiles].slice(0, 5)); // 最多5张图片
      setMessage('');
      setMessageType('');
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证必填字段
    if (!teamInfo.teamName.trim()) {
      setMessage('请输入团队名称');
      setMessageType('error');
      return;
    }

    if (!teamInfo.contactEmail.trim()) {
      setMessage('请输入联系邮箱');
      setMessageType('error');
      return;
    }

    if (!teamInfo.password) {
      setMessage('请输入密码');
      setMessageType('error');
      return;
    }

    if (teamInfo.password !== teamInfo.confirmPassword) {
      setMessage('两次输入的密码不一致');
      setMessageType('error');
      return;
    }

    // 企业团队验证
    if (teamInfo.isEnterprise && !teamInfo.enterpriseName.trim()) {
      setMessage('企业团队必须填写企业名称');
      setMessageType('error');
      return;
    }

    if (teamInfo.password.length < 6) {
      setMessage('密码长度至少6位');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // 创建FormData用于文件上传
      const formData = new FormData();
      formData.append('teamInfo', JSON.stringify(teamInfo));
      
      // 添加图片文件
      images.forEach((image, index) => {
        formData.append(`image_${index}`, image);
      });

      const response = await fetch('/api/teams/register', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setMessage('团队注册成功！您现在可以登录并提交作品了。');
        setMessageType('success');
        setTeamInfo({
          teamName: '',
          contactPerson: '',
          contactPhone: '',
          contactEmail: '',
          teamDescription: '',
          password: '',
          confirmPassword: '',
          isEnterprise: false,
          enterpriseName: '',
          enterpriseLicense: ''
        });
        setImages([]);
      } else {
        setMessage(data.error || '注册失败');
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
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              团队注册
            </h1>
            <p className="text-lg text-gray-600">
              注册团队账号，管理您的参赛作品
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="请输入联系电话"
                />
              </div>

              <div>
                <label htmlFor="contactEmail" className="form-label">
                  联系邮箱 *
                </label>
                <input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  value={teamInfo.contactEmail}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="请输入联系邮箱"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="teamDescription" className="form-label">
                团队介绍
              </label>
              <textarea
                id="teamDescription"
                name="teamDescription"
                value={teamInfo.teamDescription}
                onChange={handleInputChange}
                className="form-input"
                rows={3}
                placeholder="请简要介绍您的团队..."
              />
            </div>

            {/* 企业信息 */}
            <div className="border-t pt-6">
              <div className="flex items-center mb-4">
                <input
                  id="isEnterprise"
                  name="isEnterprise"
                  type="checkbox"
                  checked={teamInfo.isEnterprise}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isEnterprise" className="ml-2 block text-sm font-medium text-gray-900">
                  是否为企业团队
                </label>
              </div>

              {teamInfo.isEnterprise && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="enterpriseName" className="form-label">
                      企业名称 *
                    </label>
                    <input
                      id="enterpriseName"
                      name="enterpriseName"
                      type="text"
                      value={teamInfo.enterpriseName}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="请输入企业名称"
                    />
                  </div>

                  <div>
                    <label htmlFor="enterpriseLicense" className="form-label">
                      企业资质证书
                    </label>
                    <input
                      id="enterpriseLicense"
                      name="enterpriseLicense"
                      type="text"
                      value={teamInfo.enterpriseLicense}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="请输入企业资质证书编号"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 图片上传 */}
            <div className="border-t pt-6">
              <label className="form-label">
                团队图片 (最多5张，支持JPG、PNG、GIF格式)
              </label>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/gif"
                onChange={handleImageChange}
                className="form-input"
              />
              
              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`预览 ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                      >
                        ×
                      </button>
                      <p className="text-xs text-gray-500 mt-1 truncate">{image.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="form-label">
                  密码 *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={teamInfo.password}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="请输入密码（至少6位）"
                  required
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="form-label">
                  确认密码 *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={teamInfo.confirmPassword}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="请再次输入密码"
                  required
                />
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
                disabled={loading}
                className="btn-primary disabled:opacity-50 px-8 py-3 text-lg"
              >
                {loading ? '注册中...' : '注册团队'}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              已有团队账号？{' '}
              <a href="/team-login" className="text-blue-600 hover:text-blue-800 font-medium">
                立即登录
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
