'use client';

import { useState } from 'react';

export default function SubmitPage() {
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

      const response = await fetch('/api/submit', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setMessage('文件提交成功！您的作品已成功提交，请等待专家评审。');
        setMessageType('success');
        setFile(null);
        setPersonalInfo('');
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
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              作品提交系统
            </h1>
            <p className="text-lg text-gray-600">
              请上传您的参赛作品，我们将安排专家进行盲审
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="file" className="form-label">
                选择作品文件 *
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
              <p className="mt-1 text-sm text-gray-500">
                支持PDF、DOC、DOCX、图片和文本文件，单个文件最大10MB
              </p>
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
                placeholder="请输入您的姓名、联系方式等相关信息..."
              />
              <p className="mt-1 text-sm text-gray-500">
                此信息将被加密存储，仅用于评审参考
              </p>
            </div>

            {message && (
              <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`}>
                {message}
              </div>
            )}

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading || !file}
                className="btn-primary disabled:opacity-50 px-8 py-3 text-lg"
              >
                {loading ? '提交中...' : '提交作品'}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">提交说明</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• 请确保文件格式正确，大小不超过10MB</li>
              <li>• 提交后无法修改，请仔细检查</li>
              <li>• 您的个人信息将被加密存储，确保隐私安全</li>
              <li>• 作品将由专业评审团队进行盲审</li>
              <li>• 评审结果将通过邮件或电话通知</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
