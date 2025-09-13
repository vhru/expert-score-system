const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接数据库
const dbPath = path.join(__dirname, '..', 'expert_review.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 开始更新teams表结构...');

// 检查表结构
db.all("PRAGMA table_info(teams)", (err, columns) => {
  if (err) {
    console.error('❌ 检查表结构失败:', err);
    return;
  }
  
  console.log('📋 当前teams表结构:');
  columns.forEach(col => {
    console.log(`  - ${col.name}: ${col.type}`);
  });
  
  // 检查是否存在project_stage_others字段
  const hasProjectStageOthers = columns.some(col => col.name === 'project_stage_others');
  
  if (!hasProjectStageOthers) {
    console.log('➕ 添加project_stage_others字段...');
    db.run('ALTER TABLE teams ADD COLUMN project_stage_others TEXT', (err) => {
      if (err) {
        console.error('❌ 添加字段失败:', err);
      } else {
        console.log('✅ project_stage_others字段添加成功');
      }
      
      // 再次检查表结构
      db.all("PRAGMA table_info(teams)", (err, newColumns) => {
        if (err) {
          console.error('❌ 检查更新后表结构失败:', err);
        } else {
          console.log('📋 更新后teams表结构:');
          newColumns.forEach(col => {
            console.log(`  - ${col.name}: ${col.type}`);
          });
        }
        
        db.close();
        console.log('🔧 数据库更新完成');
      });
    });
  } else {
    console.log('✅ project_stage_others字段已存在');
    db.close();
  }
});
