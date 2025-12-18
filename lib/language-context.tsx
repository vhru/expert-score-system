'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, Translations, zhTranslations, enTranslations } from './i18n-new';

// 创建语言上下文
const LanguageContext = createContext<{
  language: Language;
  changeLanguage: (lang: Language) => void;
  t: (key: string) => string;
} | null>(null);

// 语言提供者组件
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('zh');
  const [updateKey, setUpdateKey] = useState(0);

  useEffect(() => {
    // 从localStorage读取语言设置
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'zh' || savedLanguage === 'en')) {
      setLanguage(savedLanguage);
    }
  }, []);

  const changeLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    // 强制更新所有使用翻译的组件
    setUpdateKey(prev => prev + 1);
  };

  const t = (key: string) => {
    try {
      const translations: Record<Language, Translations> = {
        zh: zhTranslations,
        en: enTranslations,
      };
      
      const keys = key.split('.');
      let value: any = translations[language];
      
      for (const k of keys) {
        value = value?.[k];
      }
      
      // 如果找不到翻译，返回key本身，但添加调试信息
      if (value === undefined || value === null) {
        console.warn(`Translation missing for key: ${key} in language: ${language}`);
        console.warn(`Available translations for ${language}:`, Object.keys(translations[language] || {}));
        return key;
      }
      
      return value;
    } catch (error) {
      console.error(`Translation error for key: ${key}`, error);
      return key;
    }
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      <div key={updateKey}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

// 使用语言的Hook
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
