const http = require('http');

console.log('🔑 获取管理员Token...');

// 获取管理员token
function getAdminToken() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
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
        'Content-Length': data.length
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
          console.log('登录响应:', result);
          
          if (result.success && result.token) {
            console.log('✅ 获取管理员Token成功！');
            console.log('Token:', result.token);
            return resolve(result.token);
          } else {
            console.log('❌ 获取管理员Token失败:', result.error);
            return reject(new Error(result.error));
          }
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

// 运行测试
async function runTests() {
  try {
    const token = await getAdminToken();
    
    // 将token写入环境变量文件
    const fs = require('fs');
    const envContent = `ADMIN_TOKEN=${token}`;
    fs.writeFileSync('.env.local', envContent);
    console.log('✅ Token已保存到.env.local文件');
    
  } catch (error) {
    console.log('❌ 获取Token失败:', error.message);
  }
}

runTests();

