const { dbOperations } = require('../lib/database-adapter');

async function checkAdmin() {
  try {
    console.log('🔍 检查管理员账号...');
    
    // 查找admin账号
    const admin = await dbOperations.users.findByUsername('admin@example.com');
    
    if (admin) {
      console.log('✅ 找到管理员账号:');
      console.log(`   用户名: ${admin.username}`);
      console.log(`   角色: ${admin.role}`);
      console.log(`   专家类型: ${admin.expert_type}`);
      console.log(`   创建时间: ${admin.created_at}`);
    } else {
      console.log('❌ 未找到管理员账号');
      console.log('💡 建议：运行创建admin账号的API');
    }
    
    // 列出所有用户
    const allUsers = await dbOperations.users.findAll();
    console.log(`\n📊 数据库中共有 ${allUsers.length} 个用户:`);
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.username} (${user.role})`);
    });
    
  } catch (error) {
    console.error('❌ 检查管理员账号时出错:', error);
  }
}

checkAdmin().then(() => {
  console.log('🎉 检查完成');
  process.exit(0);
}).catch(error => {
  console.error('💥 检查失败:', error);
  process.exit(1);
});