const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function createDemoData() {
  let connection;
  
  try {
    // 连接数据库
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'expert_review',
    });

    console.log('🚀 创建演示数据...');

    // 创建演示专家
    const bcrypt = require('bcryptjs');
    const experts = [
      { username: 'expert1', password: 'password123', personalInfo: '张三 - 计算机科学专家' },
      { username: 'expert2', password: 'password123', personalInfo: '李四 - 软件工程专家' },
      { username: 'expert3', password: 'password123', personalInfo: '王五 - 人工智能专家' },
      { username: 'expert4', password: 'password123', personalInfo: '赵六 - 数据科学专家' },
      { username: 'expert5', password: 'password123', personalInfo: '钱七 - 网络安全专家' },
    ];

    for (const expert of experts) {
      const hashedPassword = await bcrypt.hash(expert.password, 10);
      await connection.execute(
        'INSERT IGNORE INTO users (username, password, role, encrypted_info) VALUES (?, ?, ?, ?)',
        [expert.username, hashedPassword, 'expert', expert.personalInfo]
      );
      console.log(`✅ 创建专家: ${expert.username}`);
    }

    // 创建演示文件
    const files = [
      { name: '项目方案A.pdf', size: 1024000, type: 'application/pdf', info: '创新项目方案A' },
      { name: '技术报告B.docx', size: 2048000, type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', info: '技术可行性报告B' },
      { name: '设计文档C.pdf', size: 1536000, type: 'application/pdf', info: '系统设计文档C' },
    ];

    for (const file of files) {
      await connection.execute(
        'INSERT IGNORE INTO files (original_name, file_path, file_size, mime_type, encrypted_info, upload_status) VALUES (?, ?, ?, ?, ?, ?)',
        [file.name, `/uploads/demo_${file.name}`, file.size, file.type, file.info, 'completed']
      );
      console.log(`✅ 创建文件: ${file.name}`);
    }

    console.log('\n🎉 演示数据创建完成！');
    console.log('\n📋 测试账号：');
    console.log('管理员: admin@example.com / admin123');
    console.log('专家1: expert1 / password123');
    console.log('专家2: expert2 / password123');
    console.log('专家3: expert3 / password123');
    console.log('专家4: expert4 / password123');
    console.log('专家5: expert5 / password123');

  } catch (error) {
    console.error('❌ 创建演示数据失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createDemoData();
