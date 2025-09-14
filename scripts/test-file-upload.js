const fs = require('fs');
const path = require('path');

// 使用Node.js内置的fetch和FormData
const { FormData } = require('form-data');

// 测试文件上传功能
async function testFileUpload() {
  const baseURL = 'http://localhost:3000'; // 本地测试
  // const baseURL = 'http://YOUR_SERVER_IP:3000'; // 服务器测试
  
  console.log('🧪 开始测试文件上传功能...');
  
  try {
    // 1. 测试团队注册（包含文件上传）
    const formData = new FormData();
    
    // 基本信息
    formData.append('basicInfo', JSON.stringify({
      projectName: '测试项目',
      coreMembersNationality: 'china',
      nationalityType: 'single',
      selectedCountries: [],
      nationalityOthers: '',
      projectBrief: '这是一个测试项目',
      projectStage: '研发阶段',
      projectStageOthers: '',
      password: 'test123456',
      confirmPassword: 'test123456'
    }));
    
    // 联系人信息
    formData.append('contactInfo', JSON.stringify({
      contactPersonName: '测试联系人',
      contactPersonPosition: '项目经理',
      contactPersonPhone: '13800138000',
      contactPersonEmail: 'test@example.com'
    }));
    
    // 核心成员信息
    formData.append('coreMembers', JSON.stringify([
      {
        name: '成员1',
        nationality: 'china',
        gender: 'male',
        birthDate: '1990-01-01',
        idType: 'id_card',
        idNumber: '110101199001011234',
        phone: '13800138001',
        email: 'member1@example.com',
        university: '测试大学',
        highestDegree: '本科',
        organization: '测试公司',
        position: '开发工程师'
      }
    ]));
    
    formData.append('teamType', 'team');
    
    // 创建测试PDF文件
    const testPdfPath = path.join(__dirname, 'test-document.pdf');
    if (!fs.existsSync(testPdfPath)) {
      // 创建一个简单的测试文件
      fs.writeFileSync(testPdfPath, 'Test PDF Content');
    }
    
    // 添加文件
    formData.append('commitmentLetter', fs.createReadStream(testPdfPath));
    formData.append('technicalInfoChinese', fs.createReadStream(testPdfPath));
    formData.append('technicalInfoEnglish', fs.createReadStream(testPdfPath));
    formData.append('presentation', fs.createReadStream(testPdfPath));
    formData.append('supplementaryMaterials', fs.createReadStream(testPdfPath));
    
    console.log('📤 发送团队注册请求...');
    
    const response = await fetch(`${baseURL}/api/teams/register-team`, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ 团队注册成功:', result);
      
      // 2. 测试文件下载
      console.log('📥 测试文件下载...');
      
      // 这里需要管理员token，先跳过
      console.log('⚠️  文件下载测试需要管理员权限，请手动测试');
      
    } else {
      console.error('❌ 团队注册失败:', result);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
testFileUpload();
