// 测试管理员登录功能
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function testAdminLogin() {
  console.log('=== 测试管理员登录功能 ===');
  
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

    // 1. 检查用户是否存在
    console.log(`\n1. 检查用户 "${adminEmail}":`);
    const [users] = await connection.execute(
      'SELECT * FROM users WHERE username = ?',
      [adminEmail]
    );

    if (users.length === 0) {
      console.log('❌ 用户不存在，需要创建');
      
      // 创建管理员用户
      console.log('\n2. 创建管理员用户:');
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const [insertResult] = await connection.execute(
        'INSERT INTO users (username, password, role, encrypted_info, expert_type) VALUES (?, ?, ?, ?, ?)',
        [adminEmail, hashedPassword, 'admin', null, 'admin']
      );
      console.log('✅ 管理员用户创建成功');
      
    } else {
      console.log('✅ 用户存在:', {
        id: users[0].id,
        username: users[0].username,
        role: users[0].role,
        expert_type: users[0].expert_type
      });
    }

    // 2. 重新查询用户（确保获取最新数据）
    console.log('\n3. 重新查询用户:');
    const [updatedUsers] = await connection.execute(
      'SELECT * FROM users WHERE username = ?',
      [adminEmail]
    );

    if (updatedUsers.length > 0) {
      const user = updatedUsers[0];
      
      // 3. 测试密码验证
      console.log('\n4. 测试密码验证:');
      const isValidPassword = await bcrypt.compare(adminPassword, user.password);
      console.log(`密码 "${adminPassword}" 验证结果:`, isValidPassword ? '✅ 正确' : '❌ 错误');
      
      if (isValidPassword) {
        console.log('\n5. 模拟认证流程:');
        const authResult = {
          id: user.id,
          username: user.username,
          role: user.role,
          encrypted_info: user.encrypted_info
        };
        console.log('✅ 认证成功:', authResult);
      } else {
        console.log('\n5. 密码验证失败，重新设置密码:');
        const newHashedPassword = await bcrypt.hash(adminPassword, 10);
        await connection.execute(
          'UPDATE users SET password = ? WHERE username = ?',
          [newHashedPassword, adminEmail]
        );
        console.log('✅ 密码已重新设置');
        
        // 再次验证
        const isValidAfterUpdate = await bcrypt.compare(adminPassword, newHashedPassword);
        console.log('重新设置后密码验证结果:', isValidAfterUpdate ? '✅ 正确' : '❌ 错误');
      }
    }

    // 4. 显示所有管理员用户
    console.log('\n6. 所有管理员用户:');
    const [allAdmins] = await connection.execute(
      'SELECT id, username, role, expert_type, created_at FROM users WHERE role = "admin"'
    );
    console.log(allAdmins);

    await connection.end();
    console.log('\n✅ 测试完成');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('错误详情:', error);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testAdminLogin();
}

module.exports = { testAdminLogin };
