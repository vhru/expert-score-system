const fetch = require('node-fetch');

// 测试专家管理功能
async function testExpertManagement() {
  const baseURL = 'http://localhost:3000'; // 本地测试
  // const baseURL = 'http://YOUR_SERVER_IP:3000'; // 服务器测试
  
  console.log('🧪 开始测试专家管理功能...');
  
  try {
    // 1. 管理员登录
    console.log('🔐 管理员登录...');
    const loginResponse = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin@example.com',
        password: 'admin123'
      })
    });
    
    const loginResult = await loginResponse.json();
    
    if (!loginResponse.ok) {
      console.error('❌ 管理员登录失败:', loginResult);
      return;
    }
    
    const token = loginResult.token;
    console.log('✅ 管理员登录成功');
    
    // 2. 创建专家
    console.log('👨‍💼 创建专家...');
    const createExpertResponse = await fetch(`${baseURL}/api/admin/experts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        username: 'expert_test',
        password: 'expert123',
        role: 'expert',
        expertType: 'team'
      })
    });
    
    const createExpertResult = await createExpertResponse.json();
    
    if (createExpertResponse.ok) {
      console.log('✅ 专家创建成功:', createExpertResult);
    } else {
      console.log('⚠️  专家创建失败（可能已存在）:', createExpertResult);
    }
    
    // 3. 获取专家列表
    console.log('📋 获取专家列表...');
    const expertsResponse = await fetch(`${baseURL}/api/admin/experts`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const expertsResult = await expertsResponse.json();
    
    if (expertsResponse.ok) {
      console.log('✅ 专家列表获取成功:', expertsResult);
    } else {
      console.error('❌ 专家列表获取失败:', expertsResult);
    }
    
    // 4. 测试专家登录
    console.log('🔐 测试专家登录...');
    const expertLoginResponse = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'expert_test',
        password: 'expert123'
      })
    });
    
    const expertLoginResult = await expertLoginResponse.json();
    
    if (expertLoginResponse.ok) {
      console.log('✅ 专家登录成功:', expertLoginResult);
    } else {
      console.error('❌ 专家登录失败:', expertLoginResult);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
testExpertManagement();
