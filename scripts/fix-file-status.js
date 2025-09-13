const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'expert_review.db');

console.log('🔧 修复文件状态...');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ 数据库连接失败:', err.message);
    return;
  }
  console.log('✅ 数据库连接成功');
});

// 更新所有文件状态为completed
db.run("UPDATE files SET upload_status = 'completed' WHERE upload_status = 'pending'", function(err) {
  if (err) {
    console.error('❌ 更新文件状态失败:', err.message);
    return;
  }
  
  console.log(`✅ 已更新 ${this.changes} 个文件状态为 completed`);
  
  // 检查更新后的文件
  db.all("SELECT * FROM files", (err, files) => {
    if (err) {
      console.error('❌ 查询文件失败:', err.message);
      return;
    }
    
    console.log('\n📁 更新后的文件列表:');
    files.forEach(file => {
      console.log(`  - ${file.original_name} (${file.upload_status})`);
    });
    
    db.close((err) => {
      if (err) {
        console.error('❌ 关闭数据库失败:', err.message);
      } else {
        console.log('\n🎉 文件状态修复完成！');
        console.log('现在可以重新测试评审分配功能了');
      }
    });
  });
});
