// 测试线上管理员登录
const fetch = require('node-fetch');

async function testAdminLoginOnline() {
  console.log('=== 测试线上管理员登录 ===');
  
  // 替换为你的实际域名
  const baseURL = 'https://yourdomain.com'; // 请替换为实际域名
  
  try {
    console.log('1. 测试管理员登录API...');
    const response = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin@example.com',
        password: 'admin123'
      })
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ 管理员登录成功!');
      console.log('Token:', data.token.substring(0, 20) + '...');
      console.log('用户信息:', data.user);
      return data.token;
    } else {
      console.log('❌ 管理员登录失败:', data);
      return null;
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    return null;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testAdminLoginOnline();
}

module.exports = { testAdminLoginOnline };
