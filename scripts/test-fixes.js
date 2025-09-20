// 测试修复效果
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function testFixes() {
  console.log('=== 测试修复效果 ===');
  
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

    // 1. 测试管理员登录
    console.log('\n1. 测试管理员登录:');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    const [adminUsers] = await connection.execute(
      'SELECT * FROM users WHERE username = ? AND role = "admin"',
      [adminEmail]
    );
    
    if (adminUsers.length > 0) {
      const user = adminUsers[0];
      const isValidPassword = await bcrypt.compare(adminPassword, user.password);
      console.log(`管理员用户存在: ${user.username}`);
      console.log(`密码验证: ${isValidPassword ? '✅ 正确' : '❌ 错误'}`);
    } else {
      console.log('❌ 管理员用户不存在');
    }

    // 2. 测试数据库表结构
    console.log('\n2. 测试数据库表结构:');
    const tables = ['users', 'teams', 'files', 'review_assignments', 'team_documents'];
    for (const table of tables) {
      try {
        const [columns] = await connection.execute(`DESCRIBE ${table}`);
        console.log(`✅ ${table} 表存在，字段数: ${columns.length}`);
      } catch (error) {
        console.log(`❌ ${table} 表不存在或有问题: ${error.message}`);
      }
    }

    // 3. 测试files表的findByTeam方法
    console.log('\n3. 测试files表查询:');
    try {
      const [files] = await connection.execute('SELECT * FROM files LIMIT 5');
      console.log(`✅ files表查询成功，记录数: ${files.length}`);
      if (files.length > 0) {
        console.log('示例记录:', files[0]);
      }
    } catch (error) {
      console.log(`❌ files表查询失败: ${error.message}`);
    }

    // 4. 测试团队和文件关联
    console.log('\n4. 测试团队和文件关联:');
    try {
      const [teams] = await connection.execute('SELECT team_name FROM teams LIMIT 3');
      for (const team of teams) {
        const [teamFiles] = await connection.execute(
          'SELECT * FROM files WHERE team_name = ?',
          [team.team_name]
        );
        console.log(`团队 "${team.team_name}" 的文件数: ${teamFiles.length}`);
      }
    } catch (error) {
      console.log(`❌ 团队文件关联测试失败: ${error.message}`);
    }

    // 5. 测试评审分配
    console.log('\n5. 测试评审分配:');
    try {
      const [assignments] = await connection.execute(`
        SELECT ra.*, f.team_name, u.username as expert_name
        FROM review_assignments ra
        JOIN files f ON ra.file_id = f.id
        JOIN users u ON ra.expert_id = u.id
        LIMIT 5
      `);
      console.log(`✅ 评审分配查询成功，记录数: ${assignments.length}`);
      if (assignments.length > 0) {
        console.log('示例分配记录:', assignments[0]);
      }
    } catch (error) {
      console.log(`❌ 评审分配查询失败: ${error.message}`);
    }

    await connection.end();
    console.log('\n✅ 测试完成');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testFixes();
}

module.exports = { testFixes };