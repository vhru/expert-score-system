'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/i18n-new';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}


export default function HelpCenterPage() {
  const { t, language } = useLanguage();
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  // FAQ数据
  const faqData: FAQItem[] = [
    // 企业注册相关
    {
      id: 'enterprise-1',
      question: language === 'zh' ? '企业注册需要准备哪些材料？' : 'What materials are required for enterprise registration?',
      answer: language === 'zh' 
        ? '企业注册需要准备：营业执照扫描件、参赛承诺书、商业计划书（中英双语版本）、演示文稿（中英双语版本）、企业简介（2000字以内，中英双语）、项目简介（2000字以内，中英双语）等。'
        : 'Enterprise registration requires: business license scan, commitment letter, business plan (bilingual version), presentation (bilingual version), enterprise overview (within 2000 words, bilingual), project brief (within 2000 words, bilingual), etc.',
      category: 'enterprise'
    },
    {
      id: 'enterprise-2',
      question: language === 'zh' ? '企业注册后如何修改信息？' : 'How to modify information after enterprise registration?',
      answer: language === 'zh' 
        ? '企业注册后，您可以使用注册时的邮箱和密码登录团队后台，在"团队信息"页面修改相关信息。请注意，某些关键信息可能需要重新审核。'
        : 'After enterprise registration, you can log in to the team backend using your registered email and password, and modify relevant information on the "Team Information" page. Please note that some key information may require re-review.',
      category: 'enterprise'
    },
    {
      id: 'enterprise-3',
      question: language === 'zh' ? '企业注册时上传的文件有什么要求？' : 'What are the requirements for files uploaded during enterprise registration?',
      answer: language === 'zh' 
        ? '上传文件要求：所有文档必须是PDF格式，单个文件不超过10MB。演示文稿需要中英双语版本，商业计划书需要中英双语版本。图片文件支持PNG、JPG格式。'
        : 'File upload requirements: All documents must be in PDF format, with a maximum file size of 10MB. Presentations require bilingual versions, business plans require bilingual versions. Image files support PNG, JPG formats.',
      category: 'enterprise'
    },
    
    // 团队注册相关
    {
      id: 'team-1',
      question: language === 'zh' ? '团队注册需要准备哪些材料？' : 'What materials are required for team registration?',
      answer: language === 'zh' 
        ? '团队注册需要准备：参赛承诺书、项目技术可行性分析（中英双语版本）、演示文稿（中英双语版本）、项目简介（2000字以内，中英双语）、核心成员身份证或护照扫描件等。'
        : 'Team registration requires: commitment letter, technical feasibility analysis (bilingual version), presentation (bilingual version), project brief (within 2000 words, bilingual), core members\' ID or passport scans, etc.',
      category: 'team'
    },
    {
      id: 'team-2',
      question: language === 'zh' ? '团队注册后如何修改信息？' : 'How to modify information after team registration?',
      answer: language === 'zh' 
        ? '团队注册后，您可以使用注册时的邮箱和密码登录团队后台，在"团队信息"页面修改相关信息。请注意，某些关键信息可能需要重新审核。'
        : 'After team registration, you can log in to the team backend using your registered email and password, and modify relevant information on the "Team Information" page. Please note that some key information may require re-review.',
      category: 'team'
    },
    {
      id: 'team-3',
      question: language === 'zh' ? '团队成员的国籍信息如何填写？' : 'How to fill in team members\' nationality information?',
      answer: language === 'zh' 
        ? '团队成员国籍信息需要准确填写。如果所有核心成员都是同一国籍，选择"单一国籍"；如果包含不同国籍成员，选择"多国籍"并详细列出所有国籍。'
        : 'Team members\' nationality information must be accurately filled. If all core members are of the same nationality, select "Single Nationality"; if including members of different nationalities, select "Multiple Nationalities" and list all nationalities in detail.',
      category: 'team'
    },
    
    // 修改相关
    {
      id: 'modify-1',
      question: language === 'zh' ? '如何修改已提交的项目信息？' : 'How to modify submitted project information?',
      answer: language === 'zh' 
        ? '登录团队后台后，在"团队信息"页面可以修改项目信息。修改后需要重新提交审核。请注意，在评审期间可能无法修改某些关键信息。'
        : 'After logging into the team backend, you can modify project information on the "Team Information" page. After modification, you need to resubmit for review. Please note that some key information may not be modifiable during the review period.',
      category: 'modify'
    },
    {
      id: 'modify-2',
      question: language === 'zh' ? '修改信息后需要重新审核吗？' : 'Do I need re-review after modifying information?',
      answer: language === 'zh' 
        ? '是的，修改重要信息后需要重新提交审核。系统会通知相关专家重新评审您的项目。审核时间通常为3-5个工作日。'
        : 'Yes, after modifying important information, you need to resubmit for review. The system will notify relevant experts to re-evaluate your project. Review time is usually 3-5 business days.',
      category: 'modify'
    },
    {
      id: 'modify-3',
      question: language === 'zh' ? '忘记登录密码怎么办？' : 'What to do if I forget my login password?',
      answer: language === 'zh' 
        ? '如果忘记密码，请联系管理员重置密码。请提供您的注册邮箱和团队名称，管理员会为您重置密码并发送到您的邮箱。'
        : 'If you forget your password, please contact the administrator to reset it. Please provide your registered email and team name, and the administrator will reset your password and send it to your email.',
      category: 'modify'
    }
  ];

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };


  const getCategoryTitle = (category: string) => {
    if (language === 'zh') {
      switch (category) {
        case 'enterprise': return '企业注册';
        case 'team': return '团队注册';
        case 'modify': return '信息修改';
        default: return '其他';
      }
    } else {
      switch (category) {
        case 'enterprise': return 'Enterprise Registration';
        case 'team': return 'Team Registration';
        case 'modify': return 'Information Modification';
        default: return 'Others';
      }
    }
  };

  const groupedFAQ = faqData.reduce((acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = [];
    }
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, FAQItem[]>);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <a href="/" className="text-blue-600 hover:text-blue-500 mr-4">
                {language === 'zh' ? '← 返回首页' : '← Back to Home'}
              </a>
              <h1 className="text-2xl font-bold text-gray-900">
                {language === 'zh' ? '帮助中心' : 'Help Center'}
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Introduction */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {language === 'zh' ? '常见问题解答' : 'Frequently Asked Questions'}
          </h2>
          <p className="text-lg text-gray-600">
            {language === 'zh' 
              ? '在这里您可以找到关于STIC大赛注册和使用的常见问题解答'
              : 'Here you can find answers to frequently asked questions about STIC competition registration and usage'
            }
          </p>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-8">
          {Object.entries(groupedFAQ).map(([category, faqs]) => (
            <div key={category} className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">
                  {getCategoryTitle(category)}
                </h3>
              </div>
              <div className="divide-y divide-gray-200">
                {faqs.map((faq) => (
                  <div key={faq.id} className="px-6 py-4">
                    <button
                      onClick={() => toggleFAQ(faq.id)}
                      className="w-full text-left flex justify-between items-center hover:text-blue-600 transition-colors"
                    >
                      <span className="font-medium text-gray-900">{faq.question}</span>
                      <span className="text-gray-500">
                        {expandedFAQ === faq.id ? '−' : '+'}
                      </span>
                    </button>
                    {expandedFAQ === faq.id && (
                      <div className="mt-3 text-gray-600 leading-relaxed">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-16 bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">
              {language === 'zh' ? '联系我们' : 'Contact Us'}
            </h3>
            <p className="text-gray-600 mt-2">
              {language === 'zh' 
                ? '如果您的问题在FAQ中没有找到答案，请通过以下方式联系我们'
                : 'If you cannot find the answer to your question in the FAQ, please contact us through the following methods'
              }
            </p>
          </div>
          
          <div className="p-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-lg">📧</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    {language === 'zh' ? '技术支持邮箱' : 'Technical Support Email'}
                  </h4>
                  <p className="text-gray-600 mb-4">
                    {language === 'zh' 
                      ? '请将您的问题发送至以下邮箱，我们会尽快回复您：'
                      : 'Please send your questions to the following email address, and we will reply to you as soon as possible:'
                    }
                  </p>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">
                          {language === 'zh' ? '邮箱地址' : 'Email Address'}
                        </p>
                        <p className="text-lg font-mono text-blue-600">
                          nastic@vip.163.com
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText('nastic@vip.163.com');
                          // 简单的复制提示
                          const button = document.querySelector('.copy-btn') as HTMLButtonElement;
                          if (button) {
                            const originalText = button.textContent;
                            button.textContent = language === 'zh' ? '已复制!' : 'Copied!';
                            setTimeout(() => {
                              button.textContent = originalText;
                            }, 2000);
                          }
                        }}
                        className="copy-btn bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      >
                        {language === 'zh' ? '复制邮箱' : 'Copy Email'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-sm text-gray-600">
                    <p className="mb-2">
                      {language === 'zh' ? '发送邮件时请包含以下信息：' : 'Please include the following information when sending emails:'}
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-500">
                      <li>{language === 'zh' ? '您的姓名和联系方式' : 'Your name and contact information'}</li>
                      <li>{language === 'zh' ? '问题类型（注册、技术、账户等）' : 'Problem type (registration, technical, account, etc.)'}</li>
                      <li>{language === 'zh' ? '详细的问题描述' : 'Detailed problem description'}</li>
                      <li>{language === 'zh' ? '相关的截图或错误信息' : 'Relevant screenshots or error messages'}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-yellow-600 text-lg">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-800">
                    {language === 'zh' 
                      ? '我们会在1-2个工作日内回复您的邮件。对于紧急问题，请在工作时间（周一至周五 9:00-18:00）发送邮件。'
                      : 'We will reply to your email within 1-2 business days. For urgent issues, please send emails during business hours (Monday to Friday 9:00-18:00).'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

