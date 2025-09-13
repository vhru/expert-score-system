const http = require('http');

console.log('🧪 测试管理员新功能...');

// 获取管理员token
function getAdminToken() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      username: 'admin@example.com',
      password: 'admin123'
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.success) {
            resolve(result.token);
          } else {
            reject(new Error('登录失败'));
          }
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

// 测试获取专家列表
function testGetExperts(token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/experts',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('专家列表响应:', result);
          
          if (result.success) {
            console.log('✅ 获取专家列表成功！');
            console.log(`专家数量: ${result.experts.length}`);
            result.experts.forEach(expert => {
              console.log(`  - ${expert.username} (${expert.role})`);
            });
            resolve(true);
          } else {
            console.log('❌ 获取专家列表失败:', result.error);
            reject(new Error(result.error));
          }
        } catch (err) {
          console.log('❌ 响应解析失败:', err.message);
          reject(err);
        }
      });
    });

    req.on('error', (err) => {
      console.log('❌ 请求失败:', err.message);
      reject(err);
    });

    req.end();
  });
}

// 测试获取团队列表
function testGetTeams(token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/teams',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('团队列表响应:', result);
          
          if (result.success) {
            console.log('✅ 获取团队列表成功！');
            console.log(`团队数量: ${result.teams.length}`);
            result.teams.forEach(team => {
              console.log(`  - ${team.team_name || team.original_name} (${team.upload_status})`);
            });
            resolve(true);
          } else {
            console.log('❌ 获取团队列表失败:', result.error);
            reject(new Error(result.error));
          }
        } catch (err) {
          console.log('❌ 响应解析失败:', err.message);
          reject(err);
        }
      });
    });

    req.on('error', (err) => {
      console.log('❌ 请求失败:', err.message);
      reject(err);
    });

    req.end();
  });
}

// 运行测试
async function runTests() {
  try {
    console.log('1. 获取管理员token...');
    const token = await getAdminToken();
    console.log('✅ 管理员登录成功');

    console.log('\n2. 测试获取专家列表...');
    await testGetExperts(token);

    console.log('\n3. 测试获取团队列表...');
    await testGetTeams(token);

    console.log('\n🎉 所有管理员功能测试通过！');
    console.log('\n📋 现在您可以：');
    console.log('1. 访问 http://localhost:3000 登录管理员');
    console.log('2. 查看"团队管理"页面 - 查看已提交的团队作品');
    console.log('3. 查看"专家管理"页面 - 查看已注册的专家列表');
    console.log('4. 创建新专家账号');
    console.log('5. 分配评审任务');

  } catch (error) {
    console.log('\n❌ 测试失败:', error.message);
  }
}

runTests();
