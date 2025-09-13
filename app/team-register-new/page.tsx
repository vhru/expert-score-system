'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLanguage } from '@/lib/i18n';

interface CoreMember {
  name: string;
  nationality: string;
  gender: string;
  birthDate: string;
  idType: 'id_card' | 'passport';
  idNumber: string;
  phone: string;
  email: string;
  university: string;
  highestDegree: string;
  organization: string;
  position: string;
  cv?: File;
}

export default function TeamRegisterPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 基本信息
  const [basicInfo, setBasicInfo] = useState({
    projectName: '',
    coreMembersNationality: '',
    projectBrief: '',
    projectStage: '',
    password: '',
    confirmPassword: ''
  });

  // 联系人信息
  const [contactInfo, setContactInfo] = useState({
    contactPersonName: '',
    contactPersonPosition: '',
    contactPersonPhone: '',
    contactPersonEmail: ''
  });

  // 核心成员
  const [coreMembers, setCoreMembers] = useState<CoreMember[]>([
    {
      name: '', nationality: '', gender: '', birthDate: '',
      idType: 'id_card', idNumber: '', phone: '', email: '',
      university: '', highestDegree: '', organization: '', position: ''
    },
    {
      name: '', nationality: '', gender: '', birthDate: '',
      idType: 'id_card', idNumber: '', phone: '', email: '',
      university: '', highestDegree: '', organization: '', position: ''
    }
  ]);

  // 文档上传
  const [documents, setDocuments] = useState({
    commitmentLetter: null as File | null,
    technicalInfo: null as File | null,
    presentation: null as File | null,
    supplementaryMaterials: null as File | null
  });

  const handleBasicInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBasicInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleContactInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setContactInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleCoreMemberChange = (index: number, field: keyof CoreMember, value: string | File) => {
    setCoreMembers(prev => prev.map((member, i) => 
      i === index ? { ...member, [field]: value } : member
    ));
  };

  const handleDocumentChange = (type: keyof typeof documents, file: File | null) => {
    setDocuments(prev => ({ ...prev, [type]: file }));
  };

  const addCoreMember = () => {
    if (coreMembers.length < 6) {
      setCoreMembers(prev => [...prev, {
        name: '', nationality: '', gender: '', birthDate: '',
        idType: 'id_card', idNumber: '', phone: '', email: '',
        university: '', highestDegree: '', organization: '', position: ''
      }]);
    }
  };

  const removeCoreMember = (index: number) => {
    if (coreMembers.length > 2) {
      setCoreMembers(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      
      // 基本信息
      formData.append('basicInfo', JSON.stringify(basicInfo));
      formData.append('contactInfo', JSON.stringify(contactInfo));
      formData.append('coreMembers', JSON.stringify(coreMembers));
      formData.append('teamType', 'team');

      // 文档上传
      if (documents.commitmentLetter) formData.append('commitmentLetter', documents.commitmentLetter);
      if (documents.technicalInfo) formData.append('technicalInfo', documents.technicalInfo);
      if (documents.presentation) formData.append('presentation', documents.presentation);
      if (documents.supplementaryMaterials) formData.append('supplementaryMaterials', documents.supplementaryMaterials);

      // 核心成员CV
      coreMembers.forEach((member, index) => {
        if (member.cv) {
          formData.append(`memberCv_${index}`, member.cv);
        }
      });

      const response = await fetch('/api/teams/register-team', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        alert('团队注册成功！');
        router.push('/team-login');
      } else {
        setError(result.error || '注册失败');
      }
    } catch (err) {
      setError('注册过程中发生错误');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <a href="/portal" className="text-sm text-gray-600 hover:text-gray-800">
                ← 返回系统首页
              </a>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">澜湄国家科技创新大赛 - 团队组报名</h1>
            <p className="mt-2 text-sm text-gray-600">Lancang-Mekong Countries Science and Technology Innovation Competition - Team Registration</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* 1. 参赛项目信息 */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">1. 参赛项目信息 / Project Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    项目名称 * / Project Name *
                  </label>
                  <input
                    type="text"
                    name="projectName"
                    value={basicInfo.projectName}
                    onChange={handleBasicInfoChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    核心成员国籍 * / Core Members Nationality *
                  </label>
                  <select
                    name="coreMembersNationality"
                    value={basicInfo.coreMembersNationality}
                    onChange={handleBasicInfoChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">请选择 / Please select</option>
                    <option value="single">单一国家 / Single Country</option>
                    <option value="multiple">多国 / Multiple Countries</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  项目简介 * / Project Brief * (500字以内)
                </label>
                <textarea
                  name="projectBrief"
                  value={basicInfo.projectBrief}
                  onChange={handleBasicInfoChange}
                  required
                  rows={4}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="项目背景、概述、团队介绍、核心技术、创新点、专利及其他研究成果，以及未来收益和其他亮点等"
                />
                <p className="text-sm text-gray-500 mt-1">{basicInfo.projectBrief.length}/500</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  项目阶段 * / Project Stage *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {['研发阶段', '实验室测试', '试生产', '成长阶段'].map((stage) => (
                    <label key={stage} className="flex items-center">
                      <input
                        type="radio"
                        name="projectStage"
                        value={stage}
                        checked={basicInfo.projectStage === stage}
                        onChange={handleBasicInfoChange}
                        className="mr-2"
                      />
                      <span className="text-sm">{stage}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. 项目联系人 */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">2. 项目联系人 / Project Contact Person</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    姓名 * / Name *
                  </label>
                  <input
                    type="text"
                    name="contactPersonName"
                    value={contactInfo.contactPersonName}
                    onChange={handleContactInfoChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    职务 * / Position *
                  </label>
                  <input
                    type="text"
                    name="contactPersonPosition"
                    value={contactInfo.contactPersonPosition}
                    onChange={handleContactInfoChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    电话 * / Phone *
                  </label>
                  <input
                    type="tel"
                    name="contactPersonPhone"
                    value={contactInfo.contactPersonPhone}
                    onChange={handleContactInfoChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    邮箱 * / Email *
                  </label>
                  <input
                    type="email"
                    name="contactPersonEmail"
                    value={contactInfo.contactPersonEmail}
                    onChange={handleContactInfoChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 3. 核心成员信息 */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">3. 核心成员信息 / Core Team Members (至少3人，不超过6人)</h2>
                {coreMembers.length < 6 && (
                  <button
                    type="button"
                    onClick={addCoreMember}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    添加成员
                  </button>
                )}
              </div>

              {coreMembers.map((member, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-gray-900">成员 {index + 1} / Member {index + 1}</h3>
                    {coreMembers.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeCoreMember(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        删除
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
                      <input
                        type="text"
                        value={member.name}
                        onChange={(e) => handleCoreMemberChange(index, 'name', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">国籍 *</label>
                      <input
                        type="text"
                        value={member.nationality}
                        onChange={(e) => handleCoreMemberChange(index, 'nationality', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">性别 *</label>
                      <select
                        value={member.gender}
                        onChange={(e) => handleCoreMemberChange(index, 'gender', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">请选择</option>
                        <option value="男">男</option>
                        <option value="女">女</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">出生年月 *</label>
                      <input
                        type="date"
                        value={member.birthDate}
                        onChange={(e) => handleCoreMemberChange(index, 'birthDate', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">证件类型 *</label>
                      <select
                        value={member.idType}
                        onChange={(e) => handleCoreMemberChange(index, 'idType', e.target.value as 'id_card' | 'passport')}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="id_card">国内身份证</option>
                        <option value="passport">外籍护照</option>
                      </select>
                      <p className="mt-1 text-xs text-gray-500">请选择：国内身份证 或 外籍护照</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">证件号码 *</label>
                      <input
                        type="text"
                        value={member.idNumber}
                        onChange={(e) => handleCoreMemberChange(index, 'idNumber', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">电话 *</label>
                      <input
                        type="tel"
                        value={member.phone}
                        onChange={(e) => handleCoreMemberChange(index, 'phone', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">电子邮箱 *</label>
                      <input
                        type="email"
                        value={member.email}
                        onChange={(e) => handleCoreMemberChange(index, 'email', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">毕业院校 *</label>
                      <input
                        type="text"
                        value={member.university}
                        onChange={(e) => handleCoreMemberChange(index, 'university', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">最高学历 *</label>
                      <select
                        value={member.highestDegree}
                        onChange={(e) => handleCoreMemberChange(index, 'highestDegree', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">请选择</option>
                        <option value="本科">本科</option>
                        <option value="硕士">硕士</option>
                        <option value="博士">博士</option>
                        <option value="其他">其他</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">所在单位 *</label>
                      <input
                        type="text"
                        value={member.organization}
                        onChange={(e) => handleCoreMemberChange(index, 'organization', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">职务/职称 *</label>
                      <input
                        type="text"
                        value={member.position}
                        onChange={(e) => handleCoreMemberChange(index, 'position', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">简历 (选填)</label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleCoreMemberChange(index, 'cv', e.target.files?.[0] || null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 4. 文档上传 */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">4. 需附材料清单 / Required Materials (全部为PDF格式)</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    参赛承诺书 * / Commitment Letter *
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleDocumentChange('commitmentLetter', e.target.files?.[0] || null)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    项目技术可行性分析 * / Technical Feasibility Analysis *
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleDocumentChange('technicalInfo', e.target.files?.[0] || null)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    演示文稿 * / Presentation *
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleDocumentChange('presentation', e.target.files?.[0] || null)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    其他补充材料 / Supplementary Materials
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleDocumentChange('supplementaryMaterials', e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 5. 登录密码 */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">5. 登录密码 / Login Password</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    密码 * / Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={basicInfo.password}
                    onChange={handleBasicInfoChange}
                    required
                    minLength={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    确认密码 * / Confirm Password *
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={basicInfo.confirmPassword}
                    onChange={handleBasicInfoChange}
                    required
                    minLength={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 提交按钮 */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push('/portal')}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '提交中...' : '提交报名'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
