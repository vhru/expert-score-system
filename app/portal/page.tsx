'use client';

import { useState } from 'react';
import LanguageSwitcherNew from '@/components/LanguageSwitcherNew';
import { useLanguage } from '@/lib/language-context';

export default function PortalPage() {
  const [activeTab, setActiveTab] = useState('login');
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-blue-600">🏆</div>
              <h1 className="ml-3 text-2xl font-bold text-gray-900">
                {t('portal.title')}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSwitcherNew />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {t('portal.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('portal.subtitle')}
          </p>
        </div>

        {/* Role Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* 企业组专区 */}
          <div className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
            <div className="text-5xl mb-4">🏢</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{t('portal.teamSection.title')} / Enterprise</h3>
            <p className="text-sm text-gray-600 mb-4">
              {t('portal.teamSection.description')}
            </p>
            <div className="space-y-2">
              <a 
                href="/enterprise-register" 
                className="block w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors text-sm"
              >
{t('portal.teamSection.enterpriseRegister')}
              </a>
              <a 
                href="/team-login" 
                className="block w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
{t('portal.teamSection.login')}
              </a>
            </div>
          </div>

          {/* 团队组专区 */}
          <div className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
            <div className="text-5xl mb-4">👥</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{t('portal.teamSection.title')} / Team</h3>
            <p className="text-sm text-gray-600 mb-4">
              {t('portal.teamSection.description')}
            </p>
            <div className="space-y-2">
              <a 
                href="/team-register-new" 
                className="block w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
{t('portal.teamSection.teamRegister')}
              </a>
              <a 
                href="/team-login" 
                className="block w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
{t('portal.teamSection.login')}
              </a>
            </div>
          </div>

          {/* 专家专区 */}
          <div className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
            <div className="text-5xl mb-4">👨‍🎓</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{t('portal.expertSection.title')} / Expert</h3>
            <p className="text-sm text-gray-600 mb-4">
              {t('portal.expertSection.description')}
            </p>
            <div className="space-y-2">
              <a 
                href="/expert-login" 
                className="block w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
{t('portal.expertSection.login')}
              </a>
              <div className="text-xs text-gray-500">
{t('portal.expertSection.note')}
              </div>
            </div>
          </div>

          {/* 管理员专区 */}
          <div className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
            <div className="text-5xl mb-4">👨‍💼</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{t('portal.adminSection.title')} / Admin</h3>
            <p className="text-sm text-gray-600 mb-4">
              {t('portal.adminSection.description')}
            </p>
            <div className="space-y-2">
              <a 
                href="/admin-login" 
                className="block w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
{t('portal.adminSection.login')}
              </a>
              <div className="text-xs text-gray-500">
{t('portal.adminSection.note')}
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-500">
            <p>&copy; 2025 专家盲审系统. 专业、安全、高效的作品评审平台.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
