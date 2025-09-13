const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'expert_review.db');

console.log('👥 专家账号信息...');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ 数据库连接失败:', err.message);
    return;
  }
  console.log('✅ 数据库连接成功');
});

// 查询所有专家账号
db.all("SELECT id, username, role, created_at FROM users WHERE role = 'expert' ORDER BY id", (err, experts) => {
  if (err) {
    console.error('❌ 查询专家失败:', err.message);
    return;
  }

  console.log('\n📋 专家账号列表:');
  console.log('=' * 60);
  
  experts.forEach((expert, index) => {
    console.log(`\n${index + 1}. 专家账号信息:`);
    console.log(`   用户名: ${expert.username}`);
    console.log(`   密码: password123 (默认密码)`);
    console.log(`   角色: ${expert.role}`);
    console.log(`   注册时间: ${expert.created_at}`);
    console.log(`   登录地址: http://localhost:3000`);
  });

  console.log('\n' + '=' * 60);
  console.log('📝 使用说明:');
  console.log('1. 专家使用上述账号密码登录系统');
  console.log('2. 登录后会自动进入专家评审界面');
  console.log('3. 专家可以查看分配的评审任务');
  console.log('4. 下载文件进行评审并提交评分');
  console.log('5. 所有专家使用相同的默认密码: password123');

  console.log('\n🔐 安全建议:');
  console.log('1. 建议专家首次登录后修改密码');
  console.log('2. 可以通过邮件或短信单独发送账号信息');
  console.log('3. 确保专家账号信息的安全传输');

  db.close((err) => {
    if (err) {
      console.error('❌ 关闭数据库失败:', err.message);
    } else {
      console.log('\n✅ 专家账号信息展示完成！');
    }
  });
});
