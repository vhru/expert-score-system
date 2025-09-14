const fs = require('fs');
const path = require('path');

console.log('=== 文件上传目录测试 ===');
console.log('当前工作目录:', process.cwd());
console.log('UPLOAD_DIR 环境变量:', process.env.UPLOAD_DIR);

const uploadDir = process.env.UPLOAD_DIR || './uploads';
console.log('使用的上传目录:', uploadDir);

// 检查目录是否存在
if (fs.existsSync(uploadDir)) {
  console.log('✅ 上传目录存在');
  try {
    const stats = fs.statSync(uploadDir);
    console.log('目录权限:', stats.mode.toString(8));
    console.log('是否可写:', fs.constants.W_OK ? '是' : '否');
  } catch (error) {
    console.log('❌ 无法访问目录:', error.message);
  }
} else {
  console.log('❌ 上传目录不存在');
  
  // 尝试创建目录
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('✅ 成功创建上传目录');
  } catch (error) {
    console.log('❌ 创建目录失败:', error.message);
  }
}

// 测试子目录
const subDirs = ['member-cvs', 'team-documents', 'team-images', 'photos'];
subDirs.forEach(subDir => {
  const fullPath = path.join(uploadDir, subDir);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${subDir} 目录存在`);
  } else {
    try {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`✅ 成功创建 ${subDir} 目录`);
    } catch (error) {
      console.log(`❌ 创建 ${subDir} 目录失败:`, error.message);
    }
  }
});

// 测试文件写入
try {
  const testFile = path.join(uploadDir, 'test.txt');
  fs.writeFileSync(testFile, 'test content');
  console.log('✅ 文件写入测试成功');
  fs.unlinkSync(testFile);
  console.log('✅ 文件删除测试成功');
} catch (error) {
  console.log('❌ 文件写入测试失败:', error.message);
}
