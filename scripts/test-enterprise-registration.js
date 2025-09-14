// 测试企业注册功能
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testEnterpriseRegistration() {
  console.log('=== 企业注册功能测试 ===');
  
  // 替换为你的线上域名
  const baseURL = 'https://yourdomain.com'; // 请替换为实际域名
  
  try {
    // 创建测试数据
    const basicInfo = {
      projectName: "测试项目",
      registrationCountry: "china",
      projectBrief: "这是一个测试项目",
      projectStage: "研发阶段",
      projectStageOthers: "",
      password: "test123456",
      confirmPassword: "test123456"
    };

    const enterpriseInfo = {
      enterpriseName: "测试企业",
      unifiedSocialCreditCode: "91110000123456789X",
      registrationYear: "2020",
      legalRepresentative: "张三",
      headquartersLocation: "北京市",
      registeredCapitalUsd: "1000000",
      phone: "010-12345678",
      website: "https://test.com",
      enterpriseOverview: "测试企业概述"
    };

    const contactInfo = {
      contactPersonName: "李四",
      contactPersonPosition: "项目经理",
      contactPersonPhone: "13800138000",
      contactPersonEmail: `test${Date.now()}@example.com` // 使用时间戳避免重复
    };

    const coreMembers = [
      {
        name: "成员1",
        nationality: "中国",
        gender: "男",
        birthDate: "1990-01-01",
        idType: "id_card",
        idNumber: "110101199001011234",
        phone: "13800138001",
        email: "member1@example.com",
        university: "清华大学",
        highestDegree: "硕士",
        organization: "测试公司",
        position: "工程师",
        idPhoto: {}
      },
      {
        name: "成员2",
        nationality: "中国",
        gender: "女",
        birthDate: "1992-02-02",
        idType: "id_card",
        idNumber: "110101199202022345",
        phone: "13800138002",
        email: "member2@example.com",
        university: "北京大学",
        highestDegree: "博士",
        organization: "测试公司",
        position: "高级工程师",
        idPhoto: {}
      },
      {
        name: "成员3",
        nationality: "中国",
        gender: "男",
        birthDate: "1988-03-03",
        idType: "id_card",
        idNumber: "110101198803033456",
        phone: "13800138003",
        email: "member3@example.com",
        university: "中科院",
        highestDegree: "博士",
        organization: "测试公司",
        position: "技术总监",
        idPhoto: {}
      }
    ];

    // 创建测试PDF文件
    const testPdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n174\n%%EOF');
    const testPdfPath = path.join(__dirname, 'test.pdf');
    fs.writeFileSync(testPdfPath, testPdfContent);

    // 创建FormData
    const formData = new FormData();
    formData.append('basicInfo', JSON.stringify(basicInfo));
    formData.append('enterpriseInfo', JSON.stringify(enterpriseInfo));
    formData.append('contactInfo', JSON.stringify(contactInfo));
    formData.append('coreMembers', JSON.stringify(coreMembers));
    formData.append('teamType', 'enterprise');
    
    // 添加测试文件
    formData.append('businessLicense', fs.createReadStream(testPdfPath), {
      filename: 'business_license.pdf',
      contentType: 'application/pdf'
    });
    formData.append('commitmentLetter', fs.createReadStream(testPdfPath), {
      filename: 'commitment_letter.pdf',
      contentType: 'application/pdf'
    });
    formData.append('businessPlanChinese', fs.createReadStream(testPdfPath), {
      filename: 'business_plan_cn.pdf',
      contentType: 'application/pdf'
    });
    formData.append('businessPlanEnglish', fs.createReadStream(testPdfPath), {
      filename: 'business_plan_en.pdf',
      contentType: 'application/pdf'
    });
    formData.append('presentation', fs.createReadStream(testPdfPath), {
      filename: 'presentation.pdf',
      contentType: 'application/pdf'
    });
    formData.append('supplementaryMaterials', fs.createReadStream(testPdfPath), {
      filename: 'supplementary.pdf',
      contentType: 'application/pdf'
    });

    console.log('发送企业注册请求...');
    const response = await fetch(`${baseURL}/api/teams/register-enterprise`, {
      method: 'POST',
      body: formData
    });

    const responseData = await response.json();
    
    if (response.ok) {
      console.log('✅ 企业注册成功:', responseData);
    } else {
      console.log('❌ 企业注册失败:', responseData);
      console.log('响应状态:', response.status);
    }

    // 清理测试文件
    fs.unlinkSync(testPdfPath);

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testEnterpriseRegistration();
}

module.exports = { testEnterpriseRegistration };
