'use client';

import { useState, useEffect } from 'react';
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

export default function TeamRegisterPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [teamId, setTeamId] = useState<number | null>(null);
  
  // 基本信息
  const [basicInfo, setBasicInfo] = useState({
    projectName: '',
    coreMembersNationality: '',
    nationalityType: 'single',
    selectedCountries: [] as string[],
    nationalityOthers: '',
    projectBrief: '',
    projectStage: '',
    projectStageOthers: '',
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
    technicalInfoChinese: null as File | null,
    technicalInfoEnglish: null as File | null,
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
    if (file && file.size > 5 * 1024 * 1024) {
      setError('PDF文件大小不能超过5MB');
      return;
    }
    setDocuments(prev => ({ ...prev, [type]: file }));
  };


  // 加载团队数据
  const loadTeamData = async () => {
    try {
      const token = localStorage.getItem('teamToken');
      if (!token) {
        router.push('/team-login');
        return;
      }

      const response = await fetch('/api/teams/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📋 获取团队数据响应:', data);
        if (data.success && data.team) {
          const team = data.team;
          console.log('📋 团队数据:', team);
          setTeamId(team.id);
          
          // 解密团队信息
          const { decryptData } = await import('@/lib/encryption');
          let decryptedInfo;
          try {
            decryptedInfo = JSON.parse(decryptData(team.encrypted_info));
          } catch (error) {
            console.error('解密团队信息失败:', error);
            // 如果解密失败，使用数据库中的基本信息
            decryptedInfo = {
              projectName: team.team_name || '',
              projectBrief: '',
              projectStage: team.project_stage || '',
              projectStageOthers: team.project_stage_others || '',
              coreMembersNationality: '',
              nationalityType: team.nationality_type || 'single',
              selectedCountries: team.selected_countries ? JSON.parse(team.selected_countries) : [],
              nationalityOthers: team.nationality_others || '',
              contactPersonName: '',
              contactPersonPosition: '',
              contactPersonPhone: '',
              contactPersonEmail: team.contact_email || '',
              coreMembers: []
            };
          }
          
          // 设置基本信息
          setBasicInfo({
            projectName: decryptedInfo.projectName || '',
            coreMembersNationality: decryptedInfo.coreMembersNationality || '',
            nationalityType: decryptedInfo.nationalityType || 'single',
            selectedCountries: decryptedInfo.selectedCountries || [],
            nationalityOthers: decryptedInfo.nationalityOthers || '',
            projectBrief: decryptedInfo.projectBrief || '',
            projectStage: decryptedInfo.projectStage || '',
            projectStageOthers: decryptedInfo.projectStageOthers || '',
            password: '',
            confirmPassword: ''
          });
          
          // 设置联系人信息
          setContactInfo({
            contactPersonName: decryptedInfo.contactPersonName || '',
            contactPersonPosition: decryptedInfo.contactPersonPosition || '',
            contactPersonPhone: decryptedInfo.contactPersonPhone || '',
            contactPersonEmail: decryptedInfo.contactPersonEmail || ''
          });
          
          // 设置核心成员信息 - 优先使用数据库数据
          if (team.core_members && Array.isArray(team.core_members) && team.core_members.length > 0) {
            console.log('使用数据库核心成员数据:', team.core_members);
            setCoreMembers(team.core_members);
          } else if (decryptedInfo.coreMembers && Array.isArray(decryptedInfo.coreMembers)) {
            console.log('使用解密的核心成员数据:', decryptedInfo.coreMembers);
            setCoreMembers(decryptedInfo.coreMembers);
          } else {
            console.log('没有找到核心成员数据');
            setCoreMembers([]);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load team data:', error);
    }
  };

  // 检查是否为更新模式
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const update = urlParams.get('update');
    if (update === 'true') {
      setIsUpdateMode(true);
      loadTeamData();
    }
  }, []);


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
      formData.append('contactInfo', JSON.stringify(contactInfo));
      
      // 核心成员信息（不包含文件）
      const coreMembersWithoutFiles = coreMembers.map(member => ({
        ...member,
        idPhoto: undefined, // 移除文件对象
        cv: undefined       // 移除文件对象
      }));
      formData.append('coreMembers', JSON.stringify(coreMembersWithoutFiles));
      formData.append('teamType', 'team');

      // 文档上传 - 只在注册模式下发送
      if (!isUpdateMode) {
        if (documents.commitmentLetter) formData.append('commitmentLetter', documents.commitmentLetter);
        if (documents.technicalInfoChinese) formData.append('technicalInfoChinese', documents.technicalInfoChinese);
        if (documents.technicalInfoEnglish) formData.append('technicalInfoEnglish', documents.technicalInfoEnglish);
        if (documents.presentation) formData.append('presentation', documents.presentation);
        if (documents.supplementaryMaterials) formData.append('supplementaryMaterials', documents.supplementaryMaterials);
      }

      // 核心成员CV和证件照 - 只在注册模式下发送
      if (!isUpdateMode) {
        coreMembers.forEach((member, index) => {
          if (member.cv) {
            formData.append(`memberCv_${index}`, member.cv);
          }
          if (member.idPhoto) {
            formData.append(`memberIdPhoto_${index}`, member.idPhoto);
          }
        });
      }


      const apiUrl = isUpdateMode ? `/api/teams/update-team/${teamId}` : '/api/teams/register-team';
      const response = await fetch(apiUrl, {
        method: isUpdateMode ? 'PUT' : 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorResult = await response.json();
        console.error('Registration failed:', errorResult);
        setError(errorResult.error || '注册失败');
        return;
      }

      let result;
      try {
        result = await response.json();
        console.log('Registration result:', result);
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        setError('响应解析失败，请重试');
        return;
      }

      if (result && result.success) {
        alert(isUpdateMode ? '团队信息更新成功！' : t('teamRegister.success'));
        if (isUpdateMode) {
          router.push('/team-dashboard');
        } else {
          router.push('/team-login');
        }
      } else {
        setError(result?.error || (isUpdateMode ? '更新失败' : '注册失败'));
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
                <h1 className="text-2xl font-bold text-gray-900">
                  {isUpdateMode ? '更新团队信息' : t('teamRegister.title')}
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                  {isUpdateMode ? '更新您的团队注册信息和提交的文档' : t('teamRegister.subtitle')}
                </p>
              </>
            ) : (
              <h1 className="text-2xl font-bold text-gray-900">{t('teamRegister.subtitle')}</h1>
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
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">{t('teamRegister.projectInfo.title')}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('teamRegister.projectInfo.projectName') + " *"}
                  </label>
                  <input
                    type="text"
                    name="projectName"
                    value={basicInfo.projectName}
                    onChange={handleBasicInfoChange}
                    required
                    disabled={isUpdateMode}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isUpdateMode ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                  />
                  {isUpdateMode && (
                    <p className="text-sm text-gray-500 mt-1">
                      {t('common.language') === 'zh' ? '项目名称不可修改' : 'Project name cannot be modified'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('teamRegister.projectInfo.coreMembersNationality') + " *"}
                  </label>
                  
                  {/* 国籍类型选择 */}
                  <div className="mb-3">
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="nationalityType"
                          value="single"
                          checked={basicInfo.nationalityType === 'single'}
                          onChange={handleBasicInfoChange}
                          className="mr-2"
                        />
                        <span className="text-sm">{t('teamRegister.projectInfo.nationalityOptions.single')}</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="nationalityType"
                          value="multiple"
                          checked={basicInfo.nationalityType === 'multiple'}
                          onChange={handleBasicInfoChange}
                          className="mr-2"
                        />
                        <span className="text-sm">{t('teamRegister.projectInfo.nationalityOptions.multiple')}</span>
                      </label>
                    </div>
                  </div>

                  {/* 单一国家选择 */}
                  {basicInfo.nationalityType === 'single' && (
                    <select
                      name="coreMembersNationality"
                      value={basicInfo.coreMembersNationality}
                      onChange={handleBasicInfoChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{t('common.required') === '必填' ? '请选择' : 'Please select'}</option>
                      <option value="china">{t('teamRegister.projectInfo.countries.china')}</option>
                      <option value="thailand">{t('teamRegister.projectInfo.countries.thailand')}</option>
                      <option value="cambodia">{t('teamRegister.projectInfo.countries.cambodia')}</option>
                      <option value="vietnam">{t('teamRegister.projectInfo.countries.vietnam')}</option>
                      <option value="laos">{t('teamRegister.projectInfo.countries.laos')}</option>
                      <option value="myanmar">{t('teamRegister.projectInfo.countries.myanmar')}</option>
                      <option value="others">{t('teamRegister.projectInfo.countries.others')}</option>
                    </select>
                  )}

                  {/* 多国选择 */}
                  {basicInfo.nationalityType === 'multiple' && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {['china', 'thailand', 'cambodia', 'vietnam', 'laos', 'myanmar'].map((country) => (
                          <label key={country} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={basicInfo.selectedCountries.includes(country)}
                              onChange={(e) => {
                                const newCountries = e.target.checked
                                  ? [...basicInfo.selectedCountries, country]
                                  : basicInfo.selectedCountries.filter(c => c !== country);
                                setBasicInfo(prev => ({ ...prev, selectedCountries: newCountries }));
                              }}
                              className="mr-2"
                            />
                            <span className="text-sm">{t(`teamRegister.projectInfo.countries.${country}`)}</span>
                          </label>
                        ))}
                      </div>
                      <div className="mt-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={basicInfo.selectedCountries.includes('others')}
                            onChange={(e) => {
                              const newCountries = e.target.checked
                                ? [...basicInfo.selectedCountries, 'others']
                                : basicInfo.selectedCountries.filter(c => c !== 'others');
                              setBasicInfo(prev => ({ ...prev, selectedCountries: newCountries }));
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm">{t('teamRegister.projectInfo.countries.others')}</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Others文本框 */}
                  {(basicInfo.coreMembersNationality === 'others' || basicInfo.selectedCountries.includes('others')) && (
                    <div className="mt-3">
                      <input
                        type="text"
                        name="nationalityOthers"
                        value={basicInfo.nationalityOthers}
                        onChange={handleBasicInfoChange}
                        placeholder={t('common.required') === '必填' ? '请详细说明其他国籍' : 'Please specify other nationalities'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
{t('teamRegister.projectInfo.projectBrief')} * {t('common.required') === '必填' ? '(500字以内)' : '(within 500 words)'}
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
                  {t('teamRegister.projectInfo.projectStage') + " *"}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { value: t('teamRegister.projectInfo.stages.development'), label: t('teamRegister.projectInfo.stages.development') },
                    { value: t('teamRegister.projectInfo.stages.labTest'), label: t('teamRegister.projectInfo.stages.labTest') },
                    { value: t('teamRegister.projectInfo.stages.trialProduction'), label: t('teamRegister.projectInfo.stages.trialProduction') },
                    { value: t('teamRegister.projectInfo.stages.growth'), label: t('teamRegister.projectInfo.stages.growth') },
                    { value: t('teamRegister.projectInfo.stages.others'), label: t('teamRegister.projectInfo.stages.others') }
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
                {basicInfo.projectStage === t('teamRegister.projectInfo.stages.others') && (
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

            {/* 2. 项目联系人 */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">{t('teamRegister.contactInfo.title')}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('teamRegister.contactInfo.contactPersonName') + " *"}
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
                    {t('teamRegister.contactInfo.contactPersonPosition') + " *"}
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
                    {t('teamRegister.contactInfo.contactPersonPhone') + " *"}
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
                    {t('teamRegister.contactInfo.contactPersonEmail') + " *"}
                  </label>
                  <input
                    type="email"
                    name="contactPersonEmail"
                    value={contactInfo.contactPersonEmail}
                    onChange={handleContactInfoChange}
                    required
                    disabled={isUpdateMode}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isUpdateMode ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                  />
                  {isUpdateMode && (
                    <p className="text-sm text-gray-500 mt-1">
                      {t('common.language') === 'zh' ? '联系人邮箱不可修改' : 'Contact email cannot be modified'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 3. 核心成员信息 */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">{t('teamRegister.coreMembers.title')}</h2>
                {coreMembers.length < 6 && (
                  <button
                    type="button"
                    onClick={addCoreMember}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {t('teamRegister.coreMembers.addMember')}
                  </button>
                )}
              </div>

              {coreMembers.map((member, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-gray-900">{t('teamRegister.coreMembers.member')} {index + 1}</h3>
                    {coreMembers.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeCoreMember(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        {t('teamRegister.coreMembers.remove')}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('teamRegister.coreMembers.name') + " *"}</label>
                      <input
                        type="text"
                        value={member.name}
                        onChange={(e) => handleCoreMemberChange(index, 'name', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('teamRegister.coreMembers.nationality')}</label>
                      <input
                        type="text"
                        value={member.nationality}
                        onChange={(e) => handleCoreMemberChange(index, 'nationality', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('teamRegister.coreMembers.gender')}</label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('teamRegister.coreMembers.birthDate')}</label>
                      <input
                        type="date"
                        value={member.birthDate}
                        onChange={(e) => handleCoreMemberChange(index, 'birthDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('teamRegister.coreMembers.idType') + " *"}</label>
                      <select
                        value={member.idType}
                        onChange={(e) => handleCoreMemberChange(index, 'idType', e.target.value as 'id_card' | 'passport')}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="id_card">{t('teamRegister.coreMembers.idTypes.idCard')}</option>
                        <option value="passport">{t('teamRegister.coreMembers.idTypes.passport')}</option>
                      </select>
                      <p className="mt-1 text-xs text-gray-500">{t('teamRegister.coreMembers.idTypeInstructions')}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('teamRegister.coreMembers.idNumber') + " *"}</label>
                      <input
                        type="text"
                        value={member.idNumber}
                        onChange={(e) => handleCoreMemberChange(index, 'idNumber', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* 更新模式下隐藏证件照上传 */}
                    {!isUpdateMode && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('teamRegister.coreMembers.idPhoto') + " *"}</label>
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
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('teamRegister.coreMembers.phone')}</label>
                      <input
                        type="tel"
                        value={member.phone}
                        onChange={(e) => handleCoreMemberChange(index, 'phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('teamRegister.coreMembers.email') + " *"}</label>
                      <input
                        type="email"
                        value={member.email}
                        onChange={(e) => handleCoreMemberChange(index, 'email', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('teamRegister.coreMembers.university')}</label>
                      <input
                        type="text"
                        value={member.university}
                        onChange={(e) => handleCoreMemberChange(index, 'university', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('teamRegister.coreMembers.highestDegree')}</label>
                      <select
                        value={member.highestDegree}
                        onChange={(e) => handleCoreMemberChange(index, 'highestDegree', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">{t('common.required') === '必填' ? '请选择' : 'Please select'}</option>
                        <option value="{t('teamRegister.coreMembers.degrees.bachelor')}">{t('teamRegister.coreMembers.degrees.bachelor')}</option>
                        <option value="{t('teamRegister.coreMembers.degrees.master')}">{t('teamRegister.coreMembers.degrees.master')}</option>
                        <option value="{t('teamRegister.coreMembers.degrees.doctor')}">{t('teamRegister.coreMembers.degrees.doctor')}</option>
                        <option value="{t('teamRegister.coreMembers.degrees.other')}">{t('teamRegister.coreMembers.degrees.other')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('teamRegister.coreMembers.organization')}</label>
                      <input
                        type="text"
                        value={member.organization}
                        onChange={(e) => handleCoreMemberChange(index, 'organization', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('teamRegister.coreMembers.position')}</label>
                      <input
                        type="text"
                        value={member.position}
                        onChange={(e) => handleCoreMemberChange(index, 'position', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* 更新模式下隐藏简历上传 */}
                    {!isUpdateMode && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('teamRegister.coreMembers.cv')}</label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleCoreMemberChange(index, 'cv', e.target.files?.[0] || null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 4. 文档上传 - 只在注册模式下显示 */}
            {!isUpdateMode && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">{t('teamRegister.documents.title')} {t('common.required') === '必填' ? '(全部为PDF格式)' : '(all as PDFs)'}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('teamRegister.documents.commitmentLetter') + " *"}
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
                        {t('teamRegister.documents.technicalInfoChinese')} *
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleDocumentChange('technicalInfoChinese', e.target.files?.[0] || null)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('teamRegister.documents.technicalInfoEnglish')} *
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleDocumentChange('technicalInfoEnglish', e.target.files?.[0] || null)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('teamRegister.documents.technicalInfoEnglish')} *
                    </label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleDocumentChange('technicalInfoEnglish', e.target.files?.[0] || null)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('teamRegister.documents.presentation') + " *"}
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
                    {t('teamRegister.documents.supplementaryMaterials')}
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
            )}

            {/* 5. 登录密码 - 只在注册模式下显示 */}
            {!isUpdateMode && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">{t('teamRegister.password.title')}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('teamRegister.password.password') + " *"}
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
                    {t('teamRegister.password.confirmPassword') + " *"}
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
            )}

            {/* 必填选填说明 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                {t('teamRegister.requiredNote')}
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
                {loading ? (isUpdateMode ? '更新中...' : t('teamRegister.submitting')) : (isUpdateMode ? '更新信息' : t('teamRegister.submit'))}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
