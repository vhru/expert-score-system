const http = require('http');

console.log('🧪 测试专家编辑功能...');

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

// 测试更新专家信息
function testUpdateExpert(token, expertId) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      username: 'expert1_updated',
      password: 'newpassword123',
      personalInfo: '张三 - 计算机科学专家 (已更新)'
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/admin/experts/${expertId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
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
          console.log('更新专家响应:', result);
          
          if (result.success) {
            console.log('✅ 更新专家信息成功！');
            resolve(true);
          } else {
            console.log('❌ 更新专家信息失败:', result.error);
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
          if (result.success) {
            resolve(result.experts);
          } else {
            reject(new Error(result.error));
          }
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

// 运行测试
async function runTests() {
  try {
    console.log('1. 管理员登录...');
    const token = await getAdminToken();
    console.log('✅ 管理员登录成功');

    console.log('\n2. 获取专家列表...');
    const experts = await testGetExperts(token);
    console.log(`找到 ${experts.length} 个专家`);

    if (experts.length > 0) {
      const expert1 = experts.find(e => e.username === 'expert1');
      if (expert1) {
        console.log('\n3. 测试更新专家信息...');
        await testUpdateExpert(token, expert1.id);
        
        console.log('\n4. 验证更新结果...');
        const updatedExperts = await testGetExperts(token);
        const updatedExpert = updatedExperts.find(e => e.id === expert1.id);
        if (updatedExpert) {
          console.log(`更新后的用户名: ${updatedExpert.username}`);
          console.log(`更新后的个人信息: ${updatedExpert.encrypted_info}`);
        }
      }
    }

    console.log('\n🎉 专家编辑功能测试完成！');
    console.log('\n📋 现在您可以：');
    console.log('1. 访问 http://localhost:3000 登录管理员');
    console.log('2. 在"专家管理"页面编辑专家信息');
    console.log('3. 修改用户名、密码和个人信息');
    console.log('4. 删除不需要的专家账号');

  } catch (error) {
    console.log('\n❌ 测试失败:', error.message);
  }
}

runTests();
