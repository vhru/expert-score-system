const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/enterprise-register/page.tsx');

// 读取文件内容
let content = fs.readFileSync(filePath, 'utf8');

// 定义翻译映射
const translations = {
  // 项目信息部分
  '企业注册国家 * / Registration Country *': 't(\'enterpriseRegister.projectInfo.registrationCountry\') + " *"',
  '项目简介 * / Project Brief * (500字以内)': 't(\'enterpriseRegister.projectInfo.projectBrief\') + " * (500字以内)"',
  '项目阶段 * / Project Stage *': 't(\'enterpriseRegister.projectInfo.projectStage\') + " *"',
  '研发阶段': 't(\'enterpriseRegister.projectInfo.stages.development\')',
  '实验室测试': 't(\'enterpriseRegister.projectInfo.stages.labTest\')',
  '试生产': 't(\'enterpriseRegister.projectInfo.stages.trialProduction\')',
  '批量生产及市场开发': 't(\'enterpriseRegister.projectInfo.stages.batchProduction\')',
  '成长阶段': 't(\'enterpriseRegister.projectInfo.stages.growth\')',
  
  // 企业信息部分
  '2. 企业信息 / Enterprise Information': 't(\'enterpriseRegister.enterpriseInfo.title\')',
  '企业名称 * / Enterprise Name *': 't(\'enterpriseRegister.enterpriseInfo.enterpriseName\') + " *"',
  '统一社会信用代码 * / Unified Social Credit Code *': 't(\'enterpriseRegister.enterpriseInfo.unifiedSocialCreditCode\') + " *"',
  '注册年份 * / Registration Year * (2019年后)': 't(\'enterpriseRegister.enterpriseInfo.registrationYear\') + " * (2019年后)"',
  '企业法定代表人 * / Legal Representative *': 't(\'enterpriseRegister.enterpriseInfo.legalRepresentative\') + " *"',
  '总部所在地 * / Headquarters Location *': 't(\'enterpriseRegister.enterpriseInfo.headquartersLocation\') + " *"',
  '注册资本 * / Registered Capital * (不超过450万美元)': 't(\'enterpriseRegister.enterpriseInfo.registeredCapital\') + " * (不超过450万美元)"',
  '电话 * / Phone *': 't(\'enterpriseRegister.enterpriseInfo.phone\') + " *"',
  '网站 / Website': 't(\'enterpriseRegister.enterpriseInfo.website\')',
  '企业简介 / Enterprise Overview (500字以内)': 't(\'enterpriseRegister.enterpriseInfo.enterpriseOverview\') + " (500字以内)"',
  
  // 联系人信息部分
  '3. 项目联系人 / Project Contact Person': 't(\'enterpriseRegister.contactInfo.title\')',
  '姓名 * / Name *': 't(\'enterpriseRegister.contactInfo.contactPersonName\') + " *"',
  '职务 * / Position *': 't(\'enterpriseRegister.contactInfo.contactPersonPosition\') + " *"',
  '电话 * / Phone *': 't(\'enterpriseRegister.contactInfo.contactPersonPhone\') + " *"',
  '邮箱 * / Email *': 't(\'enterpriseRegister.contactInfo.contactPersonEmail\') + " *"',
  
  // 核心成员部分
  '4. 核心成员信息 / Core Team Members (至少3人，不超过6人)': 't(\'enterpriseRegister.coreMembers.title\') + " (至少3人，不超过6人)"',
  '添加成员': 't(\'enterpriseRegister.coreMembers.addMember\')',
  '成员 {index + 1} / Member {index + 1}': 't(\'enterpriseRegister.coreMembers.member\') + " {index + 1}"',
  '删除': 't(\'enterpriseRegister.coreMembers.remove\')',
  '姓名 *': 't(\'enterpriseRegister.coreMembers.name\') + " *"',
  '国籍': 't(\'enterpriseRegister.coreMembers.nationality\')',
  '性别': 't(\'enterpriseRegister.coreMembers.gender\')',
  '出生年月': 't(\'enterpriseRegister.coreMembers.birthDate\')',
  '证件类型 *': 't(\'enterpriseRegister.coreMembers.idType\') + " *"',
  '国内身份证': 't(\'enterpriseRegister.coreMembers.idTypes.idCard\')',
  '外籍护照': 't(\'enterpriseRegister.coreMembers.idTypes.passport\')',
  '证件号码 *': 't(\'enterpriseRegister.coreMembers.idNumber\') + " *"',
  '证件照 *': 't(\'enterpriseRegister.coreMembers.idPhoto\') + " *"',
  '电话': 't(\'enterpriseRegister.coreMembers.phone\')',
  '电子邮箱 *': 't(\'enterpriseRegister.coreMembers.email\') + " *"',
  '毕业院校': 't(\'enterpriseRegister.coreMembers.university\')',
  '最高学历': 't(\'enterpriseRegister.coreMembers.highestDegree\')',
  '本科': 't(\'enterpriseRegister.coreMembers.degrees.bachelor\')',
  '硕士': 't(\'enterpriseRegister.coreMembers.degrees.master\')',
  '博士': 't(\'enterpriseRegister.coreMembers.degrees.doctor\')',
  '其他': 't(\'enterpriseRegister.coreMembers.degrees.other\')',
  '所在单位': 't(\'enterpriseRegister.coreMembers.organization\')',
  '职务/职称': 't(\'enterpriseRegister.coreMembers.position\')',
  '简历 (选填)': 't(\'enterpriseRegister.coreMembers.cv\') + " (选填)"',
  
  // 文档上传部分
  '5. 需附材料清单 / Required Materials (全部为PDF格式)': 't(\'enterpriseRegister.documents.title\') + " (全部为PDF格式)"',
  '营业执照扫描件 * / Business License *': 't(\'enterpriseRegister.documents.businessLicense\') + " *"',
  '参赛承诺书 * / Commitment Letter *': 't(\'enterpriseRegister.documents.commitmentLetter\') + " *"',
  '商业计划书（中文版）* / Business Plan (Chinese Version) *': 't(\'enterpriseRegister.documents.businessPlanChinese\') + " *"',
  '商业计划书（英文版）* / Business Plan (English Version) *': 't(\'enterpriseRegister.documents.businessPlanEnglish\') + " *"',
  '演示文稿 * / Presentation *': 't(\'enterpriseRegister.documents.presentation\') + " *"',
  '其他补充材料 / Supplementary Materials': 't(\'enterpriseRegister.documents.supplementaryMaterials\')',
  
  // 密码部分
  '6. 登录密码 / Login Password': 't(\'enterpriseRegister.password.title\')',
  '密码 * / Password *': 't(\'enterpriseRegister.password.password\') + " *"',
  '确认密码 * / Confirm Password *': 't(\'enterpriseRegister.password.confirmPassword\') + " *"',
  
  // 按钮
  '取消': 't(\'common.cancel\')',
  '提交中...': 't(\'enterpriseRegister.submitting\')',
  '提交报名': 't(\'enterpriseRegister.submit\')',
  '企业注册成功！': 't(\'enterpriseRegister.success\')',
};

// 应用翻译
for (const [chinese, translation] of Object.entries(translations)) {
  const regex = new RegExp(chinese.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  content = content.replace(regex, `{${translation}}`);
}

// 写回文件
fs.writeFileSync(filePath, content, 'utf8');

console.log('企业注册页面翻译更新完成！');
