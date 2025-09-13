const http = require('http');

console.log('🧪 测试新的评审分配逻辑...');

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
          if (result.success && result.token) {
            resolve(result.token);
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

    req.write(data);
    req.end();
  });
}

// 测试自动分配
function testAutoAssign(token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/reviews/assign',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
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
          console.log('自动分配结果:', result);
          resolve(result);
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

// 测试手动分配
function testManualAssign(token, teamId, expertIds) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      teamId: teamId,
      expertIds: expertIds
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/reviews/manual-assign',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
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
          console.log('手动分配结果:', result);
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(data);
    req.end();
  });
}

// 获取团队列表
function getTeams(token) {
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
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          console.log('团队列表:', result);
          resolve(result);
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

// 获取专家列表
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
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          console.log('专家列表:', result);
          resolve(result);
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
    console.log('1. 获取管理员Token...');
    const token = await getAdminToken();
    console.log('✅ Token获取成功');

    console.log('\n2. 获取团队列表...');
    const teamsResult = await getTeams(token);
    if (teamsResult.success) {
      console.log(`✅ 找到 ${teamsResult.teams.length} 个团队`);
      teamsResult.teams.forEach(team => {
        console.log(`  - ${team.team_name} (${team.is_enterprise ? '企业组' : '团队组'})`);
      });
    }

    console.log('\n3. 获取专家列表...');
    const expertsResult = await getExperts(token);
    if (expertsResult.success) {
      console.log(`✅ 找到 ${expertsResult.experts.length} 个专家`);
      expertsResult.experts.forEach(expert => {
        console.log(`  - ${expert.username} (${expert.expert_type === 'enterprise' ? '企业专家' : '团队专家'})`);
      });
    }

    console.log('\n4. 测试自动分配...');
    const autoAssignResult = await testAutoAssign(token);
    if (autoAssignResult.success) {
      console.log('✅ 自动分配成功');
      console.log(`分配了 ${autoAssignResult.assignments.length} 个任务`);
    } else {
      console.log('❌ 自动分配失败:', autoAssignResult.message);
    }

    console.log('\n🎉 评审分配逻辑测试完成！');
    
  } catch (error) {
    console.log('\n❌ 测试失败:', error.message);
  }
}

runTests();
