const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'expert_review.db');

console.log('🔧 更新数据库结构...');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ 数据库连接失败:', err.message);
    return;
  }
  console.log('✅ 数据库连接成功');
});

// 检查team_name列是否存在
db.all("PRAGMA table_info(files)", (err, columns) => {
  if (err) {
    console.error('❌ 查询表结构失败:', err.message);
    return;
  }
  
  const hasTeamName = columns.some(col => col.name === 'team_name');
  
  if (!hasTeamName) {
    console.log('📝 添加team_name列...');
    
    db.run("ALTER TABLE files ADD COLUMN team_name TEXT", (err) => {
      if (err) {
        console.error('❌ 添加列失败:', err.message);
        return;
      }
      
      console.log('✅ team_name列添加成功');
      
      // 更新现有数据
      db.run("UPDATE files SET team_name = original_name WHERE team_name IS NULL", (err) => {
        if (err) {
          console.error('❌ 更新现有数据失败:', err.message);
          return;
        }
        
        console.log('✅ 现有数据更新完成');
        
        // 验证更新结果
        db.all("SELECT id, original_name, team_name FROM files", (err, rows) => {
          if (err) {
            console.error('❌ 查询数据失败:', err.message);
            return;
          }
          
          console.log('\n📁 更新后的文件列表:');
          rows.forEach(file => {
            console.log(`  - ID: ${file.id}, 原始名称: ${file.original_name}, 团队名称: ${file.team_name}`);
          });
          
          db.close((err) => {
            if (err) {
              console.error('❌ 关闭数据库失败:', err.message);
            } else {
              console.log('\n🎉 数据库结构更新完成！');
            }
          });
        });
      });
    });
  } else {
    console.log('✅ team_name列已存在');
    
    db.close((err) => {
      if (err) {
        console.error('❌ 关闭数据库失败:', err.message);
      } else {
        console.log('🎉 数据库结构检查完成！');
      }
    });
  }
});
