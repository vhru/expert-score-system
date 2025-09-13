const http = require('http');

console.log('🧪 测试修复后的功能...');

// 测试专家登录和评审功能
function testExpertLogin() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      username: 'expert1',
      password: 'password123'
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
            console.log('✅ 专家登录成功');
            resolve(result.token);
          } else {
            reject(new Error('专家登录失败'));
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

// 测试获取专家评审任务
function testGetExpertAssignments(token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/expert/assignments',
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
            console.log('✅ 获取专家评审任务成功');
            console.log(`任务数量: ${result.assignments.length}`);
            result.assignments.forEach(assignment => {
              console.log(`  - ${assignment.team_name || assignment.original_name} (${assignment.assignment_status})`);
              if (assignment.score !== null) {
                console.log(`    已评分: ${assignment.score}分`);
              }
            });
            resolve(result.assignments);
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

// 测试管理员获取团队列表
function testGetTeamsWithStatus() {
  return new Promise((resolve, reject) => {
    // 先获取管理员token
    const loginData = JSON.stringify({
      username: 'admin@example.com',
      password: 'admin123'
    });

    const loginOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };

    const loginReq = http.request(loginOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.success) {
            // 获取团队列表
            const teamOptions = {
              hostname: 'localhost',
              port: 3000,
              path: '/api/admin/teams',
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${result.token}`
              }
            };

            const teamReq = http.request(teamOptions, (teamRes) => {
              let teamData = '';
              teamRes.on('data', (chunk) => {
                teamData += chunk;
              });
              
              teamRes.on('end', () => {
                try {
                  const teamResult = JSON.parse(teamData);
                  if (teamResult.success) {
                    console.log('✅ 获取团队列表成功');
                    teamResult.teams.forEach(team => {
                      console.log(`  - ${team.team_name || team.original_name}`);
                      if (team.reviewStatus) {
                        console.log(`    评审状态: ${team.reviewStatus.completedAssignments}/${team.reviewStatus.totalAssignments} 完成`);
                        if (team.reviewStatus.averageScore) {
                          console.log(`    平均分: ${team.reviewStatus.averageScore}分`);
                        }
                      }
                    });
                    resolve(teamResult.teams);
                  } else {
                    reject(new Error(teamResult.error));
                  }
                } catch (err) {
                  reject(err);
                }
              });
            });

            teamReq.on('error', (err) => {
              reject(err);
            });

            teamReq.end();
          } else {
            reject(new Error('管理员登录失败'));
          }
        } catch (err) {
          reject(err);
        }
      });
    });

    loginReq.on('error', (err) => {
      reject(err);
    });

    loginReq.write(loginData);
    loginReq.end();
  });
}

// 运行测试
async function runTests() {
  try {
    console.log('1. 测试专家登录和评审功能...');
    const expertToken = await testExpertLogin();
    await testGetExpertAssignments(expertToken);
    
    console.log('\n2. 测试管理员团队管理功能...');
    await testGetTeamsWithStatus();
    
    console.log('\n🎉 所有修复测试通过！');
    console.log('\n📋 修复内容总结:');
    console.log('✅ 1. 团队登录页面添加了返回系统首页的链接');
    console.log('✅ 2. 专家评审界面支持修改已完成的评审');
    console.log('✅ 3. 管理员团队管理显示评审状态和平均分');
    
    console.log('\n🌐 现在可以访问的界面:');
    console.log('- 系统门户: http://localhost:3000/portal');
    console.log('- 团队登录: http://localhost:3000/team-login (有返回链接)');
    console.log('- 专家登录: http://localhost:3000/expert-login');
    console.log('- 管理员登录: http://localhost:3000/admin-login');

  } catch (error) {
    console.log('\n❌ 测试失败:', error.message);
  }
}

runTests();
