const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'expert_review.db');
const db = new sqlite3.Database(dbPath);

console.log('🔄 更新数据库结构以支持新的报名表单...');

// 更新teams表结构
function updateTeamsTable() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 添加新的字段
      const newColumns = [
        'ALTER TABLE teams ADD COLUMN project_name TEXT',
        'ALTER TABLE teams ADD COLUMN project_brief TEXT',
        'ALTER TABLE teams ADD COLUMN project_stage TEXT',
        'ALTER TABLE teams ADD COLUMN contact_person_name TEXT',
        'ALTER TABLE teams ADD COLUMN contact_person_position TEXT',
        'ALTER TABLE teams ADD COLUMN contact_person_phone TEXT',
        'ALTER TABLE teams ADD COLUMN contact_person_email TEXT',
        'ALTER TABLE teams ADD COLUMN registration_country TEXT',
        'ALTER TABLE teams ADD COLUMN core_members_nationality TEXT',
        'ALTER TABLE teams ADD COLUMN registration_year INTEGER',
        'ALTER TABLE teams ADD COLUMN unified_social_credit_code TEXT',
        'ALTER TABLE teams ADD COLUMN legal_representative TEXT',
        'ALTER TABLE teams ADD COLUMN headquarters_location TEXT',
        'ALTER TABLE teams ADD COLUMN registered_capital_usd INTEGER',
        'ALTER TABLE teams ADD COLUMN website TEXT',
        'ALTER TABLE teams ADD COLUMN enterprise_overview TEXT',
        'ALTER TABLE teams ADD COLUMN business_license_path TEXT',
        'ALTER TABLE teams ADD COLUMN commitment_letter_path TEXT',
        'ALTER TABLE teams ADD COLUMN business_plan_path TEXT',
        'ALTER TABLE teams ADD COLUMN technical_info_path TEXT',
        'ALTER TABLE teams ADD COLUMN presentation_path TEXT',
        'ALTER TABLE teams ADD COLUMN supplementary_materials_path TEXT'
      ];

      let completed = 0;
      const total = newColumns.length;

      newColumns.forEach((sql, index) => {
        db.run(sql, (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.error(`添加列失败 (${index + 1}/${total}):`, err.message);
          } else if (!err) {
            console.log(`✅ 添加列成功 (${index + 1}/${total})`);
          }
          
          completed++;
          if (completed === total) {
            resolve();
          }
        });
      });
    });
  });
}

// 创建核心成员表
function createCoreMembersTable() {
  return new Promise((resolve, reject) => {
    db.run(`
      CREATE TABLE IF NOT EXISTS core_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_id INTEGER NOT NULL,
        member_order INTEGER NOT NULL,
        name TEXT NOT NULL,
        nationality TEXT,
        gender TEXT,
        birth_date TEXT,
        id_type TEXT,
        id_number TEXT,
        phone TEXT,
        email TEXT,
        university TEXT,
        highest_degree TEXT,
        organization TEXT,
        position TEXT,
        cv_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) {
        console.error('创建core_members表失败:', err);
        reject(err);
      } else {
        console.log('✅ core_members表创建成功');
        resolve();
      }
    });
  });
}

// 创建文档表
function createDocumentsTable() {
  return new Promise((resolve, reject) => {
    db.run(`
      CREATE TABLE IF NOT EXISTS team_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_id INTEGER NOT NULL,
        document_type TEXT NOT NULL,
        document_name TEXT NOT NULL,
        document_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) {
        console.error('创建team_documents表失败:', err);
        reject(err);
      } else {
        console.log('✅ team_documents表创建成功');
        resolve();
      }
    });
  });
}

// 更新users表，添加专家类型
function updateUsersTable() {
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

// 执行更新
async function runUpdate() {
  try {
    await updateTeamsTable();
    await createCoreMembersTable();
    await createDocumentsTable();
    await updateUsersTable();
    
    console.log('\n🎉 数据库结构更新完成！');
    console.log('\n📋 更新内容:');
    console.log('✅ teams表添加新字段');
    console.log('✅ 创建core_members表');
    console.log('✅ 创建team_documents表');
    console.log('✅ users表添加专家类型字段');
    
  } catch (error) {
    console.error('❌ 更新失败:', error);
  } finally {
    db.close();
  }
}

runUpdate();
