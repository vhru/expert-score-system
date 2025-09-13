const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接数据库
const dbPath = path.join(__dirname, '..', 'expert_review.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 开始初始化数据库...');

// 创建表
db.serialize(() => {
  // 创建用户表
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'expert' CHECK (role IN ('admin', 'expert')),
      encrypted_info TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('❌ 创建users表失败:', err);
    else console.log('✅ users表创建成功');
  });

  // 创建团队表
  db.run(`
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_name TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      contact_email TEXT UNIQUE NOT NULL,
      encrypted_info TEXT,
      is_enterprise BOOLEAN DEFAULT 0,
      enterprise_name TEXT,
      enterprise_license TEXT,
      project_stage TEXT,
      project_stage_others TEXT,
      nationality_type TEXT DEFAULT 'single' CHECK (nationality_type IN ('single', 'multiple')),
      selected_countries TEXT,
      nationality_others TEXT,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('❌ 创建teams表失败:', err);
    else console.log('✅ teams表创建成功');
  });

  // 创建核心成员表
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
    if (err) console.error('❌ 创建core_members表失败:', err);
    else console.log('✅ core_members表创建成功');
  });

  // 创建团队文档表
  db.run(`
    CREATE TABLE IF NOT EXISTS team_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL,
      document_type TEXT NOT NULL,
      document_name TEXT NOT NULL,
      document_path TEXT NOT NULL,
      document_size INTEGER NOT NULL,
      mime_type TEXT NOT NULL,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) console.error('❌ 创建team_documents表失败:', err);
    else console.log('✅ team_documents表创建成功');
  });

  // 检查表是否创建成功
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
      console.error('❌ 检查表失败:', err);
    } else {
      console.log('📋 数据库中的表:');
      tables.forEach(table => {
        console.log(`  - ${table.name}`);
      });
    }
    
    db.close();
    console.log('🔧 数据库初始化完成');
  });
});
