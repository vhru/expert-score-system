const http = require('http');

console.log('🧪 测试团队管理功能...');

// 测试获取团队列表
function testGetTeams() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/teams',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1NzY2MzAyMywiZXhwIjoxNzU3NzQ5NDIzfQ.BpG-KHX8uhsn5e7PSd_e96EjRODlRGTDwdtsIo2Ez0s'
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
          console.log('团队列表响应:', result);
          
          if (result.success) {
            console.log('✅ 获取团队列表成功！');
            console.log(`团队数量: ${result.teams.length}`);
            result.teams.forEach((team, index) => {
              console.log(`  ${index + 1}. ${team.team_name} (${team.is_enterprise ? '企业组' : '团队组'})`);
            });
          } else {
            console.log('❌ 获取团队列表失败:', result.error);
          }
          
          resolve(result);
        } catch (err) {
          console.error('解析响应失败:', err);
          console.log('原始响应:', responseData);
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
    console.log('1. 测试获取团队列表...');
    await testGetTeams();
    
    console.log('\n🎉 团队管理功能测试完成！');
    
  } catch (error) {
    console.log('\n❌ 测试失败:', error.message);
  }
}

runTests();
