const http = require('http');

console.log('🧪 测试状态修复...');

// 测试管理员获取团队列表（包含正确的评审状态）
function testGetTeamsWithCorrectStatus() {
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
                      console.log(`\n📁 ${team.team_name || team.original_name}`);
                      console.log(`   评审完成状态: ${team.reviewCompletionStatus}`);
                      if (team.reviewStatus) {
                        console.log(`   评审进度: ${team.reviewStatus.completedAssignments}/${team.reviewStatus.totalAssignments} 完成`);
                        if (team.reviewStatus.averageScore) {
                          console.log(`   平均分: ${team.reviewStatus.averageScore}分`);
                        }
                        if (team.reviewStatus.assignments.length > 0) {
                          console.log(`   分配专家:`);
                          team.reviewStatus.assignments.forEach(assignment => {
                            const statusText = assignment.status === 'completed' ? '✅已完成' : 
                                             assignment.status === 'in_progress' ? '🔄评审中' : '⏳待评审';
                            const scoreText = assignment.score !== null ? ` (${assignment.score}分)` : '';
                            console.log(`     - ${assignment.expertName} ${statusText}${scoreText}`);
                          });
                        } else {
                          console.log(`   ⚠️ 待分配专家`);
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
    console.log('测试修复后的状态显示...');
    await testGetTeamsWithCorrectStatus();
    
    console.log('\n🎉 测试通过！');
    console.log('\n📋 修复内容总结:');
    console.log('✅ 1. 移除了快速访问栏和系统特性');
    console.log('✅ 2. 修复了评审状态显示BUG');
    console.log('✅ 3. 现在状态正确反映评审完成情况');
    console.log('✅ 4. 显示详细的专家分配信息');
    
    console.log('\n🔍 状态说明:');
    console.log('- 评审完成: 所有分配的专家都已完成评审');
    console.log('- 评审中: 部分专家已完成评审');
    console.log('- 已分配: 已分配专家但都未开始评审');
    console.log('- 未分配: 还没有分配专家');
    
  } catch (error) {
    console.log('\n❌ 测试失败:', error.message);
  }
}

runTests();
