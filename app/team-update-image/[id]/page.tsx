'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useLanguage } from '@/lib/language-context';

export default function UpdateImagePage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageInfo, setImageInfo] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('teamToken');
    if (!token) {
      router.push('/team-login');
      return;
    }

    // 获取图片信息
    fetchImageInfo();
  }, []);

  const fetchImageInfo = async () => {
    try {
      const token = localStorage.getItem('teamToken');
      const response = await fetch('/api/teams/images', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const image = data.images.find((img: any) => img.id === parseInt(params.id as string));
          setImageInfo(image);
        }
      }
    } catch (error) {
      console.error('Failed to fetch image info:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpdate(file);
    }
  };

  const handleUpdate = async (file: File) => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('teamToken');
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`/api/teams/update-image/${params.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        alert('图片更新成功！');
        router.push('/team-dashboard');
      } else {
        setError(result.error || '更新失败');
      }
    } catch (err) {
      setError('更新过程中发生错误');
      console.error('Update error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!imageInfo) {
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
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="bg-white shadow-lg rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">更新图片</h1>
            <p className="mt-2 text-sm text-gray-600">选择新的图片文件来替换当前图片</p>
          </div>

          <div className="px-6 py-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">当前图片信息</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">文件名:</span> {imageInfo.image_name}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">文件大小:</span> {(imageInfo.image_size / 1024).toFixed(1)} KB
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">上传时间:</span> {new Date(imageInfo.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择新图片文件
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={loading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              />
              <p className="mt-1 text-xs text-gray-500">
                支持 JPG、PNG 格式，文件大小不超过 10MB
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => router.push('/team-dashboard')}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                取消
              </button>
              
              {loading && (
                <div className="flex items-center px-4 py-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-sm text-gray-600">更新中...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
