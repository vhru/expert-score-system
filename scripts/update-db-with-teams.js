const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'expert_review.db');

console.log('🔧 更新数据库结构，添加团队表...');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ 数据库连接失败:', err.message);
    return;
  }
  console.log('✅ 数据库连接成功');
});

// 创建团队表
db.run(`
  CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_name TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    contact_email TEXT UNIQUE NOT NULL,
    encrypted_info TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) {
    console.error('❌ 创建团队表失败:', err.message);
    return;
  }
  
  console.log('✅ 团队表创建成功');
  
  // 创建索引
  db.run(`CREATE INDEX IF NOT EXISTS idx_teams_name ON teams(team_name)`, (err) => {
    if (err) {
      console.error('❌ 创建团队索引失败:', err.message);
      return;
    }
    
    console.log('✅ 团队索引创建成功');
    
    // 检查现有表
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
      if (err) {
        console.error('❌ 查询表失败:', err.message);
        return;
      }
      
      console.log('\n📋 数据库表列表:');
      tables.forEach(table => {
        console.log(`  - ${table.name}`);
      });
      
      db.close((err) => {
        if (err) {
          console.error('❌ 关闭数据库失败:', err.message);
        } else {
          console.log('\n🎉 数据库结构更新完成！');
          console.log('\n📋 现在支持的功能:');
          console.log('1. 团队注册和登录');
          console.log('2. 团队作品管理');
          console.log('3. 评审状态跟踪');
          console.log('4. 数据安全加密');
        }
      });
    });
  });
});
