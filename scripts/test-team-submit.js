const http = require('http');
const FormData = require('form-data');
const fs = require('fs');

console.log('🧪 测试团队提交功能...');

// 创建测试文件
const testContent = '这是一个测试文件内容';
const testFilePath = './test-file.txt';
fs.writeFileSync(testFilePath, testContent);

// 测试团队提交
function testTeamSubmit() {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    
    // 添加团队信息
    const teamInfo = {
      teamName: '测试团队A',
      contactPerson: '张三',
      contactPhone: '13800138000',
      contactEmail: 'test@example.com',
      teamDescription: '这是一个测试团队'
    };
    
    form.append('teamInfo', JSON.stringify(teamInfo));
    form.append('file', fs.createReadStream(testFilePath), {
      filename: 'test-file.txt',
      contentType: 'text/plain'
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/team-submit',
      method: 'POST',
      headers: form.getHeaders()
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('团队提交响应:', result);
          
          if (result.success) {
            console.log('✅ 团队提交测试成功！');
            console.log('团队名称:', result.teamName);
            resolve(true);
          } else {
            console.log('❌ 团队提交测试失败:', result.error);
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

    form.pipe(req);
  });
}

// 清理测试文件
function cleanup() {
  try {
    fs.unlinkSync(testFilePath);
    console.log('✅ 测试文件已清理');
  } catch (err) {
    console.log('⚠️ 清理测试文件失败:', err.message);
  }
}

// 运行测试
testTeamSubmit()
  .then(() => {
    console.log('\n🎉 团队提交功能测试通过！');
    console.log('\n📋 现在您可以：');
    console.log('1. 访问 http://localhost:3000/team-submit 测试团队提交');
    console.log('2. 访问 http://localhost:3000 登录管理员查看提交的作品');
    console.log('3. 分配专家进行评审');
  })
  .catch((error) => {
    console.log('\n❌ 测试失败:', error.message);
  })
  .finally(() => {
    cleanup();
  });
