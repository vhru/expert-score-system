const http = require('http');

console.log('🧪 测试专家评审界面...');

// 获取专家token
function getExpertToken() {
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
          console.log('专家评审任务响应:', result);
          
          if (result.success) {
            console.log('✅ 获取专家评审任务成功！');
            console.log(`任务数量: ${result.assignments.length}`);
            result.assignments.forEach(assignment => {
              console.log(`  - ${assignment.team_name || assignment.original_name} (${assignment.assignment_status})`);
            });
            resolve(result.assignments);
          } else {
            console.log('❌ 获取专家评审任务失败:', result.error);
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

    req.end();
  });
}

// 测试提交评审
function testSubmitReview(token, assignmentId) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      assignmentId: assignmentId,
      score: 85.5,
      comments: '这是一个测试评审意见。作品整体质量不错，有创新点，但还有一些改进空间。'
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/expert/submit-review',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
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
          console.log('提交评审响应:', result);
          
          if (result.success) {
            console.log('✅ 提交评审成功！');
            resolve(true);
          } else {
            console.log('❌ 提交评审失败:', result.error);
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
    console.log('1. 专家登录...');
    const token = await getExpertToken();
    console.log('✅ 专家登录成功');

    console.log('\n2. 获取评审任务...');
    const assignments = await testGetExpertAssignments(token);

    if (assignments.length > 0) {
      console.log('\n3. 测试提交评审...');
      await testSubmitReview(token, assignments[0].id);
    } else {
      console.log('\n⚠️ 没有评审任务，跳过提交测试');
    }

    console.log('\n🎉 专家评审界面测试完成！');
    console.log('\n📋 现在您可以：');
    console.log('1. 访问 http://localhost:3000 用专家账号登录');
    console.log('2. 专家登录后会自动进入评审界面');
    console.log('3. 查看分配的评审任务');
    console.log('4. 下载文件进行评审');
    console.log('5. 提交评分和评审意见');

  } catch (error) {
    console.log('\n❌ 测试失败:', error.message);
  }
}

runTests();
