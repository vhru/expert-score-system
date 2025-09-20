// 系统路径配置
export const PATHS_CONFIG = {
  // 基础路径
  UPLOAD_BASE_DIR: process.env.UPLOAD_DIR || '/opt/team_data',
  
  // 团队数据路径
  TEAM_DATA_DIR: 'team_data',
  
  // 子目录
  SUBDIRS: {
    DOCUMENTS: 'documents',
    IMAGES: 'images',
    PHOTOS: 'photos',
    MEMBER_CVS: 'member-cvs',
    TEAM_IMAGES: 'team-images'
  },
  
  // 文件类型映射
  DOCUMENT_TYPES: {
    'commitmentLetter': '承诺书',
    'presentation': '项目展示',
    'supplementaryMaterials': '补充材料',
    'technicalInfo': '技术信息',
    'businessLicense': '营业执照',
    'businessPlan': '商业计划书',
    'businessPlanChinese': '商业计划书(中文)',
    'businessPlanEnglish': '商业计划书(英文)'
  }
};

// 路径构建工具函数
export class PathBuilder {
  static getTeamDir(teamName: string, contactEmail: string, teamType: 'team' | 'enterprise'): string {
    const safeTeamName = teamName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
    const safeContactEmail = contactEmail.replace(/[^a-zA-Z0-9@.-]/g, '_');
    return `${safeTeamName}_${safeContactEmail}_${teamType}`;
  }
  
  static getTeamDataPath(teamName: string, contactEmail: string, teamType: 'team' | 'enterprise'): string {
    const teamDir = this.getTeamDir(teamName, contactEmail, teamType);
    return `${PATHS_CONFIG.UPLOAD_BASE_DIR}/${PATHS_CONFIG.TEAM_DATA_DIR}/${teamDir}`;
  }
  
  static getDocumentsPath(teamName: string, contactEmail: string, teamType: 'team' | 'enterprise'): string {
    const teamDataPath = this.getTeamDataPath(teamName, contactEmail, teamType);
    return `${teamDataPath}/${PATHS_CONFIG.SUBDIRS.DOCUMENTS}`;
  }
  
  static getImagesPath(teamName: string, contactEmail: string, teamType: 'team' | 'enterprise'): string {
    const teamDataPath = this.getTeamDataPath(teamName, contactEmail, teamType);
    return `${teamDataPath}/${PATHS_CONFIG.SUBDIRS.IMAGES}`;
  }
  
  static getRelativePath(absolutePath: string): string {
    const baseDir = PATHS_CONFIG.UPLOAD_BASE_DIR;
    if (absolutePath.startsWith(baseDir)) {
      return absolutePath.substring(baseDir.length + 1);
    }
    return absolutePath;
  }
  
  static getAbsolutePath(relativePath: string): string {
    if (relativePath.startsWith('/')) {
      return relativePath;
    }
    return `${PATHS_CONFIG.UPLOAD_BASE_DIR}/${relativePath}`;
  }
}

// 文件命名工具
export class FileNaming {
  static generateDocumentFileName(teamId: number, emailPrefix: string, docType: string, originalName: string): string {
    const extension = originalName.split('.').pop() || '';
    return `${teamId}_${emailPrefix}_${docType}_${Date.now()}.${extension}`;
  }
  
  static generateImageFileName(teamId: number, index: number, originalName: string): string {
    const extension = originalName.split('.').pop() || '';
    return `${teamId}_${Date.now()}_${index}.${extension}`;
  }
  
  static generateZipFileName(teamName: string, contactEmail: string, teamType: string): string {
    const safeTeamName = teamName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
    const emailPrefix = contactEmail.split('@')[0];
    return `${safeTeamName}_${emailPrefix}_${teamType}.zip`;
  }
}
