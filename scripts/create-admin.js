const { dbOperations } = require('../lib/database-adapter');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    console.log('🔧 创建管理员账号...');
    
    // 检查是否已存在admin账号
    const existingAdmin = await dbOperations.users.findByUsername('admin@example.com');
    if (existingAdmin) {
      console.log('✅ 管理员账号已存在');
      console.log(`   用户名: ${existingAdmin.username}`);
      console.log(`   角色: ${existingAdmin.role}`);
      return;
    }
    
    // 创建admin账号
    const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
    const result = await dbOperations.users.create(
      'admin@example.com',
      adminPassword,
      'admin',
      null,
      'admin'
    );
    
    if (result.changes > 0) {
      console.log('✅ 管理员账号创建成功！');
      console.log('   用户名: admin@example.com');
      console.log('   密码: admin123');
      console.log('   角色: admin');
    } else {
      console.log('❌ 管理员账号创建失败');
    }
    
  } catch (error) {
    console.error('❌ 创建管理员账号时出错:', error);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  createAdmin().then(() => {
    console.log('🎉 脚本执行完成');
    process.exit(0);
  }).catch(error => {
    console.error('💥 脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = { createAdmin };
