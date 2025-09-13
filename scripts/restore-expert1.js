const http = require('http');

console.log('🔧 恢复expert1账号...');

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

// 恢复expert1账号
function restoreExpert1(token, expertId) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      username: 'expert1',
      password: 'password123',
      personalInfo: '张三 - 计算机科学专家'
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
          console.log('恢复expert1响应:', result);
          
          if (result.success) {
            console.log('✅ expert1账号恢复成功！');
            resolve(true);
          } else {
            console.log('❌ expert1账号恢复失败:', result.error);
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

// 获取专家列表找到expert1_updated的ID
function getExperts(token) {
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

// 运行恢复
async function runRestore() {
  try {
    console.log('1. 管理员登录...');
    const token = await getAdminToken();
    console.log('✅ 管理员登录成功');

    console.log('\n2. 获取专家列表...');
    const experts = await getExperts(token);
    const expert1Updated = experts.find(e => e.username === 'expert1_updated');
    
    if (expert1Updated) {
      console.log(`找到expert1_updated，ID: ${expert1Updated.id}`);
      
      console.log('\n3. 恢复expert1账号...');
      await restoreExpert1(token, expert1Updated.id);
      
      console.log('\n🎉 expert1账号恢复完成！');
      console.log('\n📋 现在expert1可以正常登录：');
      console.log('用户名: expert1');
      console.log('密码: password123');
    } else {
      console.log('❌ 未找到expert1_updated账号');
    }

  } catch (error) {
    console.log('\n❌ 恢复失败:', error.message);
  }
}

runRestore();
