import React, { useState, useEffect } from 'react';

// 国际化配置
export type Language = 'zh' | 'en';

export interface Translations {
  // 通用
  common: {
    loading: string;
    submit: string;
    cancel: string;
    confirm: string;
    back: string;
    next: string;
    save: string;
    edit: string;
    delete: string;
    view: string;
    download: string;
    upload: string;
    login: string;
    logout: string;
    register: string;
    email: string;
    password: string;
    name: string;
    phone: string;
    description: string;
    status: string;
    date: string;
    score: string;
    comments: string;
    team: string;
    expert: string;
    admin: string;
  };
  
  // 导航和页面标题
  nav: {
    portal: string;
    teamLogin: string;
    teamRegister: string;
    expertLogin: string;
    adminLogin: string;
    teamDashboard: string;
    expertDashboard: string;
    adminDashboard: string;
  };
  
  // 门户页面
  portal: {
    title: string;
    subtitle: string;
    teamSection: {
      title: string;
      description: string;
      register: string;
      login: string;
    };
    expertSection: {
      title: string;
      description: string;
      login: string;
      note: string;
    };
    adminSection: {
      title: string;
      description: string;
      login: string;
      note: string;
    };
  };
  
  // 团队相关
  team: {
    register: {
      title: string;
      teamName: string;
      contactPerson: string;
      contactPhone: string;
      contactEmail: string;
      teamDescription: string;
      isEnterprise: string;
      enterpriseName: string;
      enterpriseLicense: string;
      submitButton: string;
    };
    login: {
      title: string;
      email: string;
      password: string;
      loginButton: string;
      noAccount: string;
      registerLink: string;
    };
    dashboard: {
      title: string;
      submissions: string;
      status: string;
      actions: string;
    };
  };
  
  // 专家相关
  expert: {
    login: {
      title: string;
      username: string;
      password: string;
      loginButton: string;
    };
    dashboard: {
      title: string;
      assignments: string;
      status: string;
      score: string;
      actions: string;
    };
  };
  
  // 管理员相关
  admin: {
    login: {
      title: string;
      email: string;
      password: string;
      loginButton: string;
    };
    dashboard: {
      title: string;
      teamManagement: string;
      expertManagement: string;
      reviewManagement: string;
      statistics: string;
    };
  };
  
  // 状态文本
  status: {
    pending: string;
    inProgress: string;
    completed: string;
    assigned: string;
    notAssigned: string;
    active: string;
    inactive: string;
  };
  
  // 错误信息
  errors: {
    required: string;
    invalidEmail: string;
    invalidPhone: string;
    fileTooLarge: string;
    invalidFileType: string;
    loginFailed: string;
    networkError: string;
    unauthorized: string;
  };
}

