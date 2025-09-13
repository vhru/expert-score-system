'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LanguageSwitcherNew from '@/components/LanguageSwitcherNew';
import { useLanguage } from '@/lib/language-context';

interface CoreMember {
  name: string;
  nationality: string;
  gender: string;
  birthDate: string;
  idType: 'id_card' | 'passport';
  idNumber: string;
  idPhoto?: File;
  phone: string;
  email: string;
  university: string;
  highestDegree: string;
  organization: string;
  position: string;
  cv?: File;
}

export default function EnterpriseRegisterPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 基本信息
  const [basicInfo, setBasicInfo] = useState({
    projectName: '',
    registrationCountry: '',
    projectBrief: '',
    projectStage: '',
    projectStageOthers: '',
    password: '',
    confirmPassword: ''
  });

  // 企业信息
  const [enterpriseInfo, setEnterpriseInfo] = useState({
    enterpriseName: '',
    unifiedSocialCreditCode: '',
    registrationYear: '',
    legalRepresentative: '',
    headquartersLocation: '',
    registeredCapitalUsd: '',
    phone: '',
    website: '',
    enterpriseOverview: ''
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
    },
    {
      name: '', nationality: '', gender: '', birthDate: '',
      idType: 'id_card', idNumber: '', phone: '', email: '',
      university: '', highestDegree: '', organization: '', position: ''
    }
  ]);

  // 文档上传
  const [documents, setDocuments] = useState({
    businessLicense: null as File | null,
    commitmentLetter: null as File | null,
    businessPlanChinese: null as File | null,
    businessPlanEnglish: null as File | null,
    presentation: null as File | null,
    supplementaryMaterials: null as File | null
  });

  const handleBasicInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBasicInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleEnterpriseInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEnterpriseInfo(prev => ({ ...prev, [name]: value }));
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
    if (file && file.size > 5 * 1024 * 1024) {
      setError('PDF文件大小不能超过5MB');
      return;
    }
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
    if (coreMembers.length > 3) {
      setCoreMembers(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 前端校验
    if (!basicInfo.projectName.trim()) {
      setError(t('common.required') === '必填' ? '项目名称不能为空' : 'Project name is required');
      setLoading(false);
      return;
    }

    if (!basicInfo.projectBrief.trim()) {
      setError(t('common.required') === '必填' ? '项目简介不能为空' : 'Project brief is required');
      setLoading(false);
      return;
    }

    if (!basicInfo.projectStage) {
      setError(t('common.required') === '必填' ? '请选择项目阶段' : 'Please select project stage');
      setLoading(false);
      return;
    }

    if (!enterpriseInfo.enterpriseName.trim()) {
      setError(t('common.required') === '必填' ? '企业名称不能为空' : 'Enterprise name is required');
      setLoading(false);
      return;
    }

    if (!enterpriseInfo.unifiedSocialCreditCode.trim()) {
      setError(t('common.required') === '必填' ? '统一社会信用代码不能为空' : 'Unified social credit code is required');
      setLoading(false);
      return;
    }

    if (!enterpriseInfo.registrationYear.trim()) {
      setError(t('common.required') === '必填' ? '注册年份不能为空' : 'Registration year is required');
      setLoading(false);
      return;
    }

    if (!enterpriseInfo.legalRepresentative.trim()) {
      setError(t('common.required') === '必填' ? '法定代表人不能为空' : 'Legal representative is required');
      setLoading(false);
      return;
    }

    if (!enterpriseInfo.headquartersLocation.trim()) {
      setError(t('common.required') === '必填' ? '总部所在地不能为空' : 'Headquarters location is required');
      setLoading(false);
      return;
    }

    if (!enterpriseInfo.registeredCapitalUsd.trim()) {
      setError(t('common.required') === '必填' ? '注册资本不能为空' : 'Registered capital is required');
      setLoading(false);
      return;
    }

    if (!enterpriseInfo.phone.trim()) {
      setError(t('common.required') === '必填' ? '企业电话不能为空' : 'Enterprise phone is required');
      setLoading(false);
      return;
    }

    if (!contactInfo.contactPersonName.trim()) {
      setError(t('common.required') === '必填' ? '联系人姓名不能为空' : 'Contact person name is required');
      setLoading(false);
      return;
    }

    if (!contactInfo.contactPersonEmail.trim()) {
      setError(t('common.required') === '必填' ? '联系人邮箱不能为空' : 'Contact person email is required');
      setLoading(false);
      return;
    }

    // 成员信息校验已移除 - 让后端处理数据验证

    try {
      const formData = new FormData();
      
      // 基本信息
      formData.append('basicInfo', JSON.stringify(basicInfo));
      formData.append('enterpriseInfo', JSON.stringify(enterpriseInfo));
      formData.append('contactInfo', JSON.stringify(contactInfo));
      formData.append('coreMembers', JSON.stringify(coreMembers));
      formData.append('teamType', 'enterprise');

      // 文档上传
      if (documents.businessLicense) formData.append('businessLicense', documents.businessLicense);
      if (documents.commitmentLetter) formData.append('commitmentLetter', documents.commitmentLetter);
      if (documents.businessPlanChinese) formData.append('businessPlanChinese', documents.businessPlanChinese);
      if (documents.businessPlanEnglish) formData.append('businessPlanEnglish', documents.businessPlanEnglish);
      if (documents.presentation) formData.append('presentation', documents.presentation);
      if (documents.supplementaryMaterials) formData.append('supplementaryMaterials', documents.supplementaryMaterials);

      // 核心成员CV
      coreMembers.forEach((member, index) => {
        if (member.cv) {
          formData.append(`memberCv_${index}`, member.cv);
        }
      });

      const response = await fetch('/api/teams/register-enterprise', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        alert(t('enterpriseRegister.success'));
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
                {t('common.back')} {t('portal.title')}
              </a>
            </div>
            <LanguageSwitcherNew />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            {t('common.required') === '必填' ? (
              <>
                <h1 className="text-2xl font-bold text-gray-900">{t('enterpriseRegister.title')}</h1>
                <p className="mt-2 text-sm text-gray-600">{t('enterpriseRegister.subtitle')}</p>
              </>
            ) : (
              <h1 className="text-2xl font-bold text-gray-900">{t('enterpriseRegister.subtitle')}</h1>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* 1. 参赛项目信息 */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">{t('enterpriseRegister.projectInfo.title')}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('enterpriseRegister.projectInfo.projectName')} *
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
                    {t('enterpriseRegister.projectInfo.registrationCountry') + " *"}
                  </label>
                  
                  <select
                    name="registrationCountry"
                    value={basicInfo.registrationCountry}
                    onChange={handleBasicInfoChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t('common.required') === '必填' ? '请选择' : 'Please select'}</option>
                    <option value="china">{t('enterpriseRegister.projectInfo.countries.china')}</option>
                    <option value="thailand">{t('enterpriseRegister.projectInfo.countries.thailand')}</option>
                    <option value="cambodia">{t('enterpriseRegister.projectInfo.countries.cambodia')}</option>
                    <option value="vietnam">{t('enterpriseRegister.projectInfo.countries.vietnam')}</option>
                    <option value="laos">{t('enterpriseRegister.projectInfo.countries.laos')}</option>
                    <option value="myanmar">{t('enterpriseRegister.projectInfo.countries.myanmar')}</option>
                    <option value="others">{t('enterpriseRegister.projectInfo.countries.others')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
{t('enterpriseRegister.projectInfo.projectBrief')} * {t('common.required') === '必填' ? '(500字以内)' : '(within 500 words)'}
                </label>
                <textarea
                  name="projectBrief"
                  value={basicInfo.projectBrief}
                  onChange={handleBasicInfoChange}
                  required
                  rows={4}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                   placeholder={t('common.required') === '必填' ? "项目背景、概述、团队介绍、核心技术、创新点、专利及其他研究成果，以及未来收益和其他亮点等" : "Project background, overview, team introduction, core technology, innovation points, patents and other research results, future benefits and other highlights"}
                />
                <p className="text-sm text-gray-500 mt-1">{basicInfo.projectBrief.length}/500</p>
              </div>


              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('enterpriseRegister.projectInfo.projectStage') + " *"}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                   {[
                     { value: t('enterpriseRegister.projectInfo.stages.development'), label: t('enterpriseRegister.projectInfo.stages.development') },
                     { value: t('enterpriseRegister.projectInfo.stages.labTest'), label: t('enterpriseRegister.projectInfo.stages.labTest') },
                     { value: t('enterpriseRegister.projectInfo.stages.trialProduction'), label: t('enterpriseRegister.projectInfo.stages.trialProduction') },
                     { value: t('enterpriseRegister.projectInfo.stages.batchProduction'), label: t('enterpriseRegister.projectInfo.stages.batchProduction') },
                     { value: t('enterpriseRegister.projectInfo.stages.growth'), label: t('enterpriseRegister.projectInfo.stages.growth') },
                     { value: t('enterpriseRegister.projectInfo.stages.others'), label: t('enterpriseRegister.projectInfo.stages.others') }
                   ].map((stage) => (
                    <label key={stage.value} className="flex items-center">
                      <input
                        type="radio"
                        name="projectStage"
                        value={stage.value}
                        checked={basicInfo.projectStage === stage.value}
                        onChange={handleBasicInfoChange}
                        className="mr-2"
                      />
                      <span className="text-sm">{stage.label}</span>
                    </label>
                  ))}
                </div>
                {basicInfo.projectStage === t('enterpriseRegister.projectInfo.stages.others') && (
                  <div className="mt-3">
                    <input
                      type="text"
                      name="projectStageOthers"
                      value={basicInfo.projectStageOthers}
                      onChange={handleBasicInfoChange}
                      placeholder={t('common.required') === '必填' ? '请详细说明项目阶段' : 'Please specify the project stage'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 2. 企业信息 */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">{t('enterpriseRegister.enterpriseInfo.title')}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('enterpriseRegister.enterpriseInfo.enterpriseName') + " *"}
                  </label>
                  <input
                    type="text"
                    name="enterpriseName"
                    value={enterpriseInfo.enterpriseName}
                    onChange={handleEnterpriseInfoChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('enterpriseRegister.enterpriseInfo.unifiedSocialCreditCode') + " *"}
                  </label>
                  <input
                    type="text"
                    name="unifiedSocialCreditCode"
                    value={enterpriseInfo.unifiedSocialCreditCode}
                    onChange={handleEnterpriseInfoChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
{t('enterpriseRegister.enterpriseInfo.registrationYear')} *
                  </label>
                  <input
                    type="number"
                    name="registrationYear"
                    value={enterpriseInfo.registrationYear}
                    onChange={handleEnterpriseInfoChange}
                    required
                    min="2019"
                    max="2024"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('enterpriseRegister.enterpriseInfo.legalRepresentative') + " *"}
                  </label>
                  <input
                    type="text"
                    name="legalRepresentative"
                    value={enterpriseInfo.legalRepresentative}
                    onChange={handleEnterpriseInfoChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('enterpriseRegister.enterpriseInfo.headquartersLocation') + " *"}
                  </label>
                  <input
                    type="text"
                    name="headquartersLocation"
                    value={enterpriseInfo.headquartersLocation}
                    onChange={handleEnterpriseInfoChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
{t('enterpriseRegister.enterpriseInfo.registeredCapital')} *
                  </label>
                  <input
                    type="number"
                    name="registeredCapitalUsd"
                    value={enterpriseInfo.registeredCapitalUsd}
                    onChange={handleEnterpriseInfoChange}
                    required
                    max="4500000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('enterpriseRegister.enterpriseInfo.phone')} *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={enterpriseInfo.phone}
                    onChange={handleEnterpriseInfoChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('enterpriseRegister.enterpriseInfo.website')}
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={enterpriseInfo.website}
                    onChange={handleEnterpriseInfoChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('enterpriseRegister.enterpriseInfo.enterpriseOverview') + " (500字以内)"}
                </label>
                <textarea
                  name="enterpriseOverview"
                  value={enterpriseInfo.enterpriseOverview}
                  onChange={handleEnterpriseInfoChange}
                  rows={4}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">{enterpriseInfo.enterpriseOverview.length}/500</p>
              </div>
            </div>

            {/* 3. 项目联系人 */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">{t('enterpriseRegister.contactInfo.title')}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('enterpriseRegister.contactInfo.contactPersonName') + " *"}
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
                    {t('enterpriseRegister.contactInfo.contactPersonPosition') + " *"}
                  </label>
                  <input
                    type="text"
                    name="contactPersonPosition"
                    value={contactInfo.contactPersonPosition}
                    onChange={handleContactInfoChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('enterpriseRegister.contactInfo.contactPersonPhone') + " *"}
                  </label>
                  <input
                    type="tel"
                    name="contactPersonPhone"
                    value={contactInfo.contactPersonPhone}
                    onChange={handleContactInfoChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('enterpriseRegister.contactInfo.contactPersonEmail') + " *"}
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

            {/* 4. 核心成员信息 */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">{t('enterpriseRegister.coreMembers.title')}</h2>
                {coreMembers.length < 6 && (
                  <button
                    type="button"
                    onClick={addCoreMember}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {t('enterpriseRegister.coreMembers.addMember')}
                  </button>
                )}
              </div>

              {coreMembers.map((member, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                     <h3 className="font-medium text-gray-900">{t('enterpriseRegister.coreMembers.member')} {index + 1}</h3>
                    {coreMembers.length > 3 && (
                      <button
                        type="button"
                        onClick={() => removeCoreMember(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        {t('enterpriseRegister.coreMembers.remove')}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('enterpriseRegister.coreMembers.name') + " *"}</label>
                      <input
                        type="text"
                        value={member.name}
                        onChange={(e) => handleCoreMemberChange(index, 'name', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('enterpriseRegister.coreMembers.nationality')}</label>
                      <input
                        type="text"
                        value={member.nationality}
                        onChange={(e) => handleCoreMemberChange(index, 'nationality', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('enterpriseRegister.coreMembers.gender')}</label>
                      <select
                        value={member.gender}
                        onChange={(e) => handleCoreMemberChange(index, 'gender', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">{t('common.required') === '必填' ? '请选择' : 'Please select'}</option>
                        <option value="男">男</option>
                        <option value="女">女</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('enterpriseRegister.coreMembers.birthDate')}</label>
                      <input
                        type="date"
                        value={member.birthDate}
                        onChange={(e) => handleCoreMemberChange(index, 'birthDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('enterpriseRegister.coreMembers.idType') + " *"}</label>
                      <select
                        value={member.idType}
                        onChange={(e) => handleCoreMemberChange(index, 'idType', e.target.value as 'id_card' | 'passport')}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="id_card">{t('enterpriseRegister.coreMembers.idTypes.idCard')}</option>
                        <option value="passport">{t('enterpriseRegister.coreMembers.idTypes.passport')}</option>
                      </select>
                       <p className="mt-1 text-xs text-gray-500">{t('enterpriseRegister.coreMembers.idTypeInstructions')}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('enterpriseRegister.coreMembers.idNumber') + " *"}</label>
                      <input
                        type="text"
                        value={member.idNumber}
                        onChange={(e) => handleCoreMemberChange(index, 'idNumber', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('enterpriseRegister.coreMembers.idPhoto') + " *"}</label>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 2 * 1024 * 1024) {
                              setError('证件照文件大小不能超过2MB');
                              return;
                            }
                            handleCoreMemberChange(index, 'idPhoto', file);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">{t('common.required') === '必填' ? '支持JPG、PNG格式，最大2MB' : 'Support JPG, PNG format, max 2MB'}</p>
                      {member.idPhoto && (
                        <p className="text-xs text-green-600 mt-1">
                          已选择: {member.idPhoto.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('enterpriseRegister.coreMembers.phone')}</label>
                      <input
                        type="tel"
                        value={member.phone}
                        onChange={(e) => handleCoreMemberChange(index, 'phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('enterpriseRegister.coreMembers.email') + " *"}</label>
                      <input
                        type="email"
                        value={member.email}
                        onChange={(e) => handleCoreMemberChange(index, 'email', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('enterpriseRegister.coreMembers.university')}</label>
                      <input
                        type="text"
                        value={member.university}
                        onChange={(e) => handleCoreMemberChange(index, 'university', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('enterpriseRegister.coreMembers.highestDegree')}</label>
                      <select
                        value={member.highestDegree}
                        onChange={(e) => handleCoreMemberChange(index, 'highestDegree', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">{t('common.required') === '必填' ? '请选择' : 'Please select'}</option>
                         <option value="本科">{t('enterpriseRegister.coreMembers.degrees.bachelor')}</option>
                         <option value="硕士">{t('enterpriseRegister.coreMembers.degrees.master')}</option>
                         <option value="博士">{t('enterpriseRegister.coreMembers.degrees.doctor')}</option>
                         <option value="其他">{t('enterpriseRegister.coreMembers.degrees.other')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('enterpriseRegister.coreMembers.organization')}</label>
                      <input
                        type="text"
                        value={member.organization}
                        onChange={(e) => handleCoreMemberChange(index, 'organization', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('enterpriseRegister.coreMembers.position')}</label>
                      <input
                        type="text"
                        value={member.position}
                        onChange={(e) => handleCoreMemberChange(index, 'position', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('enterpriseRegister.coreMembers.cv')}</label>
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

            {/* 5. 文档上传 */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">{t('enterpriseRegister.documents.title')} {t('common.required') === '必填' ? '(全部为PDF格式)' : '(all as PDFs)'}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('enterpriseRegister.documents.businessLicense') + " *"}
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleDocumentChange('businessLicense', e.target.files?.[0] || null)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('enterpriseRegister.documents.commitmentLetter') + " *"}
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleDocumentChange('commitmentLetter', e.target.files?.[0] || null)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {t('common.required') === '必填' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('enterpriseRegister.documents.businessPlanChinese')} *
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleDocumentChange('businessPlanChinese', e.target.files?.[0] || null)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('enterpriseRegister.documents.businessPlanEnglish')} *
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleDocumentChange('businessPlanEnglish', e.target.files?.[0] || null)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('enterpriseRegister.documents.businessPlanEnglish')} *
                    </label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleDocumentChange('businessPlanEnglish', e.target.files?.[0] || null)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('enterpriseRegister.documents.presentation') + " *"}
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
                    {t('enterpriseRegister.documents.supplementaryMaterials')}
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

            {/* 6. 登录密码 */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">{t('enterpriseRegister.password.title')}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('enterpriseRegister.password.password') + " *"}
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
                    {t('enterpriseRegister.password.confirmPassword') + " *"}
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

            {/* 必填选填说明 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                {t('enterpriseRegister.requiredNote')}
              </p>
            </div>

            {/* 提交按钮 */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push('/portal')}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                 {loading ? t('enterpriseRegister.submitting') : t('enterpriseRegister.submit')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
