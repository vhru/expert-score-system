const http = require('http');

console.log('🧪 测试团队注册功能...');

// 测试团队注册
function testTeamRegister() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      teamName: '测试团队B',
      contactPerson: '李四',
      contactPhone: '13900139000',
      contactEmail: 'testb@example.com',
      teamDescription: '这是一个测试团队B',
      password: 'password123',
      confirmPassword: 'password123'
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/teams/register',
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
          console.log('团队注册响应:', result);
          
          if (result.success) {
            console.log('✅ 团队注册成功！');
            console.log('团队ID:', result.teamId);
            resolve(true);
          } else {
            console.log('❌ 团队注册失败:', result.error);
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

// 测试团队登录
function testTeamLogin() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      teamName: '测试团队B',
      password: 'password123'
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/teams/login',
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
          console.log('团队登录响应:', result);
          
          if (result.success) {
            console.log('✅ 团队登录成功！');
            console.log('团队信息:', JSON.stringify(result.team, null, 2));
            resolve(result.token);
          } else {
            console.log('❌ 团队登录失败:', result.error);
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

// 运行测试
async function runTests() {
  try {
    console.log('1. 测试团队注册...');
    await testTeamRegister();
    
    console.log('\n2. 测试团队登录...');
    const token = await testTeamLogin();
    
    console.log('\n🎉 团队注册和登录测试完成！');
    console.log('\n📋 现在您可以访问以下界面：');
    console.log('1. 团队注册: http://localhost:3000/team-register');
    console.log('2. 团队登录: http://localhost:3000/team-login');
    console.log('3. 团队管理后台: http://localhost:3000/team-dashboard');
    console.log('4. 团队作品提交: http://localhost:3000/team-submit');
    console.log('\n🔑 测试账号:');
    console.log('团队名称: 测试团队B');
    console.log('密码: password123');

  } catch (error) {
    console.log('\n❌ 测试失败:', error.message);
  }
}

runTests();
