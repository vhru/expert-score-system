// 测试线上文件上传API
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testUploadAPI() {
  console.log('=== 线上文件上传API测试 ===');
  
  // 替换为你的线上域名
  const baseURL = 'https://yourdomain.com'; // 请替换为实际域名
  
  try {
    // 1. 测试管理员登录
    console.log('1. 测试管理员登录...');
    const loginResponse = await fetch(`${baseURL}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin@example.com',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`登录失败: ${loginResponse.status}`);
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ 管理员登录成功');
    
    // 2. 测试文件上传目录权限
    console.log('2. 测试文件上传...');
    
    // 创建一个测试文件
    const testContent = '这是一个测试文件内容';
    const testFileName = `test_${Date.now()}.txt`;
    const testFilePath = path.join(__dirname, testFileName);
    fs.writeFileSync(testFilePath, testContent);
    
    // 创建FormData
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath), {
      filename: testFileName,
      contentType: 'text/plain'
    });
    
    // 测试文件上传
    const uploadResponse = await fetch(`${baseURL}/api/upload-photo`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      },
      body: formData
    });
    
    if (uploadResponse.ok) {
      const uploadData = await uploadResponse.json();
      console.log('✅ 文件上传成功:', uploadData);
    } else {
      const errorData = await uploadResponse.json();
      console.log('❌ 文件上传失败:', errorData);
    }
    
    // 清理测试文件
    fs.unlinkSync(testFilePath);
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testUploadAPI();
}

module.exports = { testUploadAPI };