export const translations: Record<Language, Translations> = {
  zh: {
    common: {
      loading: '加载中...',
      submit: '提交',
      cancel: '取消',
      confirm: '确认',
      back: '返回',
      next: '下一步',
      save: '保存',
      edit: '编辑',
      delete: '删除',
      view: '查看',
      download: '下载',
      upload: '上传',
      login: '登录',
      logout: '退出登录',
      register: '注册',
      email: '邮箱',
      password: '密码',
      name: '姓名',
      phone: '电话',
      description: '描述',
      status: '状态',
      date: '日期',
      score: '分数',
      comments: '评论',
      team: '团队',
      expert: '专家',
      admin: '管理员',
    },
    nav: {
      portal: '系统首页',
      teamLogin: '团队登录',
      teamRegister: '团队注册',
      expertLogin: '专家登录',
      adminLogin: '管理员登录',
      teamDashboard: '团队管理',
      expertDashboard: '专家评审',
      adminDashboard: '管理后台',
    },
    portal: {
      title: '欢迎使用专家盲审系统',
      subtitle: '专业的作品评审平台，支持团队作品提交、专家盲审、管理员统一管理',
      teamSection: {
        title: '团队专区',
        description: '注册团队账号，提交参赛作品，查看评审进度',
        register: '团队注册',
        login: '团队登录',
      },
      expertSection: {
        title: '专家专区',
        description: '专家登录评审系统，查看分配任务，提交评审意见',
        login: '专家登录',
        note: '使用分配的专家账号登录',
      },
      adminSection: {
        title: '管理员专区',
        description: '系统管理后台，管理团队、专家、分配评审任务',
        login: '管理员登录',
        note: '系统管理员专用入口',
      },
    },
    team: {
      register: {
        title: '团队注册',
        teamName: '团队名称',
        contactPerson: '联系人',
        contactPhone: '联系电话',
        contactEmail: '联系邮箱',
        teamDescription: '团队描述',
        isEnterprise: '是否为企业团队',
        enterpriseName: '企业名称',
        enterpriseLicense: '企业资质证书',
        submitButton: '注册团队',
      },
      login: {
        title: '团队登录',
        email: '邮箱',
        password: '密码',
        loginButton: '登录',
        noAccount: '还没有团队账号？',
        registerLink: '立即注册',
      },
      dashboard: {
        title: '团队管理后台',
        submissions: '作品提交',
        status: '状态',
        actions: '操作',
      },
    },
    expert: {
      login: {
        title: '专家登录',
        username: '用户名',
        password: '密码',
        loginButton: '登录',
      },
      dashboard: {
        title: '专家评审系统',
        assignments: '评审任务',
        status: '状态',
        score: '分数',
        actions: '操作',
      },
    },
    admin: {
      login: {
        title: '管理员登录',
        email: '邮箱',
        password: 'password',
        loginButton: '登录',
      },
      dashboard: {
        title: '管理员控制台',
        teamManagement: '团队管理',
        expertManagement: '专家管理',
        reviewManagement: '评审管理',
        statistics: '统计报告',
      },
    },
    status: {
      pending: '待处理',
      inProgress: '评审中',
      completed: '评审完成',
      assigned: '已分配',
      notAssigned: '未分配',
      active: '活跃',
      inactive: '非活跃',
    },
    errors: {
      required: '此字段为必填项',
      invalidEmail: '邮箱格式不正确',
      invalidPhone: '手机号格式不正确',
      fileTooLarge: '文件过大',
      invalidFileType: '文件类型不支持',
      loginFailed: '登录失败',
      networkError: '网络错误',
      unauthorized: '权限不足',
    },
  },
  en: {
    common: {
      loading: 'Loading...',
      submit: 'Submit',
      cancel: 'Cancel',
      confirm: 'Confirm',
      back: 'Back',
      next: 'Next',
      save: 'Save',
      edit: 'Edit',
      delete: 'Delete',
      view: 'View',
      download: 'Download',
      upload: 'Upload',
      login: 'Login',
      logout: 'Logout',
      register: 'Register',
      email: 'Email',
      password: 'Password',
      name: 'Name',
      phone: 'Phone',
      description: 'Description',
      status: 'Status',
      date: 'Date',
      score: 'Score',
      comments: 'Comments',
      team: 'Team',
      expert: 'Expert',
      admin: 'Admin',
    },
    nav: {
      portal: 'System Portal',
      teamLogin: 'Team Login',
      teamRegister: 'Team Register',
      expertLogin: 'Expert Login',
      adminLogin: 'Admin Login',
      teamDashboard: 'Team Dashboard',
      expertDashboard: 'Expert Review',
      adminDashboard: 'Admin Console',
    },
    portal: {
      title: 'Welcome to Expert Review System',
      subtitle: 'Professional review platform supporting team submissions, expert blind review, and admin management',
      teamSection: {
        title: 'Team Zone',
        description: 'Register team account, submit works, view review progress',
        register: 'Team Register',
        login: 'Team Login',
      },
      expertSection: {
        title: 'Expert Zone',
        description: 'Expert login to review system, view assigned tasks, submit review opinions',
        login: 'Expert Login',
        note: 'Login with assigned expert account',
      },
      adminSection: {
        title: 'Admin Zone',
        description: 'System management backend, manage teams, experts, assign review tasks',
        login: 'Admin Login',
        note: 'System administrator access only',
      },
    },
    team: {
      register: {
        title: 'Team Registration',
        teamName: 'Team Name',
        contactPerson: 'Contact Person',
        contactPhone: 'Contact Phone',
        contactEmail: 'Contact Email',
        teamDescription: 'Team Description',
        isEnterprise: 'Is Enterprise Team',
        enterpriseName: 'Enterprise Name',
        enterpriseLicense: 'Enterprise License',
        submitButton: 'Register Team',
      },
      login: {
        title: 'Team Login',
        email: 'Email',
        password: 'Password',
        loginButton: 'Login',
        noAccount: 'No team account yet?',
        registerLink: 'Register Now',
      },
      dashboard: {
        title: 'Team Dashboard',
        submissions: 'Submissions',
        status: 'Status',
        actions: 'Actions',
      },
    },
    expert: {
      login: {
        title: 'Expert Login',
        username: 'Username',
        password: 'Password',
        loginButton: 'Login',
      },
      dashboard: {
        title: 'Expert Review System',
        assignments: 'Review Tasks',
        status: 'Status',
        score: 'Score',
        actions: 'Actions',
      },
    },
    admin: {
      login: {
        title: 'Admin Login',
        email: 'Email',
        password: 'Password',
        loginButton: 'Login',
      },
      dashboard: {
        title: 'Admin Console',
        teamManagement: 'Team Management',
        expertManagement: 'Expert Management',
        reviewManagement: 'Review Management',
        statistics: 'Statistics',
      },
    },
    status: {
      pending: 'Pending',
      inProgress: 'In Progress',
      completed: 'Completed',
      assigned: 'Assigned',
      notAssigned: 'Not Assigned',
      active: 'Active',
      inactive: 'Inactive',
    },
    errors: {
      required: 'This field is required',
      invalidEmail: 'Invalid email format',
      invalidPhone: 'Invalid phone format',
      fileTooLarge: 'File too large',
      invalidFileType: 'Unsupported file type',
      loginFailed: 'Login failed',
      networkError: 'Network error',
      unauthorized: 'Unauthorized',
    },
  },
};

// 语言切换Hook
export function useLanguage() {
  const [language, setLanguage] = useState<Language>('zh');
  
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
  };
  
  const t = (key: string) => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  };
  
  return { language, changeLanguage, t };
}
