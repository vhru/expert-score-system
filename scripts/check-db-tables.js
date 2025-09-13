const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接数据库
const dbPath = path.join(__dirname, '..', 'expert_review.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 检查数据库中的所有表...');

// 获取所有表名
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  if (err) {
    console.error('❌ 获取表列表失败:', err);
    return;
  }
  
  console.log('📋 数据库中的表:');
  if (tables.length === 0) {
    console.log('  (没有表)');
  } else {
    tables.forEach(table => {
      console.log(`  - ${table.name}`);
    });
  }
  
  // 检查每个表的结构
  tables.forEach(table => {
    console.log(`\n🔍 表 ${table.name} 的结构:`);
    db.all(`PRAGMA table_info(${table.name})`, (err, columns) => {
      if (err) {
        console.error(`❌ 获取表 ${table.name} 结构失败:`, err);
        return;
      }
      
      columns.forEach(col => {
        console.log(`  - ${col.name}: ${col.type}`);
      });
    });
  });
  
  db.close();
  console.log('\n🔍 数据库检查完成');
});
