const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'expert_review.db');

console.log('🔍 检查数据库状态...');
console.log('数据库路径:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ 数据库连接失败:', err.message);
    return;
  }
  console.log('✅ 数据库连接成功');
});

// 检查表是否存在
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
  if (err) {
    console.error('❌ 查询表失败:', err.message);
    return;
  }
  
  console.log('\n📋 数据库表:');
  rows.forEach(row => {
    console.log(`  - ${row.name}`);
  });
  
  // 检查用户表
  db.all("SELECT * FROM users", (err, users) => {
    if (err) {
      console.error('❌ 查询用户失败:', err.message);
      return;
    }
    
    console.log('\n👥 用户列表:');
    if (users.length === 0) {
      console.log('  - 暂无用户');
    } else {
      users.forEach(user => {
        console.log(`  - ${user.username} (${user.role})`);
      });
    }
    
    // 检查文件表
    db.all("SELECT * FROM files", (err, files) => {
      if (err) {
        console.error('❌ 查询文件失败:', err.message);
        return;
      }
      
      console.log('\n📁 文件列表:');
      if (files.length === 0) {
        console.log('  - 暂无文件');
      } else {
        files.forEach(file => {
          console.log(`  - ${file.original_name} (${file.upload_status})`);
        });
      }
      
      db.close((err) => {
        if (err) {
          console.error('❌ 关闭数据库失败:', err.message);
        } else {
          console.log('\n✅ 数据库检查完成');
        }
      });
    });
  });
});
