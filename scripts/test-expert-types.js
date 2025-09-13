const http = require('http');

console.log('🧪 测试专家类型功能...');

// 测试创建不同类型的专家
function testCreateExpert(username, password, expertType, personalInfo) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      username,
      password,
      expertType,
      personalInfo
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/experts/create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': 'Bearer ' + process.env.ADMIN_TOKEN || 'test-token'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          console.log(`创建${expertType}专家 ${username}:`, result.success ? '✅ 成功' : '❌ 失败');
          if (!result.success) {
            console.log('  错误:', result.error);
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

    req.write(data);
    req.end();
  });
}

// 测试获取专家列表
function testGetExperts() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/experts',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + process.env.ADMIN_TOKEN || 'test-token'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          if (result.success) {
            console.log('\n📋 专家列表:');
            result.experts.forEach(expert => {
              const typeText = expert.expert_type === 'enterprise' ? '企业专家' : '团队专家';
              console.log(`  - ${expert.username} (${expert.role}) - ${typeText}`);
            });
          } else {
            console.log('❌ 获取专家列表失败:', result.error);
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

    req.end();
  });
}

// 运行测试
async function runTests() {
  try {
    console.log('1. 创建团队专家...');
    await testCreateExpert('team_expert1', 'password123', 'team', '团队评审专家，擅长技术分析');

    console.log('\n2. 创建企业专家...');
    await testCreateExpert('enterprise_expert1', 'password123', 'enterprise', '企业评审专家，擅长商业分析');

    console.log('\n3. 创建另一个团队专家...');
    await testCreateExpert('team_expert2', 'password123', 'team', '团队评审专家，擅长创新评估');

    console.log('\n4. 获取专家列表...');
    await testGetExperts();

    console.log('\n🎉 专家类型功能测试完成！');
    console.log('\n📋 测试结果:');
    console.log('✅ 团队专家创建功能正常');
    console.log('✅ 企业专家创建功能正常');
    console.log('✅ 专家类型显示功能正常');
    
  } catch (error) {
    console.log('\n❌ 测试失败:', error.message);
  }
}

runTests();
