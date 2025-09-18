// 手动创建管理员用户
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
  console.log('=== 手动创建管理员用户 ===');
  
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

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // 1. 检查用户是否已存在
    console.log(`\n1. 检查用户 "${adminEmail}" 是否已存在:`);
    const [existingUsers] = await connection.execute(
      'SELECT id, username, role FROM users WHERE username = ?',
      [adminEmail]
    );

    if (existingUsers.length > 0) {
      console.log('⚠️  用户已存在:', existingUsers[0]);
      
      // 更新现有用户的密码
      console.log('\n2. 更新现有用户密码:');
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const [updateResult] = await connection.execute(
        'UPDATE users SET password = ?, role = ?, expert_type = ? WHERE username = ?',
        [hashedPassword, 'admin', 'admin', adminEmail]
      );
      console.log('✅ 用户密码已更新');
      
    } else {
      // 创建新用户
      console.log('\n2. 创建新管理员用户:');
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const [insertResult] = await connection.execute(
        'INSERT INTO users (username, password, role, encrypted_info, expert_type) VALUES (?, ?, ?, ?, ?)',
        [adminEmail, hashedPassword, 'admin', null, 'admin']
      );
      console.log('✅ 管理员用户创建成功');
    }

    // 3. 验证用户创建/更新
    console.log('\n3. 验证用户:');
    const [verifyUsers] = await connection.execute(
      'SELECT id, username, role, expert_type, created_at FROM users WHERE username = ?',
      [adminEmail]
    );
    
    if (verifyUsers.length > 0) {
      const user = verifyUsers[0];
      console.log('✅ 用户验证成功:', user);
      
      // 4. 测试密码验证
      console.log('\n4. 测试密码验证:');
      const [userWithPassword] = await connection.execute(
        'SELECT password FROM users WHERE username = ?',
        [adminEmail]
      );
      
      if (userWithPassword.length > 0) {
        const isValid = await bcrypt.compare(adminPassword, userWithPassword[0].password);
        console.log(`密码 "${adminPassword}" 验证结果:`, isValid ? '✅ 正确' : '❌ 错误');
      }
    }

    // 5. 显示所有管理员用户
    console.log('\n5. 所有管理员用户:');
    const [allAdmins] = await connection.execute(
      'SELECT id, username, role, expert_type, created_at FROM users WHERE role = "admin"'
    );
    console.log(allAdmins);

    await connection.end();
    console.log('\n✅ 管理员用户创建/更新完成');

  } catch (error) {
    console.error('❌ 创建管理员用户失败:', error.message);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  createAdminUser();
}

module.exports = { createAdminUser };
