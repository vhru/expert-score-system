const fs = require('fs');
const path = require('path');

console.log('🚀 专家盲审系统 - 快速设置');
console.log('================================');

// 检查环境文件
const envPath = path.join(process.cwd(), '.env.local');
const envExamplePath = path.join(process.cwd(), 'env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ 已创建 .env.local 文件');
    console.log('⚠️  请编辑 .env.local 文件配置数据库连接信息');
  } else {
    console.log('❌ 未找到 env.example 文件');
  }
} else {
  console.log('✅ .env.local 文件已存在');
}

// 创建上传目录
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('✅ 已创建上传目录');
} else {
  console.log('✅ 上传目录已存在');
}

console.log('\n📋 下一步操作：');
console.log('1. 编辑 .env.local 文件，配置数据库连接');
console.log('2. 创建MySQL数据库: CREATE DATABASE expert_review;');
console.log('3. 运行: npm run dev');
console.log('4. 访问: http://localhost:3000');
console.log('5. 初始化数据库: POST http://localhost:3000/api/init');
console.log('\n🎉 设置完成！');
