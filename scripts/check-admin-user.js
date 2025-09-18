// 检查管理员用户是否存在
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function checkAdminUser() {
  console.log('=== 检查管理员用户 ===');
  
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'expert_review',
  };

  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');

    // 1. 检查users表结构
    console.log('\n1. 检查users表结构:');
    const [columns] = await connection.execute('DESCRIBE users');
    console.log(columns);

    // 2. 检查所有用户
    console.log('\n2. 检查所有用户:');
    const [users] = await connection.execute('SELECT id, username, role, expert_type, created_at FROM users');
    console.log(users);

    // 3. 检查管理员用户
    console.log('\n3. 检查管理员用户:');
    const [adminUsers] = await connection.execute(
      'SELECT id, username, role, expert_type, created_at FROM users WHERE role = "admin"'
    );
    console.log('管理员用户:', adminUsers);

    // 4. 检查特定管理员用户
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    console.log(`\n4. 检查用户 "${adminEmail}":`);
    const [specificUser] = await connection.execute(
      'SELECT * FROM users WHERE username = ?',
      [adminEmail]
    );
    
    if (specificUser.length > 0) {
      console.log('✅ 找到用户:', specificUser[0]);
      
      // 5. 测试密码验证
      console.log('\n5. 测试密码验证:');
      const user = specificUser[0];
      const testPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const isValid = await bcrypt.compare(testPassword, user.password);
      console.log(`密码 "${testPassword}" 验证结果:`, isValid ? '✅ 正确' : '❌ 错误');
      
      // 显示密码哈希（用于调试）
      console.log('存储的密码哈希:', user.password);
      
    } else {
      console.log('❌ 未找到用户:', adminEmail);
    }

    // 6. 检查环境变量
    console.log('\n6. 环境变量:');
    console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL || 'admin@example.com');
    console.log('ADMIN_PASSWORD:', process.env.ADMIN_PASSWORD || 'admin123');

    await connection.end();
    console.log('\n✅ 检查完成');

  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  checkAdminUser();
}

module.exports = { checkAdminUser };
