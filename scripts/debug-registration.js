const fs = require('fs');
const path = require('path');

// 调试团队注册问题
async function debugRegistration() {
  console.log('🔍 开始调试团队注册问题...');
  
  try {
    // 1. 检查数据库文件
    console.log('📁 检查数据库文件...');
    const dbPath = path.join(process.cwd(), 'expert_review.db');
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      console.log(`✅ 数据库文件存在: ${dbPath}`);
      console.log(`📊 文件大小: ${stats.size} bytes`);
    } else {
      console.log('❌ 数据库文件不存在');
      return;
    }
    
    // 2. 测试API初始化
    console.log('🔧 测试API初始化...');
    const initResponse = await fetch('http://localhost:3000/api/init', {
      method: 'POST'
    });
    
    if (initResponse.ok) {
      console.log('✅ API初始化成功');
    } else {
      console.log('❌ API初始化失败');
      const initResult = await initResponse.text();
      console.log('错误信息:', initResult);
    }
    
    // 3. 测试简单的团队注册
    console.log('📝 测试简单团队注册...');
    const registrationData = {
      basicInfo: {
        projectName: "测试项目",
        coreMembersNationality: "china",
        nationalityType: "single",
        selectedCountries: [],
        nationalityOthers: "",
        projectBrief: "测试项目简介",
        projectStage: "研发阶段",
        projectStageOthers: "",
        password: "test123",
        confirmPassword: "test123"
      },
      contactInfo: {
        contactPersonName: "测试联系人",
        contactPersonPosition: "项目经理",
        contactPersonPhone: "13800138000",
        contactPersonEmail: "test@example.com"
      },
      coreMembers: [
        {
          name: "测试成员",
          nationality: "china",
          gender: "male",
          birthDate: "1990-01-01",
          idType: "id_card",
          idNumber: "123456789012345678",
          phone: "13800138000",
          email: "test@example.com",
          university: "测试大学",
          highestDegree: "本科",
          organization: "测试公司",
          position: "工程师"
        }
      ],
      teamType: "team"
    };
    
    const registerResponse = await fetch('http://localhost:3000/api/teams/register-team', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(registrationData)
    });
    
    const registerResult = await registerResponse.json();
    
    if (registerResponse.ok) {
      console.log('✅ 团队注册成功');
      console.log('注册结果:', registerResult);
    } else {
      console.log('❌ 团队注册失败');
      console.log('错误信息:', registerResult);
      console.log('状态码:', registerResponse.status);
    }
    
    // 4. 检查数据库中的团队数据
    console.log('📊 检查数据库中的团队数据...');
    const teamsResponse = await fetch('http://localhost:3000/api/admin/teams', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token' // 这里可能需要有效的token
      }
    });
    
    if (teamsResponse.ok) {
      const teamsResult = await teamsResponse.json();
      console.log('✅ 获取团队列表成功');
      console.log('团队数量:', Array.isArray(teamsResult) ? teamsResult.length : '未知');
    } else {
      console.log('❌ 获取团队列表失败');
      console.log('状态码:', teamsResponse.status);
    }
    
  } catch (error) {
    console.error('❌ 调试过程中出错:', error.message);
    console.error('错误堆栈:', error.stack);
  }
}

// 运行调试
debugRegistration();
