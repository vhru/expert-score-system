const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function checkDatabaseSchema() {
  const dbPath = path.join(__dirname, '../data/expert_review.db');
  
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
        return;
      }
      
      console.log('✅ 数据库连接成功');
      
      // 获取所有表名
      db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        if (err) {
          reject(err);
          return;
        }
        
        console.log('\n📋 数据库表列表:');
        tables.forEach(table => {
          console.log(`  - ${table.name}`);
        });
        
        // 检查每个表的结构
        const checkTable = (index) => {
          if (index >= tables.length) {
            db.close();
            resolve();
            return;
          }
          
          const tableName = tables[index].name;
          db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
            if (err) {
              console.error(`❌ 检查表 ${tableName} 失败:`, err.message);
              checkTable(index + 1);
              return;
            }
            
            console.log(`\n📊 表 ${tableName} 结构:`);
            columns.forEach(col => {
              console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
            });
            
            checkTable(index + 1);
          });
        };
        
        checkTable(0);
      });
    });
  });
}

checkDatabaseSchema().catch(console.error);
