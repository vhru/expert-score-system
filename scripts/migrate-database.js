const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'expert_review.db');
const db = new sqlite3.Database(dbPath);

console.log('🔄 开始数据库迁移...');

// 检查并更新teams表结构
function migrateTeamsTable() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 检查是否存在is_enterprise列
      db.all("PRAGMA table_info(teams)", (err, columns) => {
        if (err) {
          reject(err);
          return;
        }
        
        const hasEnterpriseColumn = columns.some(col => col.name === 'is_enterprise');
        const hasEnterpriseNameColumn = columns.some(col => col.name === 'enterprise_name');
        const hasEnterpriseLicenseColumn = columns.some(col => col.name === 'enterprise_license');
        
        console.log('当前teams表结构:', columns.map(c => c.name));
        
        if (!hasEnterpriseColumn) {
          console.log('添加is_enterprise列...');
          db.run("ALTER TABLE teams ADD COLUMN is_enterprise BOOLEAN DEFAULT 0", (err) => {
            if (err) {
              console.error('添加is_enterprise列失败:', err);
            } else {
              console.log('✅ is_enterprise列添加成功');
            }
          });
        }
        
        if (!hasEnterpriseNameColumn) {
          console.log('添加enterprise_name列...');
          db.run("ALTER TABLE teams ADD COLUMN enterprise_name TEXT", (err) => {
            if (err) {
              console.error('添加enterprise_name列失败:', err);
            } else {
              console.log('✅ enterprise_name列添加成功');
            }
          });
        }
        
        if (!hasEnterpriseLicenseColumn) {
          console.log('添加enterprise_license列...');
          db.run("ALTER TABLE teams ADD COLUMN enterprise_license TEXT", (err) => {
            if (err) {
              console.error('添加enterprise_license列失败:', err);
            } else {
              console.log('✅ enterprise_license列添加成功');
            }
          });
        }
        
        resolve();
      });
    });
  });
}

// 检查并创建team_images表
function migrateTeamImagesTable() {
  return new Promise((resolve, reject) => {
    db.run(`
      CREATE TABLE IF NOT EXISTS team_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_id INTEGER NOT NULL,
        image_name TEXT NOT NULL,
        image_path TEXT NOT NULL,
        image_size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        encrypted_info TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) {
        console.error('创建team_images表失败:', err);
        reject(err);
      } else {
        console.log('✅ team_images表创建成功');
        resolve();
      }
    });
  });
}

// 更新users表，添加专家类型
function migrateUsersTable() {
  return new Promise((resolve, reject) => {
    db.all("PRAGMA table_info(users)", (err, columns) => {
      if (err) {
        reject(err);
        return;
      }
      
      const hasExpertTypeColumn = columns.some(col => col.name === 'expert_type');
      
      if (!hasExpertTypeColumn) {
        console.log('添加expert_type列...');
        db.run("ALTER TABLE users ADD COLUMN expert_type TEXT DEFAULT 'team' CHECK (expert_type IN ('team', 'enterprise'))", (err) => {
          if (err) {
            console.error('添加expert_type列失败:', err);
          } else {
            console.log('✅ expert_type列添加成功');
          }
          resolve();
        });
      } else {
        console.log('✅ expert_type列已存在');
        resolve();
      }
    });
  });
}

// 执行迁移
async function runMigration() {
  try {
    await migrateTeamsTable();
    await migrateTeamImagesTable();
    await migrateUsersTable();
    
    console.log('\n🎉 数据库迁移完成！');
    console.log('\n📋 迁移内容:');
    console.log('✅ teams表添加企业相关字段');
    console.log('✅ 创建team_images表');
    console.log('✅ users表添加专家类型字段');
    
  } catch (error) {
    console.error('❌ 迁移失败:', error);
  } finally {
    db.close();
  }
}

runMigration();
