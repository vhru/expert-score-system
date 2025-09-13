const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/team-register-new/page.tsx');

// 读取文件内容
let content = fs.readFileSync(filePath, 'utf8');

// 定义翻译映射
const translations = {
  // 项目信息部分
  '团队组报名': 't(\'teamRegister.title\')',
  'Team Registration': 't(\'teamRegister.subtitle\')',
  '1. 参赛项目信息 / Project Information': 't(\'teamRegister.projectInfo.title\')',
  '项目名称 * / Project Name *': 't(\'teamRegister.projectInfo.projectName\') + " *"',
  '核心成员国籍 * / Core Members Nationality *': 't(\'teamRegister.projectInfo.coreMembersNationality\') + " *"',
  '单一国家 / Single Country': 't(\'teamRegister.projectInfo.nationalityOptions.single\')',
  '多国 / Multiple Countries': 't(\'teamRegister.projectInfo.nationalityOptions.multiple\')',
  '项目简介 * / Project Brief * (500字以内)': 't(\'teamRegister.projectInfo.projectBrief\') + " * (500字以内)"',
  '项目阶段 * / Project Stage *': 't(\'teamRegister.projectInfo.projectStage\') + " *"',
  '研发阶段': 't(\'teamRegister.projectInfo.stages.development\')',
  '实验室测试': 't(\'teamRegister.projectInfo.stages.labTest\')',
  '试生产': 't(\'teamRegister.projectInfo.stages.trialProduction\')',
  '成长阶段': 't(\'teamRegister.projectInfo.stages.growth\')',
  
  // 联系人信息部分
  '2. 项目联系人 / Project Contact Person': 't(\'teamRegister.contactInfo.title\')',
  '姓名 * / Name *': 't(\'teamRegister.contactInfo.contactPersonName\') + " *"',
  '职务 * / Position *': 't(\'teamRegister.contactInfo.contactPersonPosition\') + " *"',
  '电话 * / Phone *': 't(\'teamRegister.contactInfo.contactPersonPhone\') + " *"',
  '邮箱 * / Email *': 't(\'teamRegister.contactInfo.contactPersonEmail\') + " *"',
  
  // 核心成员部分
  '3. 核心成员信息 / Core Team Members (至少3人，不超过6人)': 't(\'teamRegister.coreMembers.title\') + " (至少3人，不超过6人)"',
  '添加成员': 't(\'teamRegister.coreMembers.addMember\')',
  '成员 {index + 1} / Member {index + 1}': 't(\'teamRegister.coreMembers.member\') + " {index + 1}"',
  '删除': 't(\'teamRegister.coreMembers.remove\')',
  '姓名 *': 't(\'teamRegister.coreMembers.name\') + " *"',
  '国籍': 't(\'teamRegister.coreMembers.nationality\')',
  '性别': 't(\'teamRegister.coreMembers.gender\')',
  '出生年月': 't(\'teamRegister.coreMembers.birthDate\')',
  '证件类型 *': 't(\'teamRegister.coreMembers.idType\') + " *"',
  '国内身份证': 't(\'teamRegister.coreMembers.idTypes.idCard\')',
  '外籍护照': 't(\'teamRegister.coreMembers.idTypes.passport\')',
  '证件号码 *': 't(\'teamRegister.coreMembers.idNumber\') + " *"',
  '证件照 *': 't(\'teamRegister.coreMembers.idPhoto\') + " *"',
  '电话': 't(\'teamRegister.coreMembers.phone\')',
  '电子邮箱 *': 't(\'teamRegister.coreMembers.email\') + " *"',
  '毕业院校': 't(\'teamRegister.coreMembers.university\')',
  '最高学历': 't(\'teamRegister.coreMembers.highestDegree\')',
  '本科': 't(\'teamRegister.coreMembers.degrees.bachelor\')',
  '硕士': 't(\'teamRegister.coreMembers.degrees.master\')',
  '博士': 't(\'teamRegister.coreMembers.degrees.doctor\')',
  '其他': 't(\'teamRegister.coreMembers.degrees.other\')',
  '所在单位': 't(\'teamRegister.coreMembers.organization\')',
  '职务/职称': 't(\'teamRegister.coreMembers.position\')',
  '简历 (选填)': 't(\'teamRegister.coreMembers.cv\') + " (选填)"',
  
  // 文档上传部分
  '4. 需附材料清单 / Required Materials (全部为PDF格式)': 't(\'teamRegister.documents.title\') + " (全部为PDF格式)"',
  '参赛承诺书 * / Commitment Letter *': 't(\'teamRegister.documents.commitmentLetter\') + " *"',
  '项目技术可行性分析（中文版）* / Technical Feasibility Analysis (Chinese Version) *': 't(\'teamRegister.documents.technicalInfoChinese\') + " *"',
  '项目技术可行性分析（英文版）* / Technical Feasibility Analysis (English Version) *': 't(\'teamRegister.documents.technicalInfoEnglish\') + " *"',
  '演示文稿 * / Presentation *': 't(\'teamRegister.documents.presentation\') + " *"',
  '其他补充材料 / Supplementary Materials': 't(\'teamRegister.documents.supplementaryMaterials\')',
  
  // 密码部分
  '5. 登录密码 / Login Password': 't(\'teamRegister.password.title\')',
  '密码 * / Password *': 't(\'teamRegister.password.password\') + " *"',
  '确认密码 * / Confirm Password *': 't(\'teamRegister.password.confirmPassword\') + " *"',
  
  // 按钮
  '取消': 't(\'common.cancel\')',
  '提交中...': 't(\'teamRegister.submitting\')',
  '提交报名': 't(\'teamRegister.submit\')',
  '团队注册成功！': 't(\'teamRegister.success\')',
};

// 应用翻译
for (const [chinese, translation] of Object.entries(translations)) {
  const regex = new RegExp(chinese.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  content = content.replace(regex, `{${translation}}`);
}

// 写回文件
fs.writeFileSync(filePath, content, 'utf8');

console.log('团队注册页面翻译更新完成！');
