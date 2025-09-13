const http = require('http');

console.log('🧪 测试专家登录...');

// 测试expert1_updated登录
function testExpertLogin(username, password) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      username: username,
      password: password
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
          console.log(`${username} 登录响应:`, result);
          
          if (result.success) {
            console.log(`✅ ${username} 登录成功！`);
            console.log(`用户信息: ${JSON.stringify(result.user)}`);
            resolve(true);
          } else {
            console.log(`❌ ${username} 登录失败: ${result.error}`);
            reject(new Error(result.error));
          }
        } catch (err) {
          console.log(`❌ ${username} 响应解析失败:`, err.message);
          reject(err);
        }
      });
    });

    req.on('error', (err) => {
      console.log(`❌ ${username} 请求失败:`, err.message);
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

// 运行测试
async function runTests() {
  try {
    console.log('1. 测试 expert1_updated 登录...');
    await testExpertLogin('expert1_updated', 'newpassword123');
    
    console.log('\n2. 测试 expert1_updated 用旧密码登录...');
    try {
      await testExpertLogin('expert1_updated', 'password123');
    } catch (error) {
      console.log('✅ 旧密码已失效，这是正确的');
    }
    
    console.log('\n3. 测试其他专家登录...');
    await testExpertLogin('expert2', 'password123');
    
    console.log('\n🎉 专家登录测试完成！');
    console.log('\n📋 当前可用的专家账号：');
    console.log('- expert1_updated / newpassword123');
    console.log('- expert2 / password123');
    console.log('- expert3 / password123');
    console.log('- expert4 / password123');
    console.log('- expert5 / password123');
    console.log('- 专家1 / password123');

  } catch (error) {
    console.log('\n❌ 测试失败:', error.message);
  }
}

runTests();
