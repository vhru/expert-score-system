'use client';

import { useState } from 'react';

interface PhotoUploadProps {
  token: string;
  onUploadSuccess?: () => void;
}

export default function PhotoUpload({ token, onUploadSuccess }: PhotoUploadProps) {
  const [photo, setPhoto] = useState<File | null>(null);
  const [personalInfo, setPersonalInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 检查文件大小（10MB限制）
      if (file.size > 10 * 1024 * 1024) {
        setMessage('文件大小不能超过10MB');
        setMessageType('error');
        return;
      }
      
      // 检查文件类型
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setMessage('只支持JPG、PNG格式的图片');
        setMessageType('error');
        return;
      }
      
      setPhoto(file);
      setMessage('');
      setMessageType('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!photo) {
      setMessage('请选择照片');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('photo', photo);
      formData.append('personalInfo', personalInfo);

      const response = await fetch('/api/upload-photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setMessage('照片上传成功！');
        setMessageType('success');
        setPhoto(null);
        setPersonalInfo('');
        if (onUploadSuccess) {
          onUploadSuccess();
        }
      } else {
        setMessage(data.error || '上传失败');
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
        <h2 className="text-lg font-medium text-gray-900 mb-4">照片上传</h2>
        <p className="text-sm text-gray-600 mb-6">
          支持JPG、PNG格式，单个文件最大10MB
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="photo" className="form-label">
            选择照片 *
          </label>
          <input
            id="photo"
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handlePhotoChange}
            className="form-input"
            required
          />
          {photo && (
            <div className="mt-2">
              <p className="text-sm text-gray-600">
                已选择: {photo.name} ({(photo.size / 1024 / 1024).toFixed(2)} MB)
              </p>
              <p className="text-xs text-gray-500 mt-1">
                仅做大赛使用
              </p>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="personalInfo" className="form-label">
            个人信息（必填）
          </label>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="姓名 *"
              className="form-input"
              required
            />
            <input
              type="email"
              placeholder="邮箱 *"
              className="form-input"
              required
            />
            <select className="form-input" required>
              <option value="">请选择证件类型 *</option>
              <option value="id_card">国内身份证</option>
              <option value="passport">外籍护照</option>
            </select>
            <input
              type="text"
              placeholder="证件号码 *"
              className="form-input"
              required
            />
            <textarea
              id="personalInfo"
              value={personalInfo}
              onChange={(e) => setPersonalInfo(e.target.value)}
              className="form-input"
              rows={3}
              placeholder="其他信息（选填）"
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            此信息将被AES加密存储，仅用于评审参考
          </p>
        </div>

        {message && (
          <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`}>
            {message}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !photo}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? '上传中...' : '上传照片'}
          </button>
        </div>
      </form>
    </div>
  );
}
