'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface TeamSubmission {
  id: number;
  original_name: string;
  team_name: string;
  file_size: number;
  mime_type: string;
  upload_status: string;
  created_at: string;
  updated_at: string;
  review_status?: string;
  expert_assignments?: any[];
  document_type?: string;
  document_name?: string;
}


export default function TeamDashboard() {
  const router = useRouter();
  const [teamInfo, setTeamInfo] = useState<any>(null);
  const [submissions, setSubmissions] = useState<TeamSubmission[]>([]);
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  const [auditStatus, setAuditStatus] = useState<string>('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  // 翻译文本
  const t = {
    zh: {
      title: '团队管理后台',
      submitNew: '提交新作品',
      logout: '退出登录',
      teamInfo: '团队信息',
      updateForm: '更新表单信息',
      teamName: '团队名称',
      contactEmail: '联系邮箱',
      submissions: '作品提交记录',
      noSubmissions: '暂无提交记录',
      noSubmissionsDesc: '您还没有提交任何作品。',
      download: '下载',
      update: '更新',
      lastUpdate: '最后更新',
      images: '团队图片',
      noImages: '暂无图片',
      noImagesDesc: '您还没有上传任何图片。',
      uploadTime: '上传时间',
      fileSize: '文件大小',
      contactPerson: '联系人',
      contactPhone: '联系电话',
      notFilled: '未填写',
      fileName: '文件名',
      fileType: '文件类型',
      submissionTime: '提交时间',
      reviewStatus: '评审状态',
      documentId: '文档ID',
      submitted: '已提交',
      pending: '待处理',
      processing: '处理中',
      pendingExpert: '待分配专家',
      auditPassed: '审核通过',
      auditPassedMessage: '您的提交已通过审核，无法再进行修改。',
      switchLanguage: 'English',
      uploadDocument: '上传文档',
      uploadNewDocument: '上传新文档',
      documentType: '文档类型',
      selectFile: '选择文件',
      uploadSuccess: '文档上传成功！',
      uploadError: '上传失败',
      uploadButton: '上传文件',
      uploading: '上传中...',
      reset: '重置',
      selectDocumentType: '请选择文档类型',
      fileSizeLimit: '只支持PDF格式，文件大小不超过10MB',
      selectedFile: '已选择文件'
    },
    en: {
      title: 'Team Dashboard',
      submitNew: 'Submit New Work',
      logout: 'Logout',
      teamInfo: 'Team Information',
      updateForm: 'Update Form',
      teamName: 'Team Name',
      contactEmail: 'Contact Email',
      submissions: 'Submission Records',
      noSubmissions: 'No Submissions',
      noSubmissionsDesc: 'You have not submitted any work yet.',
      download: 'Download',
      update: 'Update',
      lastUpdate: 'Last Updated',
      images: 'Team Images',
      noImages: 'No Images',
      noImagesDesc: 'You have not uploaded any images yet.',
      uploadTime: 'Upload Time',
      fileSize: 'File Size',
      contactPerson: 'Contact Person',
      contactPhone: 'Contact Phone',
      notFilled: 'Not Filled',
      fileName: 'File Name',
      fileType: 'File Type',
      submissionTime: 'Submission Time',
      reviewStatus: 'Review Status',
      documentId: 'Document ID',
      submitted: 'Submitted',
      pending: 'Pending',
      processing: 'Processing',
      pendingExpert: 'Pending Expert Assignment',
      auditPassed: 'Audit Passed',
      auditPassedMessage: 'Your submission has been approved. No further changes are allowed.',
      switchLanguage: '中文',
      uploadDocument: 'Upload Document',
      uploadNewDocument: 'Upload New Document',
      documentType: 'Document Type',
      selectFile: 'Select File',
      uploadSuccess: 'Document uploaded successfully!',
      uploadError: 'Upload failed',
      uploadButton: 'Upload File',
      uploading: 'Uploading...',
      reset: 'Reset',
      selectDocumentType: 'Please select document type',
      fileSizeLimit: 'PDF format only, file size not exceeding 10MB',
      selectedFile: 'Selected file'
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'zh' ? 'en' : 'zh');
  };

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem('teamToken');
    const savedTeamInfo = localStorage.getItem('teamInfo');
    
    if (!token || !savedTeamInfo) {
      window.location.href = '/team-login';
      return;
    }

    try {
      const parsedTeamInfo = JSON.parse(savedTeamInfo);
      setTeamInfo(parsedTeamInfo);
      setAuditStatus(parsedTeamInfo.audit_status || 'pending');
      fetchSubmissions(token);
      fetchImages(token);
    } catch (error) {
      console.error('Failed to parse team info:', error);
      window.location.href = '/team-login';
    }
  }, []);

  const fetchSubmissions = async (token: string) => {
    try {
      const response = await fetch('/api/teams/submissions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setSubmissions(data.submissions);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchImages = async (token: string) => {
    try {
      const response = await fetch('/api/teams/images', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setImages(data.images);
      }
    } catch (error) {
      console.error('Failed to fetch images:', error);
    }
  };


  const handleLogout = () => {
    localStorage.removeItem('teamToken');
    localStorage.removeItem('teamInfo');
    window.location.href = '/team-login';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return t[language].submitted;
      case 'pending': return t[language].pending;
      case 'processing': return t[language].processing;
      case 'failed': return language === 'zh' ? '失败' : 'Failed';
      default: return language === 'zh' ? '未知' : 'Unknown';
    }
  };

  // 文档类型名称映射
  const getDocumentTypeName = (docType: string) => {
    const typeMap = {
      zh: {
        'commitmentLetter': '承诺书',
        'technicalInfoChinese': '技术信息_中文',
        'technicalInfoEnglish': '技术信息_英文',
        'presentation': '项目展示',
        'teamInfo': '团队信息',
        'businessLicense': '营业执照',
        'businessPlan': '商业计划书'
      },
      en: {
        'commitmentLetter': 'Commitment Letter',
        'technicalInfoChinese': 'Technical Info (Chinese)',
        'technicalInfoEnglish': 'Technical Info (English)',
        'presentation': 'Presentation',
        'teamInfo': 'Team Info',
        'businessLicense': 'Business License',
        'businessPlan': 'Business Plan'
      }
    };
    return typeMap[language][docType] || docType;
  };

  const getReviewStatusText = (submission: TeamSubmission) => {
    if (!submission.expert_assignments || submission.expert_assignments.length === 0) {
      return t[language].pendingExpert;
    }
    
    const completed = submission.expert_assignments.filter(a => a.assignment_status === 'completed').length;
    const total = submission.expert_assignments.length;
    
    if (completed === 0) {
      return '评审中';
    } else if (completed === total) {
      return '评审完成';
    } else {
      return `评审中 (${completed}/${total})`;
    }
  };

  const getDocumentTypeText = (documentType: string) => {
    return getDocumentTypeName(documentType);
  };

  const handleDownloadDocument = async (submission: TeamSubmission) => {
    try {
      const token = localStorage.getItem('teamToken');
      const response = await fetch(`/api/teams/download/${submission.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = submission.original_name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setMessage('下载失败');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Download error:', error);
      setMessage('下载失败');
      setMessageType('error');
    }
  };

  const handleUpdateForm = () => {
    // 跳转到表单更新页面
    router.push('/team-register-new?update=true');
  };

  const handleUpdateDocument = (submission: TeamSubmission) => {
    // 跳转到文档更新页面
    router.push(`/team-edit-document/${submission.id}`);
  };

  const handleUploadDocument = () => {
    setShowUploadModal(true);
    setUploadMessage('');
  };

  const handleFileUpload = async (file: File, documentType: string) => {
    setUploading(true);
    setUploadMessage('');

    try {
      const token = localStorage.getItem('teamToken');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);

      // 使用现有的更新API，传入一个不存在的ID来创建新文档
      const response = await fetch('/api/teams/update-document/0', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setUploadMessage(t[language].uploadSuccess);
        // 刷新提交记录
        await fetchSubmissions(token!);
        // 关闭上传模态框
        setTimeout(() => {
          setShowUploadModal(false);
        }, 1500);
      } else {
        setUploadMessage(`${t[language].uploadError}: ${result.error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadMessage(t[language].uploadError);
    } finally {
      setUploading(false);
    }
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

  const isAuditPassed = auditStatus === 'approved' || auditStatus === 'passed';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 审核通过横幅 */}
      {isAuditPassed && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                <strong>{t[language].auditPassed}</strong> - {t[language].auditPassedMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-xl font-semibold text-gray-900">
                {t[language].title} - {teamInfo?.teamName}
              </h1>
              <div className="flex items-center space-x-4">
                <button
                  onClick={toggleLanguage}
                  className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                >
                  {t[language].switchLanguage}
                </button>
                {/* 提交新作品功能已屏蔽 */}
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                >
                  {t[language].logout}
                </button>
              </div>
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* 团队信息卡片 */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">{t[language].teamInfo}</h2>
              {/* 审核通过后隐藏更新表单按钮 */}
              {!isAuditPassed && (
                <button
                  onClick={handleUpdateForm}
                  className="btn-primary text-sm"
                >
                  {t[language].updateForm}
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">{t[language].teamName}:</span>
                <p className="font-medium">{teamInfo?.teamName}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">{t[language].contactEmail}:</span>
                <p className="font-medium">{teamInfo?.contactEmail}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">{t[language].contactPerson}:</span>
                <p className="font-medium">{teamInfo?.contactPerson || t[language].notFilled}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">{t[language].contactPhone}:</span>
                <p className="font-medium">{teamInfo?.contactPhone || t[language].notFilled}</p>
              </div>
            </div>
          </div>

          {/* 作品提交记录 */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-gray-900">{t[language].submissions}</h2>
              {/* 审核通过后隐藏上传按钮 */}
              {!isAuditPassed && (
                <button
                  onClick={handleUploadDocument}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  {t[language].uploadDocument}
                </button>
              )}
            </div>

            {submissions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📁</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t[language].noSubmissions}</h3>
                <p className="text-gray-500">{t[language].noSubmissionsDesc}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {submissions.map((submission) => (
                  <div key={submission.id} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {getDocumentTypeText(submission.document_type)}
                          </h3>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(submission.upload_status)}`}>
                            {getStatusText(submission.upload_status)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                          <div>
                            <p><span className="font-medium">{t[language].fileName}:</span> {submission.original_name}</p>
                            <p><span className="font-medium">{t[language].fileType}:</span> {submission.mime_type}</p>
                          </div>
                          <div>
                            <p><span className="font-medium">{t[language].submissionTime}:</span> {new Date(submission.created_at).toLocaleString()}</p>
                            <p><span className="font-medium">{t[language].reviewStatus}:</span> {getReviewStatusText(submission)}</p>
                            <p><span className="font-medium">{t[language].documentId}:</span> #{submission.id}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 pt-4 border-t border-gray-100">
                      {/* 暂时隐藏下载按钮，专注更新功能 */}
                      {/* <button
                        onClick={() => handleDownloadDocument(submission)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {t[language].download}
                      </button> */}
                      
                      <button
                        onClick={() => handleUpdateDocument(submission)}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        {t[language].update}
                      </button>
                      
                      
                      <span className="text-xs text-gray-500">
                        {t[language].lastUpdate}: {new Date(submission.updated_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 团队图片 */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-gray-900">{t[language].images}</h2>
            </div>

            {images.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🖼️</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t[language].noImages}</h3>
                <p className="text-gray-500">{t[language].noImagesDesc}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {images.map((image) => (
                  <div key={image.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {image.image_name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {t[language].uploadTime}: {new Date(image.created_at).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {t[language].fileSize}: {(image.image_size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        {/* 暂时隐藏下载按钮，专注更新功能 */}
                        {/* <button
                          onClick={() => {
                            const token = localStorage.getItem('teamToken');
                            window.open(`/api/teams/download-image/${image.id}?token=${token}`, '_blank');
                          }}
                          className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
                        >
                          {t[language].download}
                        </button> */}
                        <button
                          onClick={() => window.open(`/team-update-image/${image.id}`, '_blank')}
                          className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200"
                        >
                          {t[language].update}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>

      {/* 文件上传模态框 */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {t[language].uploadNewDocument}
                </h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">关闭</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <FileUploadComponent
                onFileUpload={handleFileUpload}
                uploading={uploading}
                message={uploadMessage}
                language={language}
                t={t}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 文件上传组件
interface FileUploadComponentProps {
  onFileUpload: (file: File, documentType: string) => void;
  uploading: boolean;
  message: string;
  language: 'zh' | 'en';
  t: any;
}

function FileUploadComponent({ onFileUpload, uploading, message, language, t }: FileUploadComponentProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('');

  const documentTypes = [
    { value: 'businessLicense', label: language === 'zh' ? '营业执照' : 'Business License' },
    { value: 'businessPlan', label: language === 'zh' ? '商业计划书' : 'Business Plan' },
    { value: 'commitmentLetter', label: language === 'zh' ? '承诺书' : 'Commitment Letter' },
    { value: 'presentation', label: language === 'zh' ? '路演PPT' : 'Presentation' },
    { value: 'technicalInfo', label: language === 'zh' ? '技术资料' : 'Technical Info' },
    { value: 'supplementaryMaterials', label: language === 'zh' ? '补充材料' : 'Supplementary Materials' },
  ];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert(language === 'zh' ? '只支持PDF格式文件' : 'Only PDF files are supported');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert(language === 'zh' ? '文件大小不能超过10MB' : 'File size cannot exceed 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = () => {
    if (!selectedFile || !documentType) {
      alert(language === 'zh' ? '请选择文件和文档类型' : 'Please select file and document type');
      return;
    }
    onFileUpload(selectedFile, documentType);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t[language].documentType} *
        </label>
        <select
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={uploading}
        >
          <option value="">{t[language].selectDocumentType}</option>
          {documentTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t[language].selectFile} *
        </label>
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          disabled={uploading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          {t[language].fileSizeLimit}
        </p>
      </div>

      {selectedFile && (
        <div className="bg-gray-50 p-3 rounded-md">
          <p className="text-sm text-gray-700">
            <strong>{t[language].selectedFile}:</strong> {selectedFile.name}
          </p>
          <p className="text-xs text-gray-500">
            {t[language].fileSize}: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      )}

      {message && (
        <div className={`p-3 rounded-md text-sm ${
          message.includes('成功') || message.includes('successfully')
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          onClick={() => {
            setSelectedFile(null);
            setDocumentType('');
          }}
          disabled={uploading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
        >
          {t[language].reset}
        </button>
        <button
          onClick={handleSubmit}
          disabled={uploading || !selectedFile || !documentType}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {uploading ? t[language].uploading : t[language].uploadButton}
        </button>
      </div>
    </div>
  );
}
