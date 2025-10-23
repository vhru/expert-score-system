import React, { useState, useEffect } from 'react';

// 语言类型
export type Language = 'zh' | 'en';

// 翻译接口
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
    required: string;
    optional: string;
    privacyNotice: string;
    helpCenter: string;
  };
  
  // 门户页面
  portal: {
    title: string;
    subtitle: string;
    teamSection: {
      title: string;
      description: string;
      enterpriseRegister: string;
      login: string;
    };
    teamGroupSection: {
      title: string;
      description: string;
      teamRegister: string;
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
  
  // 企业注册
  enterpriseRegister: {
    title: string;
    subtitle: string;
    projectInfo: {
      title: string;
      projectName: string;
      registrationCountry: string;
      projectBrief: string;
      projectStage: string;
      stages: {
        development: string;
        labTest: string;
        trialProduction: string;
        batchProduction: string;
        growth: string;
        others: string;
      };
      nationalityOptions: {
        single: string;
        multiple: string;
      };
      countries: {
        china: string;
        thailand: string;
        cambodia: string;
        vietnam: string;
        laos: string;
        myanmar: string;
        others: string;
      };
    };
    enterpriseInfo: {
      title: string;
      enterpriseName: string;
      unifiedSocialCreditCode: string;
      registrationYear: string;
      legalRepresentative: string;
      headquartersLocation: string;
      registeredCapital: string;
      phone: string;
      website: string;
      enterpriseOverview: string;
    };
    contactInfo: {
      title: string;
      contactPersonName: string;
      contactPersonPosition: string;
      contactPersonPhone: string;
      contactPersonEmail: string;
    };
    coreMembers: {
      title: string;
      addMember: string;
      remove: string;
      member: string;
      name: string;
      nationality: string;
      gender: string;
      birthDate: string;
      idType: string;
      idTypeInstructions: string;
      idNumber: string;
      idPhoto: string;
      phone: string;
      email: string;
      university: string;
      highestDegree: string;
      organization: string;
      position: string;
      cv: string;
      idTypes: {
        idCard: string;
        passport: string;
      };
      degrees: {
        bachelor: string;
        master: string;
        doctor: string;
        other: string;
      };
    };
    documents: {
      title: string;
      businessLicense: string;
      commitmentLetter: string;
      businessPlanChinese: string;
      businessPlanEnglish: string;
      presentation: string;
      supplementaryMaterials: string;
    };
    password: {
      title: string;
      password: string;
      confirmPassword: string;
    };
    submit: string;
    submitting: string;
    success: string;
    requiredNote: string;
  };
  
  // 团队注册
  teamRegister: {
    title: string;
    subtitle: string;
    projectInfo: {
      title: string;
      projectName: string;
      coreMembersNationality: string;
      projectBrief: string;
      projectStage: string;
      stages: {
        development: string;
        labTest: string;
        trialProduction: string;
        growth: string;
        others: string;
      };
      nationalityOptions: {
        single: string;
        multiple: string;
      };
      countries: {
        china: string;
        thailand: string;
        cambodia: string;
        vietnam: string;
        laos: string;
        myanmar: string;
        others: string;
      };
    };
    contactInfo: {
      title: string;
      contactPersonName: string;
      contactPersonPosition: string;
      contactPersonPhone: string;
      contactPersonEmail: string;
    };
    coreMembers: {
      title: string;
      addMember: string;
      remove: string;
      member: string;
      name: string;
      nationality: string;
      gender: string;
      birthDate: string;
      idType: string;
      idTypeInstructions: string;
      idNumber: string;
      idPhoto: string;
      phone: string;
      email: string;
      university: string;
      highestDegree: string;
      organization: string;
      position: string;
      cv: string;
      idTypes: {
        idCard: string;
        passport: string;
      };
      degrees: {
        bachelor: string;
        master: string;
        doctor: string;
        other: string;
      };
    };
    documents: {
      title: string;
      commitmentLetter: string;
      technicalInfoChinese: string;
      technicalInfoEnglish: string;
      presentation: string;
      supplementaryMaterials: string;
    };
    images: {
      title: string;
      description: string;
      image: string;
    };
    password: {
      title: string;
      password: string;
      confirmPassword: string;
    };
    submit: string;
    submitting: string;
    success: string;
    requiredNote: string;
  };
  
  // 登录页面
  login: {
    team: {
      title: string;
      email: string;
      password: string;
      loginButton: string;
      noAccount: string;
      registerLink: string;
      backToPortal: string;
    };
    expert: {
      title: string;
      username: string;
      password: string;
      loginButton: string;
      backToPortal: string;
    };
    admin: {
      title: string;
      email: string;
      password: string;
      loginButton: string;
      backToPortal: string;
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
    registrationFailed: string;
  };
}

// 中文翻译
const zhTranslations: Translations = {
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
    required: '必填',
    optional: '选填',
    privacyNotice: '⚠️ 重要提示：所有上传的信息仅用于本次STIC大赛评审，我们将严格保护您的隐私信息，不会用于其他用途。',
    helpCenter: '帮助中心',
  },
  portal: {
    title: '澜湄国家科技创新大赛',
    subtitle: '专业的作品评审平台，支持团队作品提交、专家盲审、管理员统一管理',
    teamSection: {
      title: '企业专区',
      description: '注册企业账号，提交参赛作品，查看评审进度',
      enterpriseRegister: '企业组注册',
      login: '企业组登录',
    },
    teamGroupSection: {
      title: '团队专区',
      description: '注册团队账号，提交参赛作品，查看评审进度',
      teamRegister: '团队组注册',
      login: '团队组登录',
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
  enterpriseRegister: {
    title: '澜湄国家科技创新大赛 - 企业组报名',
    subtitle: 'Lancang-Mekong Countries Science and Technology Innovation Competition - Enterprise Registration',
    projectInfo: {
      title: '1. 参赛项目信息',
      projectName: '项目名称',
      registrationCountry: '企业注册国家',
      projectBrief: '项目简介（2000字以内， 中英双语）',
      projectStage: '项目阶段',
      stages: {
        development: '研发阶段',
        labTest: '实验室测试',
        trialProduction: '试生产',
        batchProduction: '批量生产和市场开发',
        growth: '成长阶段',
        others: '其他',
      },
      nationalityOptions: {
        single: '单一国家',
        multiple: '多国',
      },
      countries: {
        china: '中国',
        thailand: '泰国',
        cambodia: '柬埔寨',
        vietnam: '越南',
        laos: '老挝',
        myanmar: '缅甸',
        others: '其他',
      },
    },
    enterpriseInfo: {
      title: '2. 企业信息',
      enterpriseName: '企业名称',
      unifiedSocialCreditCode: '统一社会信用代码',
      registrationYear: '注册年份',
      legalRepresentative: '企业法定代表人',
      headquartersLocation: '总部所在地',
      registeredCapital: '注册资本',
      phone: '电话',
      website: '网站',
      enterpriseOverview: '企业简介（2000字以内， 中英双语）',
    },
    contactInfo: {
      title: '3. 项目联系人',
      contactPersonName: '姓名',
      contactPersonPosition: '职务',
      contactPersonPhone: '电话',
      contactPersonEmail: '邮箱（此为登录账号）',
    },
    coreMembers: {
      title: '4. 核心成员信息',
      addMember: '添加成员',
      remove: '删除',
      member: '成员',
      name: '姓名',
      nationality: '国籍',
      gender: '性别',
      birthDate: '出生年月',
      idType: '证件类型',
      idNumber: '证件号码',
      idPhoto: '证件照',
      phone: '电话',
      email: '电子邮箱',
      university: '毕业院校',
      highestDegree: '最高学历',
      organization: '所在单位',
      position: '职务/职称',
      cv: '简历',
      idTypes: {
        idCard: '国内身份证',
        passport: '外籍护照',
      },
      idTypeInstructions: '请选择：国内身份证 或 外籍护照',
      degrees: {
        bachelor: '本科',
        master: '硕士',
        doctor: '博士',
        other: '其他',
      },
    },
    documents: {
      title: '5. 需附材料清单',
      businessLicense: '营业执照扫描件',
      commitmentLetter: '参赛承诺书',
      businessPlanChinese: '商业计划书（中文版）',
      businessPlanEnglish: '商业计划书（英文版）',
      presentation: '演示文稿（中英双语版本）',
      supplementaryMaterials: '其他补充材料',
    },
    password: {
      title: '6. 登录密码',
      password: '密码',
      confirmPassword: '确认密码',
    },
    submit: '提交报名',
    submitting: '提交中...',
    success: '企业注册成功！',
    requiredNote: '* 必填项，其他为选填',
  },
  teamRegister: {
    title: '澜湄国家科技创新大赛 - 团队组报名',
    subtitle: 'Lancang-Mekong Countries Science and Technology Innovation Competition - Team Registration',
    projectInfo: {
      title: '1. 参赛项目信息',
      projectName: '项目名称',
      coreMembersNationality: '核心成员国籍',
      projectBrief: '项目简介（2000字以内， 中英双语）',
      projectStage: '项目阶段',
      stages: {
        development: '研发阶段',
        labTest: '实验室测试',
        trialProduction: '试生产',
        growth: '成长阶段',
        others: '其他',
      },
      nationalityOptions: {
        single: '单一国家',
        multiple: '多国',
      },
      countries: {
        china: '中国',
        thailand: '泰国',
        cambodia: '柬埔寨',
        vietnam: '越南',
        laos: '老挝',
        myanmar: '缅甸',
        others: '其他',
      },
    },
    contactInfo: {
      title: '2. 项目联系人',
      contactPersonName: '姓名',
      contactPersonPosition: '职务',
      contactPersonPhone: '电话',
      contactPersonEmail: '邮箱（此为登录账号）',
    },
    coreMembers: {
      title: '3. 核心成员信息',
      addMember: '添加成员',
      remove: '删除',
      member: '成员',
      name: '姓名',
      nationality: '国籍',
      gender: '性别',
      birthDate: '出生年月',
      idType: '证件类型',
      idNumber: '证件号码',
      idPhoto: '证件照',
      phone: '电话',
      email: '电子邮箱',
      university: '毕业院校',
      highestDegree: '最高学历',
      organization: '所在单位',
      position: '职务/职称',
      cv: '简历',
      idTypes: {
        idCard: '国内身份证',
        passport: '外籍护照',
      },
      idTypeInstructions: '请选择：国内身份证 或 外籍护照',
      degrees: {
        bachelor: '本科',
        master: '硕士',
        doctor: '博士',
        other: '其他',
      },
    },
    documents: {
      title: '4. 需附材料清单',
      commitmentLetter: '参赛承诺书',
      technicalInfoChinese: '项目技术可行性分析（中文版）',
      technicalInfoEnglish: '项目技术可行性分析（英文版）',
      presentation: '演示文稿（中英双语版本）',
      supplementaryMaterials: '其他补充材料',
    },
    images: {
      title: '团队图片',
      description: '可上传最多5张团队相关图片（PNG/JPG格式，每张不超过10MB）',
      image: '图片',
    },
    password: {
      title: '5. 登录密码',
      password: '密码',
      confirmPassword: '确认密码',
    },
    submit: '提交报名',
    submitting: '提交中...',
    success: '团队注册成功！',
    requiredNote: '* 必填项，其他为选填',
  },
  login: {
    team: {
      title: '团队登录',
      email: '邮箱',
      password: '密码',
      loginButton: '登录',
      noAccount: '还没有团队账号？',
      registerLink: '立即注册',
      backToPortal: '← 返回系统首页',
    },
    expert: {
      title: '专家登录',
      username: '用户名',
      password: '密码',
      loginButton: '登录',
      backToPortal: '← 返回系统首页',
    },
    admin: {
      title: '管理员登录',
      email: '邮箱',
      password: '密码',
      loginButton: '登录',
      backToPortal: '← 返回系统首页',
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
    registrationFailed: '注册失败',
  },
};

// 英文翻译
const enTranslations: Translations = {
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
    required: 'Required',
    optional: 'Optional',
    privacyNotice: '⚠️ Important Notice: All uploaded information is used solely for the STIC competition review. We strictly protect your privacy and will not use your information for any other purposes.',
    helpCenter: 'Help Center',
  },
  portal: {
    title: 'Lancang-Mekong Countries Science and Technology Innovation Competition',
    subtitle: 'Professional review platform supporting team submissions, expert blind review, and admin management',
    teamSection: {
      title: 'Enterprise Zone',
      description: 'Register enterprise account, submit works, view review progress',
      enterpriseRegister: 'Enterprise Registration',
      login: 'Enterprise Login',
    },
    teamGroupSection: {
      title: 'Team Zone',
      description: 'Register team account, submit works, view review progress',
      teamRegister: 'Team Registration',
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
  enterpriseRegister: {
    title: 'Lancang-Mekong Countries Science and Technology Innovation Competition - Enterprise Registration',
    subtitle: 'Lancang-Mekong Countries Science and Technology Innovation Competition - Enterprise Registration',
    projectInfo: {
      title: '1. Project Information',
      projectName: 'Project Name',
      registrationCountry: 'Registration Country',
      projectBrief: 'Project Brief',
      projectStage: 'Project Stage',
      stages: {
        development: 'R&D',
        labTest: 'Laboratory test',
        trialProduction: 'Pilot test',
        batchProduction: 'Batch production and market development',
        growth: 'Growth',
        others: 'Others',
      },
      nationalityOptions: {
        single: 'Single Country',
        multiple: 'Multiple Countries',
      },
      countries: {
        china: 'China',
        thailand: 'Thailand',
        cambodia: 'Cambodia',
        vietnam: 'Vietnam',
        laos: 'Laos',
        myanmar: 'Myanmar',
        others: 'Others',
      },
    },
    enterpriseInfo: {
      title: '2. Enterprise Information',
      enterpriseName: 'Enterprise Name',
      unifiedSocialCreditCode: 'Unified Social Credit Code',
      registrationYear: 'Registration Year (2019 or later)',
      legalRepresentative: 'Legal Representative',
      headquartersLocation: 'Headquarters Location',
      registeredCapital: 'Registered Capital (no more than 4.5 million USD)',
      phone: 'Phone',
      website: 'Website',
      enterpriseOverview: 'Enterprise Overview',
    },
    contactInfo: {
      title: '3. Project Contact Person',
      contactPersonName: 'Name',
      contactPersonPosition: 'Position',
      contactPersonPhone: 'Phone',
      contactPersonEmail: 'Email (This will be your login account)',
    },
    coreMembers: {
      title: '4. Core Team Members (Minimum 3 and no more than 6 members)',
      addMember: 'Add Member',
      remove: 'Remove',
      member: 'Member',
      name: 'Name',
      nationality: 'Nationality',
      gender: 'Gender',
      birthDate: 'Birth Date',
      idType: 'ID Type',
      idNumber: 'ID Number',
      idPhoto: 'ID Photo',
      phone: 'Phone',
      email: 'Email',
      university: 'University',
      highestDegree: 'Highest Degree',
      organization: 'Organization',
      position: 'Position',
      cv: 'CV (Optional)',
      idTypes: {
        idCard: 'ID Card',
        passport: 'Passport',
      },
      idTypeInstructions: 'Please select: ID Card for Chinese participants, Passport for foreign participants',
      degrees: {
        bachelor: 'Bachelor',
        master: 'Master',
        doctor: 'Doctor',
        other: 'Other',
      },
    },
    documents: {
      title: '5. Required Materials',
      businessLicense: 'Business License',
      commitmentLetter: 'Commitment Letter',
      businessPlanChinese: 'Business Plan (Chinese Version)',
      businessPlanEnglish: 'Business Plan (English Version)',
      presentation: 'Presentation',
      supplementaryMaterials: 'Supplementary Materials',
    },
    password: {
      title: '6. Login Password',
      password: 'Password',
      confirmPassword: 'Confirm Password',
    },
    submit: 'Submit Registration',
    submitting: 'Submitting...',
    success: 'Enterprise registration successful!',
    requiredNote: '* Required fields, others are optional',
  },
  teamRegister: {
    title: 'Lancang-Mekong Countries Science and Technology Innovation Competition - Team Registration',
    subtitle: 'Lancang-Mekong Countries Science and Technology Innovation Competition - Team Registration',
    projectInfo: {
      title: '1. Project Information',
      projectName: 'Project Name',
      coreMembersNationality: 'Core Members Nationality',
      projectBrief: 'Project Brief',
      projectStage: 'Project Stage',
      stages: {
        development: 'R&D',
        labTest: 'Laboratory test',
        trialProduction: 'Pilot test',
        growth: 'Growth',
        others: 'Others',
      },
      nationalityOptions: {
        single: 'Single Country',
        multiple: 'Multiple Countries',
      },
      countries: {
        china: 'China',
        thailand: 'Thailand',
        cambodia: 'Cambodia',
        vietnam: 'Vietnam',
        laos: 'Laos',
        myanmar: 'Myanmar',
        others: 'Others',
      },
    },
    contactInfo: {
      title: '2. Project Contact Person',
      contactPersonName: 'Name',
      contactPersonPosition: 'Position',
      contactPersonPhone: 'Phone',
      contactPersonEmail: 'Email (This will be your login account)',
    },
    coreMembers: {
      title: '3. Core Team Members (Minimum 3 and no more than 6 members)',
      addMember: 'Add Member',
      remove: 'Remove',
      member: 'Member',
      name: 'Name',
      nationality: 'Nationality',
      gender: 'Gender',
      birthDate: 'Birth Date',
      idType: 'ID Type',
      idNumber: 'ID Number',
      idPhoto: 'ID Photo',
      phone: 'Phone',
      email: 'Email',
      university: 'University',
      highestDegree: 'Highest Degree',
      organization: 'Organization',
      position: 'Position',
      cv: 'CV (Optional)',
      idTypes: {
        idCard: 'ID Card',
        passport: 'Passport',
      },
      idTypeInstructions: 'Please select: ID Card for Chinese participants, Passport for foreign participants',
      degrees: {
        bachelor: 'Bachelor',
        master: 'Master',
        doctor: 'Doctor',
        other: 'Other',
      },
    },
    documents: {
      title: '4. Required Materials',
      commitmentLetter: 'Commitment Letter',
      technicalInfoChinese: 'Technical Feasibility Analysis (Chinese Version)',
      technicalInfoEnglish: 'Technical Feasibility Analysis (English Version)',
      presentation: 'Presentation',
      supplementaryMaterials: 'Supplementary Materials',
    },
    images: {
      title: 'Team Images',
      description: 'Upload up to 5 team-related images (PNG/JPG format, max 10MB each)',
      image: 'Image',
    },
    password: {
      title: '5. Login Password',
      password: 'Password',
      confirmPassword: 'Confirm Password',
    },
    submit: 'Submit Registration',
    submitting: 'Submitting...',
    success: 'Team registration successful!',
    requiredNote: '* Required fields, others are optional',
  },
  login: {
    team: {
      title: 'Team Login',
      email: 'Email',
      password: 'Password',
      loginButton: 'Login',
      noAccount: 'No team account yet?',
      registerLink: 'Register Now',
      backToPortal: '← Back to System Portal',
    },
    expert: {
      title: 'Expert Login',
      username: 'Username',
      password: 'Password',
      loginButton: 'Login',
      backToPortal: '← Back to System Portal',
    },
    admin: {
      title: 'Admin Login',
      email: 'Email',
      password: 'Password',
      loginButton: 'Login',
      backToPortal: '← Back to System Portal',
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
    registrationFailed: 'Registration failed',
  },
};

// 翻译映射
const translations: Record<Language, Translations> = {
  zh: zhTranslations,
  en: enTranslations,
};

// 语言切换Hook
export function useLanguage() {
  const [language, setLanguage] = useState<Language>('zh');
  const [forceUpdate, setForceUpdate] = useState(0);
  
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
    // 强制触发组件重新渲染
    setForceUpdate(prev => prev + 1);
  };
  
  const t = (key: string) => {
    // 使用forceUpdate确保语言切换时重新计算
    const currentLanguage = language;
    const keys = key.split('.');
    let value: any = translations[currentLanguage];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  };
  
  return { language, changeLanguage, t, forceUpdate };
}

// 导出翻译对象
export { zhTranslations, enTranslations };
