const http = require('http');

console.log('🧪 系统测试开始...');

// 测试服务器是否运行
function testServer() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3000', (res) => {
      console.log(`✅ 服务器响应正常，状态码: ${res.statusCode}`);
      resolve(true);
    });
    
    req.on('error', (err) => {
      console.log(`❌ 服务器连接失败: ${err.message}`);
      reject(err);
    });
    
    req.setTimeout(5000, () => {
      console.log('❌ 服务器响应超时');
      reject(new Error('Timeout'));
    });
  });
}

// 测试API端点
function testAPI() {
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
            console.log('✅ API测试成功');
            resolve(true);
          } else {
            console.log(`❌ API测试失败: ${result.error}`);
            reject(new Error(result.error));
          }
        } catch (err) {
          console.log(`❌ API响应解析失败: ${err.message}`);
          reject(err);
        }
      });
    });

    req.on('error', (err) => {
      console.log(`❌ API请求失败: ${err.message}`);
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

// 运行测试
async function runTests() {
  try {
    console.log('1. 测试服务器连接...');
    await testServer();
    
    console.log('2. 测试API端点...');
    await testAPI();
    
    console.log('\n🎉 所有测试通过！');
    console.log('\n📋 下一步操作：');
    console.log('1. 访问 http://localhost:3000 查看主页面');
    console.log('2. 访问 http://localhost:3000/test 进行系统测试');
    console.log('3. 使用管理员账号登录: admin@example.com / admin123');
    console.log('4. 测试文件上传和专家管理功能');
    
  } catch (error) {
    console.log('\n❌ 测试失败，请检查：');
    console.log('1. 服务器是否正在运行 (npm run dev)');
    console.log('2. 数据库是否已配置');
    console.log('3. 环境变量是否正确设置');
    console.log(`\n错误详情: ${error.message}`);
  }
}

runTests();
