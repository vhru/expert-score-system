'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface DocumentInfo {
  id: number;
  document_type: string;
  document_name: string;
  document_path: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

export default function EditDocumentPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;
  
  const [documentInfo, setDocumentInfo] = useState<DocumentInfo | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  useEffect(() => {
    fetchDocumentInfo();
  }, [documentId]);

  const fetchDocumentInfo = async () => {
    try {
      const token = localStorage.getItem('teamToken');
      const response = await fetch(`/api/teams/document/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      if (data.success) {
        setDocumentInfo(data.document);
      } else {
        setMessage(data.error || '获取文档信息失败');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Failed to fetch document info:', error);
      setMessage('获取文档信息失败');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 检查文件类型
      if (file.type !== 'application/pdf') {
        setMessage('只支持PDF格式文件');
        setMessageType('error');
        return;
      }

      // 检查文件大小 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setMessage('文件大小不能超过10MB');
        setMessageType('error');
        return;
      }

      setNewFile(file);
      setMessage('');
      setMessageType('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newFile) {
      setMessage('请选择新文件');
      setMessageType('error');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('teamToken');
      const formData = new FormData();
      formData.append('file', newFile);

      const response = await fetch(`/api/teams/update-document/${documentId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage('文档更新成功！');
        setMessageType('success');
        setTimeout(() => {
          router.push('/team-dashboard');
        }, 2000);
      } else {
        setMessage(data.error || '更新失败');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Update error:', error);
      setMessage('更新失败');
      setMessageType('error');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDocumentTypeText = (documentType: string) => {
    const typeMap: { [key: string]: string } = {
      'commitmentLetter': '承诺书',
      'presentation': '项目展示',
      'supplementaryMaterials': '补充材料',
      'technicalInfo': '技术信息',
      'businessLicense': '营业执照',
      'businessPlan': '商业计划书'
    };
    return typeMap[documentType] || documentType;
  };

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

  if (!documentInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">文档不存在或无权访问</p>
          <button
            onClick={() => router.push('/team-dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            返回仪表板
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-xl font-semibold text-gray-900">
              编辑文档 - {getDocumentTypeText(documentInfo.document_type)}
            </h1>
            <button
              onClick={() => router.push('/team-dashboard')}
              className="text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              返回仪表板
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          {/* 当前文档信息 */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">当前文档信息</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><span className="font-medium">文档类型:</span> {getDocumentTypeText(documentInfo.document_type)}</p>
                  <p><span className="font-medium">文件名:</span> {documentInfo.document_name}</p>
                  <p><span className="font-medium">文件大小:</span> {formatFileSize(documentInfo.file_size)}</p>
                </div>
                <div>
                  <p><span className="font-medium">文件类型:</span> {documentInfo.mime_type}</p>
                  <p><span className="font-medium">上传时间:</span> {new Date(documentInfo.uploaded_at).toLocaleString()}</p>
                  <p><span className="font-medium">文档ID:</span> #{documentInfo.id}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 更新文档表单 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
                选择新文件
              </label>
              <input
                type="file"
                id="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                只支持PDF格式，文件大小不超过10MB
              </p>
            </div>

            {newFile && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">新文件信息</h3>
                <div className="text-sm text-blue-800">
                  <p><span className="font-medium">文件名:</span> {newFile.name}</p>
                  <p><span className="font-medium">文件大小:</span> {formatFileSize(newFile.size)}</p>
                  <p><span className="font-medium">文件类型:</span> {newFile.type}</p>
                </div>
              </div>
            )}

            {message && (
              <div className={`rounded-md p-4 ${
                messageType === 'error' 
                  ? 'bg-red-50 text-red-800 border border-red-200' 
                  : 'bg-green-50 text-green-800 border border-green-200'
              }`}>
                {message}
              </div>
            )}

            <div className="flex items-center space-x-4">
              <button
                type="submit"
                disabled={!newFile || uploading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    更新中...
                  </>
                ) : (
                  '更新文档'
                )}
              </button>
              
              <button
                type="button"
                onClick={() => router.push('/team-dashboard')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
