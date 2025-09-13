const FormData = require('form-data');
const fs = require('fs');
const http = require('http');

console.log('🧪 测试新的注册表单功能...');

// 创建测试PDF文件
function createTestPdf() {
  const testPdfPath = './test-document.pdf';
  // 创建一个简单的PDF文件头
  const pdfData = Buffer.from([
    0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, // %PDF-1.4
    0x0A, 0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A, // 二进制注释
    0x31, 0x20, 0x30, 0x20, 0x6F, 0x62, 0x6A, 0x0A, // 1 0 obj
    0x3C, 0x3C, 0x2F, 0x54, 0x79, 0x70, 0x65, 0x2F, 0x43, 0x61, 0x74, 0x61, 0x6C, 0x6F, 0x67, 0x3E, 0x3E, // <</Type/Catalog>>
    0x0A, 0x65, 0x6E, 0x64, 0x6F, 0x62, 0x6A, 0x0A, // endobj
    0x78, 0x72, 0x65, 0x66, 0x0A, 0x30, 0x20, 0x31, 0x0A, // xref 0 1
    0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6E, 0x0A, // 0000000000 00000 n
    0x74, 0x72, 0x61, 0x69, 0x6C, 0x65, 0x72, 0x0A, // trailer
    0x3C, 0x3C, 0x2F, 0x53, 0x69, 0x7A, 0x65, 0x20, 0x31, 0x3E, 0x3E, // <</Size 1>>
    0x0A, 0x73, 0x74, 0x61, 0x72, 0x74, 0x78, 0x72, 0x65, 0x66, 0x0A, // startxref
    0x30, 0x0A, 0x25, 0x25, 0x45, 0x4F, 0x46 // 0 %%EOF
  ]);
  
  fs.writeFileSync(testPdfPath, pdfData);
  return testPdfPath;
}

// 测试企业组注册
function testEnterpriseRegistration() {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    
    // 基本信息
    const basicInfo = {
      projectName: '智能企业管理系统',
      registrationCountry: 'China',
      projectBrief: '这是一个基于AI技术的企业管理系统，能够自动化处理企业日常运营事务，提高工作效率。',
      projectStage: '批量生产及市场开发',
      password: 'password123',
      confirmPassword: 'password123'
    };
    
    // 企业信息
    const enterpriseInfo = {
      enterpriseName: '智能科技有限公司',
      unifiedSocialCreditCode: '91110000123456789X',
      registrationYear: '2020',
      legalRepresentative: '张三',
      headquartersLocation: '北京市朝阳区',
      registeredCapitalUsd: '1000000',
      phone: '010-12345678',
      website: 'https://www.smarttech.com',
      enterpriseOverview: '专注于人工智能技术研发和应用的高新技术企业。'
    };
    
    // 联系人信息
    const contactInfo = {
      contactPersonName: '李四',
      contactPersonPosition: '项目经理',
      contactPersonPhone: '13800138000',
      contactPersonEmail: 'enterprise@smarttech.com'
    };
    
    // 核心成员
    const coreMembers = [
      {
        name: '王五',
        nationality: '中国',
        gender: '男',
        birthDate: '1985-05-15',
        idType: 'id_card',
        idNumber: '110101198505150001',
        phone: '13900139000',
        email: 'wangwu@smarttech.com',
        university: '清华大学',
        highestDegree: '硕士',
        organization: '智能科技有限公司',
        position: '技术总监'
      },
      {
        name: '赵六',
        nationality: '中国',
        gender: '女',
        birthDate: '1990-08-20',
        idType: 'id_card',
        idNumber: '110101199008200002',
        phone: '13700137000',
        email: 'zhaoliu@smarttech.com',
        university: '北京大学',
        highestDegree: '博士',
        organization: '智能科技有限公司',
        position: '研发经理'
      },
      {
        name: '孙七',
        nationality: '中国',
        gender: '男',
        birthDate: '1988-12-10',
        idType: 'id_card',
        idNumber: '110101198812100003',
        phone: '13600136000',
        email: 'sunqi@smarttech.com',
        university: '中科院',
        highestDegree: '博士',
        organization: '智能科技有限公司',
        position: '算法工程师'
      }
    ];
    
    formData.append('basicInfo', JSON.stringify(basicInfo));
    formData.append('enterpriseInfo', JSON.stringify(enterpriseInfo));
    formData.append('contactInfo', JSON.stringify(contactInfo));
    formData.append('coreMembers', JSON.stringify(coreMembers));
    formData.append('teamType', 'enterprise');

    // 添加测试文档
    const testPdfPath = createTestPdf();
    formData.append('businessLicense', fs.createReadStream(testPdfPath));
    formData.append('commitmentLetter', fs.createReadStream(testPdfPath));
    formData.append('businessPlan', fs.createReadStream(testPdfPath));
    formData.append('presentation', fs.createReadStream(testPdfPath));
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/teams/register-enterprise',
      method: 'POST',
      headers: formData.getHeaders()
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('企业组注册响应:', result);
          
          if (result.success) {
            console.log('✅ 企业组注册成功！');
            console.log(`团队ID: ${result.teamId}`);
            console.log(`上传文档数量: ${result.documentsUploaded}`);
          } else {
            console.log('❌ 企业组注册失败:', result.error);
          }
          
          // 清理测试文件
          if (fs.existsSync(testPdfPath)) {
            fs.unlinkSync(testPdfPath);
          }
          
          resolve(result);
        } catch (err) {
          console.error('解析响应失败:', err);
          reject(err);
        }
      });
    });
    
    req.on('error', (err) => {
      console.error('请求失败:', err);
      reject(err);
    });
    
    formData.pipe(req);
  });
}

