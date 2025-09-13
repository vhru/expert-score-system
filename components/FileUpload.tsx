'use client';

import { useState } from 'react';

interface FileUploadProps {
  token: string;
  onUploadSuccess: () => void;
}

export default function FileUpload({ token, onUploadSuccess }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [personalInfo, setPersonalInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // 检查文件类型
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/gif',
        'text/plain'
      ];

      if (!allowedTypes.includes(selectedFile.type)) {
        setMessage('不支持的文件类型，请选择PDF、DOC、DOCX、图片或文本文件');
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
    
    if (!file) {
      setMessage('请选择要上传的文件');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('personalInfo', personalInfo);

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setMessage('文件上传成功！');
        setMessageType('success');
        setFile(null);
        setPersonalInfo('');
        // 重置文件输入
        const fileInput = document.getElementById('file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        onUploadSuccess();
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
        <h2 className="text-lg font-medium text-gray-900 mb-4">文件上传</h2>
        <p className="text-sm text-gray-600 mb-6">
          支持PDF、DOC、DOCX、图片和文本文件，单个文件最大10MB
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="file" className="form-label">
            选择文件 *
          </label>
          <input
            id="file"
            type="file"
            onChange={handleFileChange}
            className="form-input"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
            required
          />
          {file && (
            <p className="mt-2 text-sm text-gray-600">
              已选择: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        <div>
          <label htmlFor="personalInfo" className="form-label">
            个人信息（可选）
          </label>
          <textarea
            id="personalInfo"
            value={personalInfo}
            onChange={(e) => setPersonalInfo(e.target.value)}
            className="form-input"
            rows={4}
            placeholder="请输入相关信息，此信息将被加密存储..."
          />
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
            disabled={loading || !file}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? '上传中...' : '上传文件'}
          </button>
        </div>
      </form>
    </div>
  );
}
