const http = require('http');

console.log('🧪 测试评审分配功能...');

// 测试评审分配
function testAssignment() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/reviews/assign',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1NzYwNDMxNCwiZXhwIjoxNzU3NjkwNzE0fQ.q4b0uyDdt5i4HdLV8IZnqgjBIXVDTuxySI0rd9HyNao'
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
          console.log('分配响应:', result);
          
          if (result.success) {
            console.log('✅ 评审分配测试成功！');
            console.log('分配结果:', result.message);
            resolve(true);
          } else {
            console.log('❌ 评审分配测试失败:', result.error);
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

    req.end();
  });
}

// 测试统计数据
function testStatistics() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/reviews/statistics',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1NzYwNDMxNCwiZXhwIjoxNzU3NjkwNzE0fQ.q4b0uyDdt5i4HdLV8IZnqgjBIXVDTuxySI0rd9HyNao'
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
          console.log('统计响应:', result);
          
          if (result.success) {
            console.log('✅ 统计数据测试成功！');
            resolve(true);
          } else {
            console.log('❌ 统计数据测试失败:', result.error);
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

    req.end();
  });
}

// 运行测试
async function runTests() {
  try {
    console.log('1. 测试评审分配...');
    await testAssignment();
    
    console.log('\n2. 测试统计数据...');
    await testStatistics();
    
    console.log('\n🎉 所有测试通过！');
    console.log('\n📋 现在您可以：');
    console.log('1. 访问 http://localhost:3000 登录管理员');
    console.log('2. 创建专家账号');
    console.log('3. 上传文件');
    console.log('4. 分配评审任务');
    console.log('5. 查看统计报告');
    
  } catch (error) {
    console.log('\n❌ 测试失败:', error.message);
  }
}

runTests();