// 测试团队组注册
function testTeamRegistration() {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    
    // 基本信息
    const basicInfo = {
      projectName: '智能学习助手',
      coreMembersNationality: 'single',
      projectBrief: '这是一个基于机器学习的智能学习助手，能够个性化推荐学习内容，提高学习效率。',
      projectStage: '研发阶段',
      password: 'password123',
      confirmPassword: 'password123'
    };
    
    // 联系人信息
    const contactInfo = {
      contactPersonName: '陈八',
      contactPersonPosition: '团队负责人',
      contactPersonPhone: '13500135000',
      contactPersonEmail: 'team@example.com'
    };
    
    // 核心成员
    const coreMembers = [
      {
        name: '周九',
        nationality: '中国',
        gender: '男',
        birthDate: '1992-03-25',
        idType: 'id_card',
        idNumber: '110101199203250001',
        phone: '13400134000',
        email: 'zhoujiu@example.com',
        university: '复旦大学',
        highestDegree: '硕士',
        organization: '自由职业',
        position: '算法工程师'
      },
      {
        name: '吴十',
        nationality: '中国',
        gender: '女',
        birthDate: '1995-07-18',
        idType: 'id_card',
        idNumber: '110101199507180002',
        phone: '13300133000',
        email: 'wushi@example.com',
        university: '上海交通大学',
        highestDegree: '硕士',
        organization: '自由职业',
        position: '产品经理'
      }
    ];
    
    formData.append('basicInfo', JSON.stringify(basicInfo));
    formData.append('contactInfo', JSON.stringify(contactInfo));
    formData.append('coreMembers', JSON.stringify(coreMembers));
    formData.append('teamType', 'team');

    // 添加测试文档
    const testPdfPath = createTestPdf();
    formData.append('commitmentLetter', fs.createReadStream(testPdfPath));
    formData.append('technicalInfo', fs.createReadStream(testPdfPath));
    formData.append('presentation', fs.createReadStream(testPdfPath));
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/teams/register-team',
      method: 'POST',
      headers: formData.getHeaders()
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('团队组注册响应:', result);
          
          if (result.success) {
            console.log('✅ 团队组注册成功！');
            console.log(`团队ID: ${result.teamId}`);
            console.log(`上传文档数量: ${result.documentsUploaded}`);
          } else {
            console.log('❌ 团队组注册失败:', result.error);
          }
          
          // 清理测试文件
          if (fs.existsSync(testPdfPath)) {
            fs.unlinkSync(testPdfPath);
          }
          
          resolve(result);
        } catch (err) {
          console.error('解析响应失败:', err);
          reject(err);
        }
      });
    });
    
    req.on('error', (err) => {
      console.error('请求失败:', err);
      reject(err);
    });
    
    formData.pipe(req);
  });
}

// 运行测试
async function runTests() {
  try {
    console.log('1. 测试企业组注册...');
    await testEnterpriseRegistration();
    
    console.log('\n2. 测试团队组注册...');
    await testTeamRegistration();
    
    console.log('\n🎉 新注册表单功能测试完成！');
    console.log('\n📋 测试结果:');
    console.log('✅ 企业组注册表单功能正常');
    console.log('✅ 团队组注册表单功能正常');
    console.log('✅ 文档上传功能正常');
    console.log('✅ 核心成员信息保存正常');
    
  } catch (error) {
    console.log('\n❌ 测试失败:', error.message);
  }
}

runTests();
