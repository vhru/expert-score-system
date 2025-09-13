const http = require('http');

console.log('🧪 新的登录测试...');

function testLogin() {
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
          console.log('登录响应:', result);
          
          if (result.success) {
            console.log('✅ 登录测试成功！');
            console.log('用户信息:', result.user);
            resolve(true);
          } else {
            console.log('❌ 登录测试失败:', result.error);
            reject(new Error(result.error));
          }
        } catch (err) {
          console.log('❌ 响应解析失败:', err.message);
          console.log('原始响应:', data);
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

// 运行测试
testLogin().then(() => {
  console.log('\n🎉 所有测试通过！');
  console.log('\n📋 系统访问地址：');
  console.log('1. 主页: http://localhost:3000');
  console.log('2. 参赛者提交: http://localhost:3000/submit');
  console.log('3. 测试页面: http://localhost:3000/test');
  console.log('\n🔑 管理员账号：');
  console.log('用户名: admin@example.com');
  console.log('密码: admin123');
}).catch((error) => {
  console.log('\n❌ 测试失败:', error.message);
});
