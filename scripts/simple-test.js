const fs = require('fs');
const path = require('path');
const http = require('http');

// 简化的测试脚本，不依赖外部包
async function simpleTest() {
  console.log('🧪 开始简单功能测试...');
  
  try {
    // 1. 测试API健康检查
    console.log('📡 测试API健康检查...');
    const healthResponse = await fetch('http://localhost:3000/api/init', {
      method: 'POST'
    });
    
    if (healthResponse.ok) {
      console.log('✅ API健康检查通过');
    } else {
      console.log('❌ API健康检查失败');
    }
    
    // 2. 测试管理员登录
    console.log('🔐 测试管理员登录...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
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
    
    if (loginResponse.ok) {
      console.log('✅ 管理员登录成功');
      console.log('Token:', loginResult.token ? '已获取' : '未获取');
    } else {
      console.log('❌ 管理员登录失败:', loginResult);
    }
    
    // 3. 测试团队列表获取
    if (loginResponse.ok && loginResult.token) {
      console.log('📋 测试团队列表获取...');
      const teamsResponse = await fetch('http://localhost:3000/api/admin/teams', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${loginResult.token}`
        }
      });
      
      const teamsResult = await teamsResponse.json();
      
      if (teamsResponse.ok) {
        console.log('✅ 团队列表获取成功');
        console.log('团队数量:', Array.isArray(teamsResult) ? teamsResult.length : '未知');
      } else {
        console.log('❌ 团队列表获取失败:', teamsResult);
      }
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
simpleTest();
